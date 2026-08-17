-- Step 1: Add role column to profiles (if it doesn't already exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Step 2: Add check constraint for valid roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_profile_role;
ALTER TABLE profiles ADD CONSTRAINT valid_profile_role
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Step 3: Set all existing profiles without a role to 'user'
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Step 4: Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Step 5: Drop old conflicting RLS policies before adding new ones
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;

-- Step 6: Recreate SELECT policy — own row OR admin
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Step 7: Recreate UPDATE policy — own row OR admin
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
