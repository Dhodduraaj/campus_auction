package com.campusauction.ai;

import com.campusauction.ai.dto.*;
import com.campusauction.bid.BiddingService;
import com.campusauction.bid.dto.BidDto;
import com.campusauction.bid.dto.PlaceBidRequest;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.common.exception.BadRequestException;
import com.campusauction.common.exception.ForbiddenException;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingRepository;
import com.campusauction.listing.dto.ListingCardDto;
import com.campusauction.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final GroqClient groqClient;
    private final ListingRepository listingRepository;
    private final AiBidAuthorizationRepository authRepository;
    private final BiddingService biddingService;

    private static final Pattern BUDGET_PATTERN = Pattern.compile("(?:under|below|up to|budget|max(?:imum)?(?: of)?|at most|for|₹|rs\\.?|inr)?\\s*(?:₹|rs\\.?|inr)?\\s*(\\d{2,6})(?:\\s*(?:rs|inr|rupees|bucks))?", Pattern.CASE_INSENSITIVE);
    private static final Pattern BID_INTENT_PATTERN = Pattern.compile("\\b(bid|place a? bid|bid on|bid for me|auto bid|help me bid)\\b", Pattern.CASE_INSENSITIVE);

    @Transactional
    public AiChatResponse chat(AiChatRequest request, User currentUser) {
        String query = request.getMessage() != null ? request.getMessage().trim() : "";
        if (query.isEmpty()) {
            throw new BadRequestException("Query cannot be empty.");
        }

        // 1. Retrieve authoritative active open listings from PostgreSQL
        OffsetDateTime now = OffsetDateTime.now();
        List<Listing> allOpenListings = listingRepository.findByStatusOrderByClosingAtAsc(ListingStatus.OPEN).stream()
                .filter(l -> !l.isExpired(now))
                .toList();

        // 2. Filter & rank listings based on query constraints
        List<Listing> matchedListings = filterAndRankListings(query, allOpenListings);
        List<ListingCardDto> recommendedCards = matchedListings.stream()
                .limit(4)
                .map(ListingCardDto::fromEntity)
                .toList();

        // 3. Check for bidding intent
        boolean hasBiddingIntent = BID_INTENT_PATTERN.matcher(query).find();
        AiBidConfirmationDto bidConfirmation = null;
        String biddingNote = null;

        if (hasBiddingIntent) {
            if (currentUser != null && currentUser.getRole() == Role.SENIOR) {
                biddingNote = "As a Senior seller account, you can create listings and view auction activity, but only Junior accounts are permitted to place bids.";
            } else if (currentUser != null && currentUser.getRole() == Role.JUNIOR) {
                // Find target listing for bidding
                Listing targetListing = matchedListings.isEmpty() ? null : matchedListings.get(0);
                if (targetListing != null) {
                    BigDecimal extractedLimit = extractBudgetLimit(query);
                    if (extractedLimit != null && extractedLimit.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal nextValidBid = targetListing.getMinimumAcceptableBid();
                        if (nextValidBid.compareTo(extractedLimit) > 0) {
                            biddingNote = "The next minimum valid bid for '" + targetListing.getTitle() + "' is ₹" + nextValidBid +
                                    ", which exceeds your specified limit of ₹" + extractedLimit + ". No bid confirmation was created.";
                        } else {
                            // Create server-validated, short-lived authorization token (5 mins)
                            String authToken = UUID.randomUUID().toString().replace("-", "");
                            OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(5);

                            AiBidAuthorization auth = AiBidAuthorization.builder()
                                    .authToken(authToken)
                                    .user(currentUser)
                                    .listing(targetListing)
                                    .maxAuthorizedAmount(extractedLimit)
                                    .exactBidAmount(nextValidBid)
                                    .status("PENDING")
                                    .expiresAt(expiresAt)
                                    .build();
                            authRepository.save(auth);

                            String imageUrl = (targetListing.getImages() != null && !targetListing.getImages().isEmpty())
                                    ? targetListing.getImages().get(0).getImageUrl() : null;

                            bidConfirmation = AiBidConfirmationDto.builder()
                                    .authToken(authToken)
                                    .listingId(targetListing.getId())
                                    .listingTitle(targetListing.getTitle())
                                    .listingImageUrl(imageUrl)
                                    .currentHighestBid(targetListing.getCurrentHighestBid())
                                    .minimumNextValidBid(nextValidBid)
                                    .exactBidAmount(nextValidBid)
                                    .maxAuthorizedAmount(extractedLimit)
                                    .closingAt(targetListing.getClosingAt())
                                    .expiresAt(expiresAt)
                                    .build();

                            biddingNote = "I have prepared the next valid bid of ₹" + nextValidBid + " for '" + targetListing.getTitle() +
                                    "' within your maximum budget of ₹" + extractedLimit + ". Please review and confirm your bid below.";
                        }
                    } else {
                        biddingNote = "To help you bid on '" + targetListing.getTitle() + "', what is your maximum authorized limit in ₹?";
                    }
                }
            }
        }

        // 4. Generate AI response using Groq grounded in actual database listings
        String aiReply = generateGroundedAiReply(query, recommendedCards, biddingNote, request.getConversationHistory(), currentUser);

        return AiChatResponse.builder()
                .reply(aiReply)
                .recommendations(recommendedCards)
                .bidConfirmation(bidConfirmation)
                .build();
    }

    @Transactional
    public BidDto confirmBid(AiConfirmBidRequest request, User currentUser) {
        if (currentUser.getRole() != Role.JUNIOR && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only Junior accounts are authorized to place bids.");
        }

        AiBidAuthorization auth = authRepository.findByAuthToken(request.getAuthToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired bid authorization token."));

        if (!"PENDING".equalsIgnoreCase(auth.getStatus())) {
            throw new BadRequestException("This bid authorization has already been processed or cancelled.");
        }

        if (auth.getExpiresAt().isBefore(OffsetDateTime.now())) {
            auth.setStatus("EXPIRED");
            authRepository.save(auth);
            throw new BadRequestException("Bid authorization has expired. Please request a fresh bid preview.");
        }

        if (!auth.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Unauthorized: Token does not match authenticated user.");
        }

        Listing listing = auth.getListing();
        if (listing.getStatus() != ListingStatus.OPEN || listing.isExpired(OffsetDateTime.now())) {
            auth.setStatus("REJECTED");
            authRepository.save(auth);
            throw new BadRequestException("Auction is no longer open for bidding.");
        }

        // Validate price hasn't increased past authorized max
        BigDecimal currentMinAcceptable = listing.getMinimumAcceptableBid();
        if (currentMinAcceptable.compareTo(auth.getMaxAuthorizedAmount()) > 0) {
            auth.setStatus("REJECTED");
            authRepository.save(auth);
            throw new BadRequestException("Auction price has updated. Minimum required bid is now ₹" + currentMinAcceptable +
                    ", which exceeds your authorized limit of ₹" + auth.getMaxAuthorizedAmount() + ".");
        }

        // Execute bid via the authoritative transactional BiddingService
        PlaceBidRequest bidReq = new PlaceBidRequest();
        bidReq.setAmount(auth.getExactBidAmount());

        BidDto placedBid = biddingService.placeBid(listing.getId(), bidReq, currentUser);

        auth.setStatus("CONFIRMED");
        auth.setUsedAt(OffsetDateTime.now());
        authRepository.save(auth);

        return placedBid;
    }

    private String generateGroundedAiReply(
            String query,
            List<ListingCardDto> recommendedCards,
            String biddingNote,
            List<AiChatMessageDto> history,
            User user
    ) {
        if (biddingNote != null && !recommendedCards.isEmpty()) {
            return biddingNote;
        }

        StringBuilder systemPrompt = new StringBuilder();
        systemPrompt.append("You are the Campus Auction AI Assistant for university students.\n");
        systemPrompt.append("ROLE: You help students find second-hand campus items (cycles, calculators, textbooks, lab equipment, electronics) and answer auction questions.\n");
        systemPrompt.append("CRITICAL RULES:\n");
        systemPrompt.append("1. Ground your answers ONLY in the real active campus auctions provided below. NEVER invent items, prices, or sellers.\n");
        systemPrompt.append("2. Always format prices in Indian Rupees (₹).\n");
        systemPrompt.append("3. Keep responses concise, friendly, and factual (under 100 words).\n");
        systemPrompt.append("4. Junior students can bid; Senior students sell items and cannot place bids.\n");
        systemPrompt.append("CURRENT ACTIVE AUCTIONS ON CAMPUS:\n");

        if (recommendedCards.isEmpty()) {
            systemPrompt.append("No open auctions currently match the user's specific query.\n");
        } else {
            for (ListingCardDto card : recommendedCards) {
                systemPrompt.append(String.format("- [ID: %d] '%s' | Category: %s | Condition: %s | Current Bid: ₹%s | Min Next Bid: ₹%s\n",
                        card.getId(), card.getTitle(), card.getCategory(), card.getCondition(),
                        card.getCurrentHighestBid(), card.getMinimumAcceptableBid()));
            }
        }

        List<Map<String, String>> messages = new ArrayList<>();
        if (history != null) {
            int start = Math.max(0, history.size() - 4);
            for (int i = start; i < history.size(); i++) {
                AiChatMessageDto msg = history.get(i);
                Map<String, String> m = new HashMap<>();
                m.put("role", "user".equalsIgnoreCase(msg.getRole()) ? "user" : "assistant");
                m.put("content", msg.getContent());
                messages.add(m);
            }
        }

        Map<String, String> currentMsg = new HashMap<>();
        currentMsg.put("role", "user");
        currentMsg.put("content", query);
        messages.add(currentMsg);

        String groqResponse = groqClient.generateCompletion(systemPrompt.toString(), messages);
        if (groqResponse != null && !groqResponse.isBlank()) {
            return groqResponse.trim();
        }

        // Deterministic fallback if Groq is temporarily unreachable
        if (recommendedCards.isEmpty()) {
            return "I couldn't find any active campus auctions matching your query right now. Try checking other categories or browse all listings.";
        } else {
            StringBuilder fallback = new StringBuilder("Here are the closest matching campus auctions currently open:\n");
            for (ListingCardDto item : recommendedCards) {
                fallback.append(String.format("• %s — Current bid: ₹%s (Next valid bid: ₹%s)\n",
                        item.getTitle(), item.getCurrentHighestBid(), item.getMinimumAcceptableBid()));
            }
            if (biddingNote != null) {
                fallback.append("\n").append(biddingNote);
            }
            return fallback.toString().trim();
        }
    }

    private List<Listing> filterAndRankListings(String query, List<Listing> listings) {
        String lower = query.toLowerCase();

        // Extract budget constraint if any
        BigDecimal maxBudget = extractBudgetLimit(query);

        // Detect category if mentioned
        ListingCategory targetCategory = null;
        if (lower.contains("cycle") || lower.contains("bicycle") || lower.contains("bike")) {
            targetCategory = ListingCategory.CYCLE;
        } else if (lower.contains("calculator")) {
            targetCategory = ListingCategory.CALCULATOR;
        } else if (lower.contains("book") || lower.contains("textbook") || lower.contains("notes")) {
            targetCategory = ListingCategory.BOOKS;
        } else if (lower.contains("laptop") || lower.contains("phone") || lower.contains("charger") || lower.contains("electronic")) {
            targetCategory = ListingCategory.ELECTRONICS;
        } else if (lower.contains("lab") || lower.contains("apron") || lower.contains("coat") || lower.contains("drafter") || lower.contains("kit")) {
            targetCategory = ListingCategory.LAB_EQUIPMENT;
        } else if (lower.contains("furniture") || lower.contains("chair") || lower.contains("table") || lower.contains("desk") || lower.contains("mattress")) {
            targetCategory = ListingCategory.FURNITURE;
        }

        boolean closingSoonFilter = lower.contains("closing soon") || lower.contains("tonight") || lower.contains("5 min") || lower.contains("ending");

        List<Listing> filtered = new ArrayList<>();
        for (Listing item : listings) {
            // Category check
            if (targetCategory != null && item.getCategory() != targetCategory) {
                // Check if title contains keywords even if category differs
                if (!item.getTitle().toLowerCase().contains(lower.substring(0, Math.min(lower.length(), 4)))) {
                    continue;
                }
            }

            // Budget check
            if (maxBudget != null && maxBudget.compareTo(BigDecimal.ZERO) > 0) {
                if (item.getCurrentHighestBid().compareTo(maxBudget) > 0 && item.getStartingPrice().compareTo(maxBudget) > 0) {
                    continue;
                }
            }

            // Keyword check
            if (targetCategory == null) {
                String[] words = lower.split("\\s+");
                boolean keywordMatch = false;
                for (String w : words) {
                    if (w.length() >= 3 && (item.getTitle().toLowerCase().contains(w) || item.getDescription().toLowerCase().contains(w))) {
                        keywordMatch = true;
                        break;
                    }
                }
                if (!keywordMatch && !closingSoonFilter && maxBudget == null) {
                    continue;
                }
            }

            filtered.add(item);
        }

        // If specific filtering returned results, sort them
        if (!filtered.isEmpty()) {
            if (closingSoonFilter) {
                filtered.sort(Comparator.comparing(Listing::getClosingAt));
            } else if (lower.contains("cheapest") || lower.contains("lowest")) {
                filtered.sort(Comparator.comparing(Listing::getCurrentHighestBid));
            }
            return filtered;
        }

        // Fallback: return general open listings
        List<Listing> fallback = new ArrayList<>(listings);
        if (closingSoonFilter) {
            fallback.sort(Comparator.comparing(Listing::getClosingAt));
        } else {
            fallback.sort(Comparator.comparing(Listing::getCurrentHighestBid));
        }
        return fallback;
    }

    private BigDecimal extractBudgetLimit(String text) {
        try {
            Matcher m = BUDGET_PATTERN.matcher(text);
            BigDecimal found = null;
            while (m.find()) {
                String numStr = m.group(1).replace(",", "");
                BigDecimal val = new BigDecimal(numStr);
                // Plausible item budget between 50 and 500000
                if (val.compareTo(BigDecimal.valueOf(50)) >= 0 && val.compareTo(BigDecimal.valueOf(500000)) <= 0) {
                    found = val;
                }
            }
            return found;
        } catch (Exception ignored) {
            return null;
        }
    }
}
