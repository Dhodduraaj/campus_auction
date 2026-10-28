-- Campus Auction Platform Initial Schema
-- PostgreSQL Migration V1

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    campus_verification_status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED',
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    student_id VARCHAR(50),
    phone_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    condition VARCHAR(30) NOT NULL,
    starting_price NUMERIC(12, 2) NOT NULL,
    minimum_bid_increment NUMERIC(12, 2) NOT NULL,
    current_highest_bid NUMERIC(12, 2) NOT NULL,
    leading_bidder_id BIGINT REFERENCES users(id),
    bid_count INT NOT NULL DEFAULT 0,
    closing_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS listing_images (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bids (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id),
    bidder_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auction_outcomes (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL UNIQUE REFERENCES listings(id),
    provisional_winner_id BIGINT REFERENCES users(id),
    winning_bid_id BIGINT REFERENCES bids(id),
    final_status VARCHAR(40) NOT NULL,
    seller_decision VARCHAR(30),
    decision_reason TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS handovers (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL UNIQUE REFERENCES listings(id),
    seller_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    winner_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    seller_confirmed_at TIMESTAMP WITH TIME ZONE,
    winner_confirmed_at TIMESTAMP WITH TIME ZONE,
    outcome VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    failure_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_listing_id BIGINT REFERENCES listings(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES listings(id),
    actor_id BIGINT REFERENCES users(id),
    event_type VARCHAR(60) NOT NULL,
    event_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance querying and concurrency
CREATE INDEX IF NOT EXISTS idx_listings_status_closing ON listings(status, closing_at);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_current_price ON listings(current_highest_bid);
CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_at);
CREATE INDEX IF NOT EXISTS idx_audit_listing ON audit_events(listing_id);
