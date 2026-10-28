-- Flyway Migration V2: Role-based Access Migration
-- Reclassify existing historical accounts into JUNIOR or SENIOR based on activity and student ID patterns

-- 1. Classify Sellers / Seniors
UPDATE users 
SET role = 'SENIOR' 
WHERE role = 'STUDENT' 
  AND (
      id IN (SELECT DISTINCT seller_id FROM listings) 
      OR student_id LIKE 'SEN%' 
      OR email IN ('rohan.sharma@campus.edu', 'ananya.iyer@campus.edu')
  );

-- 2. Classify Bidders / Juniors
UPDATE users 
SET role = 'JUNIOR' 
WHERE role = 'STUDENT' 
  AND (
      id IN (SELECT DISTINCT bidder_id FROM bids) 
      OR student_id LIKE 'JUN%' 
      OR email = 'karthik.verma@campus.edu'
  );

-- 3. Any remaining historical accounts safely reclassified to JUNIOR
UPDATE users 
SET role = 'JUNIOR' 
WHERE role = 'STUDENT';

-- 4. Update default role on users table
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'JUNIOR';

-- 5. Add check constraint to strictly enforce allowed roles
ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('JUNIOR', 'SENIOR', 'ADMIN'));
