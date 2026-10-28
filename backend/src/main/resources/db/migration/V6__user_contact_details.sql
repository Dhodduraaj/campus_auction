-- Flyway Migration V6: User Contact & Campus Handover Details
-- Adds WhatsApp number, campus/hostel location, and contact/handover notes

ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS campus_location VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_note VARCHAR(255);

-- Update seed users with realistic campus contact info
UPDATE users 
SET whatsapp_number = '+91 98765 43210',
    campus_location = 'Hostel Block A, Room 204',
    contact_note = 'Available for handoffs after 4:30 PM near Central Library'
WHERE email = 'rohan@campus.edu' OR id = 7;

UPDATE users 
SET whatsapp_number = '+91 98765 43211',
    campus_location = 'Hostel Block C, Room 112',
    contact_note = 'Available in EE Department block or Student Activity Center'
WHERE email = 'ananya@campus.edu' OR id = 8;

UPDATE users 
SET whatsapp_number = '+91 98765 43212',
    campus_location = 'Hostel Block B, Room 305',
    contact_note = 'Ping on WhatsApp for quick coordination'
WHERE email = 'karthik@campus.edu' OR id = 9;
