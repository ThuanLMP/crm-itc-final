-- Fix admin password with correct bcrypt hash for admin123
UPDATE users 
SET password = '$2a$10$ZKCBOZkqmLqPE4qjNqfTtuTl5MHpWIo7eCZOLnqWZTHgB2UzHSL.6'
WHERE email = 'admin@crm.com';

-- Fix employee password with correct bcrypt hash for employee123  
UPDATE users 
SET password = '$2a$10$A1ZMC8zS3qLTKHT1VfJxLO5nZhLsX6Y9Dz5OgNhQEr2T8fXzB6gK2'
WHERE email = 'employee@crm.com';
