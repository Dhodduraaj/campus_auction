package com.campusauction.user;

import com.campusauction.auction.AuctionOutcomeRepository;
import com.campusauction.bid.BidRepository;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.exception.ResourceNotFoundException;
import com.campusauction.listing.ListingRepository;
import com.campusauction.user.dto.UserProfileDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BidRepository bidRepository;
    private final AuctionOutcomeRepository auctionOutcomeRepository;

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        long totalListings = listingRepository.findBySellerIdOrderByCreatedAtDesc(userId, Pageable.unpaged()).getTotalElements();
        long activeListings = listingRepository.countBySellerIdAndStatus(userId, ListingStatus.OPEN);

        long totalBidsPlaced = bidRepository.findByBidderIdOrderByCreatedAtDesc(userId, Pageable.unpaged()).getTotalElements();
        long auctionsWon = auctionOutcomeRepository.countByProvisionalWinnerIdAndFinalStatus(userId, ListingStatus.SOLD);

        return UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .campusVerificationStatus(user.getCampusVerificationStatus())
                .studentId(user.getStudentId())
                .phoneNumber(user.getPhoneNumber())
                .createdAt(user.getCreatedAt())
                .totalListingsCount(totalListings)
                .activeListingsCount(activeListings)
                .totalBidsPlacedCount(totalBidsPlaced)
                .auctionsWonCount(auctionsWon)
                .build();
    }
}
