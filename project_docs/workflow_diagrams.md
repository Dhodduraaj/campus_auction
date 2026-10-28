# Workflow & State Machine Diagrams — Campus Auction Platform

This document models the business logic, state machines, concurrency handling, and interaction flows across the **Campus Auction Platform**.

---

## 1. Auction Lifecycle State Machine

The auction lifecycle is modeled as a deterministic finite-state machine to prevent invalid status transitions and race conditions:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Seller drafts listing
    DRAFT --> OPEN : Seller publishes listing (validates closing time > now + 5m)
    
    OPEN --> OPEN : Valid bid accepted (atomically updates leading bid & bidder)
    OPEN --> CANCELLED : Seller cancels auction (allowed only before close, bid history preserved)
    
    state "Closing Boundary (UTC Clock)" as ClosingRule
    OPEN --> ClosingRule : closing_at <= NOW()
    
    ClosingRule --> UNSOLD : 0 accepted bids placed
    ClosingRule --> AWAITING_SELLER_APPROVAL : Has >= 1 accepted bid (Provisional winner assigned)
    
    AWAITING_SELLER_APPROVAL --> SELLER_REJECTED : Seller rejects reserve price (with optional reason)
    AWAITING_SELLER_APPROVAL --> RESERVED : Seller approves winning bid (Handover record initialized)
    
    state "Campus Handover Verification" as HandoverState
    RESERVED --> HandoverState : Physical exchange coordination
    
    HandoverState --> SOLD : Dual confirmation (Both Seller & Winner confirm exchange)
    HandoverState --> PICKUP_FAILED : Either party reports verified pickup failure
    
    UNSOLD --> [*]
    CANCELLED --> [*]
    SELLER_REJECTED --> [*]
    SOLD --> [*]
    PICKUP_FAILED --> [*]
```

---

## 2. Concurrent Bidding Engine Sequence Diagram

Demonstrating how two students (Bidder A and Bidder B) submitting simultaneous bids are serialized cleanly without lost updates or race conditions:

```mermaid
sequenceDiagram
    autonumber
    actor BidderA as Junior Student A ($525.00)
    actor BidderB as Junior Student B ($525.00)
    participant API as BidController
    participant Service as BiddingService
    participant Repo as ListingRepository
    participant DB as PostgreSQL 17 (Pessimistic Lock)
    participant WS as WebSocket STOMP Broker
    participant OutbidUser as Previous Leading Bidder

    Note over BidderA,BidderB: Both click 'Place Secure Bid' at the exact same millisecond

    par Thread A
        BidderA->>API: POST /api/listings/4/bids { amount: 525.00 }
        API->>Service: placeBid(listingId=4, amount=525.00, userA)
        Service->>Repo: findByIdWithPessimisticLock(4)
        Repo->>DB: SELECT * FROM listings WHERE id=4 FOR UPDATE
        activate DB
        Note over DB: Lock granted to Thread A
    and Thread B
        BidderB->>API: POST /api/listings/4/bids { amount: 525.00 }
        API->>Service: placeBid(listingId=4, amount=525.00, userB)
        Service->>Repo: findByIdWithPessimisticLock(4)
        Repo->>DB: SELECT * FROM listings WHERE id=4 FOR UPDATE
        Note over DB: Thread B waits on row lock
    end

    Note over Service: Validates: User != Seller, Status == OPEN, Now < ClosingAt, Amount >= MinAcceptable ($525 >= $525)
    Service->>DB: INSERT INTO bids (listing_id, bidder_id, amount, created_at)
    Service->>DB: UPDATE listings SET current_highest_bid=525.00, leading_bidder_id=A, bid_count=bid_count+1
    Service->>DB: COMMIT TRANSACTION
    deactivate DB
    Note over DB: Thread A commits. Lock released to Thread B

    Service->>WS: Broadcast to /topic/auctions/4/bids & /topic/auctions/4
    Service->>OutbidUser: Push Outbid notification
    Service-->>BidderA: 201 Created { success: true, bid: 525.00, status: LEADING }

    activate DB
    Note over DB: Lock granted to Thread B. Reads committed state (current_highest_bid = 525.00)
    Service->>DB: Re-read listing state inside transaction
    Note over Service: Re-evaluates increment rule: MinAcceptable is now $550.00 ($525 + $25 increment)
    Note over Service: Validation Fails: $525.00 < $550.00
    Service->>DB: ROLLBACK TRANSACTION
    deactivate DB
    Service-->>BidderB: 422 Unprocessable Entity ("Bid of $525.00 is below minimum required bid of $550.00")
