-- V5: Remove caste and community surnames from test and seed users
UPDATE users
SET name = 'Rohan', email = 'rohan@campus.edu'
WHERE email = 'rohan.sharma@campus.edu' OR id = 7;

UPDATE users
SET name = 'Ananya', email = 'ananya@campus.edu'
WHERE email = 'ananya.iyer@campus.edu' OR id = 8;

UPDATE users
SET name = 'Karthik', email = 'karthik@campus.edu'
WHERE email = 'karthik.verma@campus.edu' OR id = 9;

UPDATE users
SET name = 'Aarav', email = 'aarav@campus.edu'
WHERE email = 'aarav.patel@campus.edu' OR id = 17;

UPDATE users
SET name = 'Priya', email = 'priya@campus.edu'
WHERE email = 'priya.nair@campus.edu' OR id = 18;
