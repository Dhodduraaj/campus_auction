# Entity-Relationship (ER) Diagram — Campus Auction Platform

This document details the relational data model for the **Campus Auction Platform**, representing entity relationships, foreign keys, and cardinalities.

---

## 1. Complete ER Diagram

```mermaid
erDiagram
    USERS {
        bigserial id PK
        varchar(100) name
        varchar(150) email UK
        varchar(255) password_hash
        varchar(30) campus_verification_status
        varchar(20) role
        varchar(50) student_id
        varchar(30) phone_number
        timestamptz created_at
        timestamptz updated_at
    }

    LISTINGS {
        bigserial id PK
        bigint seller_id FK
        varchar(200) title
        varchar(50) category
        text description
        varchar(30) condition
        numeric(12_2) starting_price
        numeric(12_2) minimum_bid_increment
        numeric(12_2) current_highest_bid
        bigint leading_bidder_id FK
        int bid_count
        timestamptz closing_at
        varchar(40) status
        text cancellation_reason
        timestamptz created_at
        timestamptz updated_at
        timestamptz closed_at
    }

    LISTING_IMAGES {
        bigserial id PK
        bigint listing_id FK
        varchar(500) image_url
        int display_order
    }

    BIDS {
        bigserial id PK
        bigint listing_id FK
        bigint bidder_id FK
        numeric(12_2) amount
        timestamptz created_at
    }

    AUCTION_OUTCOMES {
        bigserial id PK
        bigint listing_id FK, UK
        bigint provisional_winner_id FK
        bigint winning_bid_id FK
        varchar(40) final_status
        varchar(30) seller_decision
        text decision_reason
        timestamptz decided_at
        timestamptz completed_at
    }

    HANDOVERS {
        bigserial id PK
        bigint listing_id FK, UK
        boolean seller_confirmation
        boolean winner_confirmation
        timestamptz seller_confirmed_at
        timestamptz winner_confirmed_at
        varchar(40) outcome
        text failure_reason
        timestamptz completed_at
    }

    NOTIFICATIONS {
        bigserial id PK
        bigint recipient_id FK
        varchar(50) event_type
        varchar(200) title
        text message
        bigint related_listing_id FK
        timestamptz created_at
        timestamptz read_at
    }

    AUDIT_EVENTS {
        bigserial id PK
        bigint listing_id FK
        bigint actor_id FK
        varchar(60) event_type
        text event_details
        timestamptz created_at
    }

    %% Relationships and Cardinality
    USERS ||--o{ LISTINGS : "creates/sells"
    USERS ||--o{ BIDS : "places"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_EVENTS : "triggers"
    USERS ||--o{ AUCTION_OUTCOMES : "wins as provisional"
    USERS |o--o{ LISTINGS : "leads as highest bidder"

    LISTINGS ||--|{ LISTING_IMAGES : "has photos (CASCADE)"
    LISTINGS ||--o{ BIDS : "accumulates (append-only)"
    LISTINGS ||--o| AUCTION_OUTCOMES : "produces outcome (1-to-1)"
    LISTINGS ||--o| HANDOVERS : "tracks physical transfer (1-to-1)"
    LISTINGS ||--o{ AUDIT_EVENTS : "audit trail"
    LISTINGS ||--o{ NOTIFICATIONS : "generates notifications"

    BIDS ||--o| AUCTION_OUTCOMES : "referenced as winning bid"
```

---

## 2. Cardinality and Structural Integrity Rules

| Parent Entity | Relationship | Child Entity | Cardinality | Deletion / Mutation Rule |
|---|---|---|---|---|
| `USERS` | Sells | `LISTINGS` | $1 : N$ | Restricted: Seller account cannot be deleted while active auctions exist. |
| `USERS` | Places | `BIDS` | $1 : N$ | Append-only: User cannot delete submitted bids. |
| `LISTINGS` | Owns | `LISTING_IMAGES` | $1 : N$ | Cascade Delete: Removing draft listing purges image metadata references. |
| `LISTINGS` | Receives | `BIDS` | $1 : N$ | Append-only: Bids are preserved permanently even after auction closure or cancellation. |
| `LISTINGS` | Outcome | `AUCTION_OUTCOMES` | $1 : 0..1$ | Unique constraint: Exactly one outcome row per closed auction. |
| `LISTINGS` | Handover | `HANDOVERS` | $1 : 0..1$ | Unique constraint: Exactly one handover lifecycle per reserved auction. |
| `USERS` | Receives | `NOTIFICATIONS` | $1 : N$ | Private: Visible and accessible strictly by `recipient_id`. |
| `LISTINGS` | Audited by | `AUDIT_EVENTS` | $1 : N$ | Immutable log: Historical trail of creation, bids, closures, and cancellations. |

---

## 3. Decimal-Safe Representation
- All monetary columns (`starting_price`, `minimum_bid_increment`, `current_highest_bid`, `amount`) are modeled as `NUMERIC(12, 2)`.
- Never floating-point: prevents IEEE 754 precision inaccuracies during increments and comparisons.
