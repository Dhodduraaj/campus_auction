# Database Schema Diagram & Physical Architecture

This document outlines the physical database schema, data types, constraints, index optimization, and concurrency locking mechanisms implemented in PostgreSQL 17.

---

## 1. Physical Table Layout & Data Types

```mermaid
classDiagram
    direction TB

    class users {
        +BIGINT id PK
        +VARCHAR(100) name
        +VARCHAR(150) email UNIQUE
        +VARCHAR(255) password_hash
        +VARCHAR(30) campus_verification_status
        +VARCHAR(20) role
        +VARCHAR(50) student_id
        +VARCHAR(30) phone_number
        +TIMESTAMPTZ created_at
        +TIMESTAMPTZ updated_at
    }

    class listings {
        +BIGINT id PK
        +BIGINT seller_id FK
        +VARCHAR(200) title
        +VARCHAR(50) category
        +TEXT description
        +VARCHAR(30) condition
        +NUMERIC(12,2) starting_price
        +NUMERIC(12,2) minimum_bid_increment
        +NUMERIC(12,2) current_highest_bid
        +BIGINT leading_bidder_id FK
        +INT bid_count
        +TIMESTAMPTZ closing_at
        +VARCHAR(40) status
        +TEXT cancellation_reason
        +TIMESTAMPTZ created_at
        +TIMESTAMPTZ updated_at
        +TIMESTAMPTZ closed_at
    }

    class listing_images {
        +BIGINT id PK
        +BIGINT listing_id FK
        +VARCHAR(500) image_url
        +INT display_order
    }

    class bids {
        +BIGINT id PK
        +BIGINT listing_id FK
        +BIGINT bidder_id FK
        +NUMERIC(12,2) amount
        +TIMESTAMPTZ created_at
    }

    class auction_outcomes {
        +BIGINT id PK
        +BIGINT listing_id FK UNIQUE
        +BIGINT provisional_winner_id FK
        +BIGINT winning_bid_id FK
        +VARCHAR(40) final_status
        +VARCHAR(30) seller_decision
        +TEXT decision_reason
        +TIMESTAMPTZ decided_at
        +TIMESTAMPTZ completed_at
    }

    class handovers {
        +BIGINT id PK
        +BIGINT listing_id FK UNIQUE
        +BOOLEAN seller_confirmation
        +BOOLEAN winner_confirmation
        +TIMESTAMPTZ seller_confirmed_at
        +TIMESTAMPTZ winner_confirmed_at
        +VARCHAR(40) outcome
        +TEXT failure_reason
        +TIMESTAMPTZ completed_at
    }

    class notifications {
        +BIGINT id PK
        +BIGINT recipient_id FK
        +VARCHAR(50) event_type
        +VARCHAR(200) title
        +TEXT message
        +BIGINT related_listing_id FK
        +TIMESTAMPTZ created_at
        +TIMESTAMPTZ read_at
    }

    class audit_events {
        +BIGINT id PK
        +BIGINT listing_id FK
        +BIGINT actor_id FK
        +VARCHAR(60) event_type
        +TEXT event_details
        +TIMESTAMPTZ created_at
    }

    users "1" --> "*" listings : seller_id
    users "1" --> "*" bids : bidder_id
    users "1" --> "*" notifications : recipient_id
    listings "1" --> "*" listing_images : listing_id
    listings "1" --> "*" bids : listing_id
    listings "1" --> "0..1" auction_outcomes : listing_id
    listings "1" --> "0..1" handovers : listing_id
    listings "1" --> "*" audit_events : listing_id
```

---

## 2. High-Performance Index Specifications

PostgreSQL composite and targeted B-Tree indexes are defined in `V1__initial_schema.sql` to optimize query latency and prevent full table scans under high concurrent traffic:

| Index Name | Target Table | Target Columns | Primary Purpose |
|---|---|---|---|
| `idx_listings_status_closing` | `listings` | `(status, closing_at)` | **Scheduler Optimization**: Accelerates `closeExpiredAuctions()` query `WHERE status = 'OPEN' AND closing_at <= NOW()`. |
| `idx_listings_seller` | `listings` | `(seller_id)` | **Student Activity**: Fast lookup of listings created by the authenticated student. |
| `idx_listings_category` | `listings` | `(category)` | **Marketplace Filtering**: Category tabs and faceted filtering. |
| `idx_listings_condition` | `listings` | `(condition)` | **Marketplace Filtering**: Filtering items by condition (New, Like New, Good, etc.). |
| `idx_listings_current_price`| `listings` | `(current_highest_bid)` | **Price Sorting**: Accelerates price range and sort order queries. |
| `idx_bids_listing` | `bids` | `(listing_id, created_at DESC)` | **Bid History Table**: Rapid retrieval of chronological bids for auction details page. |
| `idx_bids_bidder` | `bids` | `(bidder_id)` | **My Bids Activity**: Rapid lookup of all auctions where user has active bids. |
| `idx_notifications_recipient`| `notifications` | `(recipient_id, read_at)` | **Unread Notification Bell**: Instant count and fetching of unread student notifications. |
| `idx_audit_listing` | `audit_events` | `(listing_id)` | **Audit History**: Administrative and compliance tracking per auction item. |

---

## 3. Concurrency Protection & Row-Level Locking

To guarantee fair bidding under simultaneous requests:

```sql
-- Executed inside @Transactional(isolation = Isolation.READ_COMMITTED)
SELECT * FROM listings 
WHERE id = :listingId 
FOR UPDATE; -- PESSIMISTIC_WRITE lock prevents lost updates
```

1. **Transaction A** acquires the exclusive lock on `listing_id = 4`.
2. **Transaction B** attempting to bid simultaneously on `listing_id = 4` blocks safely until Transaction A commits or rolls back.
3. Transaction B re-reads the updated, committed `current_highest_bid` directly from PostgreSQL and evaluates the increment rule against real data.
