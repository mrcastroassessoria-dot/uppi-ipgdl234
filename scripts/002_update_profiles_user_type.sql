-- Allow user_type to be NULL initially (user will select after sign up)
ALTER TABLE profiles ALTER COLUMN user_type DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN user_type DROP NOT NULL;

-- Update the check constraint to allow NULL
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IS NULL OR user_type IN ('passenger', 'driver'));
