-- Fix the updated_at trigger for users table
-- The original trigger function used camelCase "updatedAt" but column is snake_case "updated_at"

-- Create a proper function for snake_case columns
CREATE OR REPLACE FUNCTION update_updated_at_column_snake()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Recreate trigger with the correct function
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_snake();
