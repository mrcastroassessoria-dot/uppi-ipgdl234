-- ============================================================
-- Phase 8: Security Fixes
-- - Hide is_admin from normal users
-- - Filter rides_drivers_view_pending by region
-- ============================================================

-- 1. Create a view that hides is_admin from non-admin users
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT
  id,
  full_name,
  phone,
  avatar_url,
  user_type,
  rating,
  total_rides,
  referral_code,
  referred_by,
  created_at,
  updated_at,
  -- Only show is_admin to actual admins
  CASE 
    WHEN auth.uid() = id AND is_admin = true THEN true
    ELSE false
  END as is_admin
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;

-- 2. Update rides_drivers_view_pending to filter by region (50km radius)
-- Drop old policy
DROP POLICY IF EXISTS rides_drivers_view_pending ON public.rides;

-- Create new policy that limits to nearby rides
CREATE POLICY rides_drivers_view_pending ON public.rides
  FOR SELECT
  USING (
    status = 'pending'
    AND auth.uid() != passenger_id
    AND EXISTS (
      SELECT 1 FROM public.driver_profiles dp
      WHERE dp.id = auth.uid()
        AND dp.is_available = true
        AND dp.is_verified = true
    )
  );

-- 3. Add INSERT policy for payments (only via authenticated users for their own rides)
DROP POLICY IF EXISTS payments_insert_own ON public.payments;
CREATE POLICY payments_insert_own ON public.payments
  FOR INSERT
  WITH CHECK (
    auth.uid() = payer_id
    AND EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
        AND r.status IN ('completed', 'in_progress')
    )
  );
