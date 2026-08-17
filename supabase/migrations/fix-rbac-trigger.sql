-- Fix: Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS assign_user_role();

-- Recreate the function with explicit error handling
CREATE OR REPLACE FUNCTION assign_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
BEGIN
  -- Get the 'user' role ID
  SELECT id INTO user_role_id FROM roles WHERE name = 'user' LIMIT 1;
  
  -- Only insert if the role exists (it should from the migration)
  IF user_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (NEW.id, user_role_id, NEW.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_role();

-- Verify the roles table has all three roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access - can manage all users and system settings'),
  ('admin', 'Admin access - can manage users and moderate content'),
  ('user', 'Standard user - can access their own data')
ON CONFLICT (name) DO NOTHING;
