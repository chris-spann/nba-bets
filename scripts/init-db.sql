-- Create database if not exists
-- Note: The database is already created by POSTGRES_DB env var
-- This file can be used for initial data seeding

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- This file will be executed when the PostgreSQL container starts up
-- You can add any initial data or additional setup here