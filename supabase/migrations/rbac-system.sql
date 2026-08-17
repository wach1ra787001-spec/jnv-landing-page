-- RBAC System Migration for Trading Journal
-- Creates roles, user_roles, and user_suspension tables with RLS policies

-- Create roles table (system-defined roles)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (maps users to roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create user_suspension table (track suspended users)
CREATE TABLE IF NOT EXISTS user_suspension (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  suspended_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert system roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access - can manage all users and system settings'),
  ('admin', 'Admin access - can manage users and moderate content'),
  ('user', 'Standard user - can access their own data')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspension ENABLE ROW LEVEL SECURITY;

-- Roles table RLS - public read, only super_admin can modify
CREATE POLICY "roles_public_read" ON roles
  FOR SELECT USING (TRUE);

CREATE POLICY "roles_super_admin_modify" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- User_roles RLS - users see their own roles, admins can modify
CREATE POLICY "user_roles_see_own" ON user_roles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "user_roles_admins_manage" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- User_suspension RLS - only admins can view/modify
CREATE POLICY "suspension_admins_only" ON user_suspension
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Trigger: Auto-assign 'user' role to new users on signup
CREATE OR REPLACE FUNCTION assign_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
BEGIN
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (NEW.id, user_role_id, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_user_role();

-- Create helper function to check if user has role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_suspension
    WHERE user_id = user_id
    AND is_active = TRUE
    AND (until IS NULL OR until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