```

---

## 3. Automated Auction Closing Engine Flow

Independent background process evaluating auctions strictly by authoritative server timestamps:

```mermaid
flowchart TD
    Start([Scheduled Execution Every 5 Seconds]) --> Query[Query DB: SELECT id FROM listings WHERE status = 'OPEN' AND closing_at <= NOW]
    Query --> CheckListings{Any Expired Listings Found?}
    
    CheckListings -- No --> Sleep([Wait 5s for Next Tick])
    CheckListings -- Yes --> ForEach[Iterate through Expired Listings]
    
    ForEach --> AcquireLock[Acquire Pessimistic Lock on Listing Row]
    AcquireLock --> IdempotencyCheck{Outcome Already Exists\nor Status != OPEN?}
    
    IdempotencyCheck -- Yes --> Skip[Skip Processing to Guarantee Idempotency]
    IdempotencyCheck -- No --> CheckBids{Count of Accepted Bids > 0?}
    
    CheckBids -- No (0 Bids) --> MarkUnsold[Set listing.status = UNSOLD\nSet listing.closed_at = NOW]
    MarkUnsold --> SaveUnsoldOutcome[Create AuctionOutcome: final_status = UNSOLD]
    SaveUnsoldOutcome --> NotifySellerUnsold[Notify Seller: Item Ended Unsold]
    NotifySellerUnsold --> BroadcastUnsold[Broadcast WebSocket Update]
    
    CheckBids -- Yes (>= 1 Bid) --> FindHighest[Query BidRepository for Highest Bid]
    FindHighest --> MarkPendingApproval[Set listing.status = AWAITING_SELLER_APPROVAL\nAssign provisional_winner]
    MarkPendingApproval --> SaveApprovalOutcome[Create AuctionOutcome: provisional_winner, winning_bid]
    SaveApprovalOutcome --> NotifyParties[Notify Seller: Winning Bid Awaiting Approval\nNotify Winner: You Won the Bidding!]
    NotifyParties --> BroadcastApproval[Broadcast WebSocket Update]
    
    Skip --> NextItem{More Expired Items?}
    BroadcastUnsold --> NextItem
    BroadcastApproval --> NextItem
    
    NextItem -- Yes --> ForEach
    NextItem -- No --> Sleep
```

---

## 4. Campus Handover Dual-Confirmation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Senior Seller
    actor Buyer as Winning Junior Buyer
    participant API as HandoverController
    participant Service as HandoverService
    participant DB as PostgreSQL (handovers table)
    participant WS as WebSocket STOMP

    Note over Seller,Buyer: Auction closed with accepted bids. Seller reviews offer.
    Seller->>API: POST /api/listings/{id}/approve-winner
    API->>Service: handleSellerDecision(listingId, approved=true)
    Service->>DB: UPDATE listings SET status = 'RESERVED'
    Service->>DB: INSERT INTO handovers (listing_id, outcome='PENDING')
    Service->>WS: Broadcast status 'RESERVED'
    Service->>Buyer: Notify: 'Seller Approved! Coordinate Campus Handover'

    Note over Seller,Buyer: Students meet in-person on campus (library/hostel) & exchange item

    Seller->>API: POST /api/listings/{id}/confirm-handover
    API->>Service: confirmHandover(listingId, user=Seller)
    Service->>DB: UPDATE handovers SET seller_confirmation=true, seller_confirmed_at=NOW
    Service-->>Seller: 200 OK (Seller Confirmed: YES, Buyer Confirmed: PENDING)

    Buyer->>API: POST /api/listings/{id}/confirm-handover
    API->>Service: confirmHandover(listingId, user=Buyer)
    Service->>DB: UPDATE handovers SET winner_confirmation=true, winner_confirmed_at=NOW
    Note over Service: Both parties confirmed! Finalize sale
    Service->>DB: UPDATE handovers SET outcome='COMPLETED', completed_at=NOW
    Service->>DB: UPDATE listings SET status='SOLD', closed_at=NOW
    Service->>DB: UPDATE auction_outcomes SET final_status='SOLD'
    Service->>WS: Broadcast status 'SOLD'
    Service->>Seller: Notify: 'Sale Complete: Both Parties Confirmed'
    Service->>Buyer: Notify: 'Purchase Complete: Enjoy your item!'
```
