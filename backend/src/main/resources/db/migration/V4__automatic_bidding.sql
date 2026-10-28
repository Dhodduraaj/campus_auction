-- Campus Auction Platform Migration V4
-- Automatic Bidding (Proxy Bidding)

CREATE TABLE IF NOT EXISTS auto_bid_rules (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_auto_bid_rules_listing_buyer UNIQUE (listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_auto_bid_rules_listing_status ON auto_bid_rules(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_auto_bid_rules_buyer ON auto_bid_rules(buyer_id);
