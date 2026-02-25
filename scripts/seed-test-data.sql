-- Seed test data for development/testing
-- This creates test users (passengers and drivers) with different vehicle types

-- Insert test passenger profiles (using fake user IDs)
INSERT INTO profiles (id, full_name, phone, user_type, rating, total_rides, avatar_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'João Silva', '+5511999999001', 'passenger', 4.8, 45, NULL),
  ('22222222-2222-2222-2222-222222222222', 'Maria Santos', '+5511999999002', 'passenger', 4.9, 32, NULL),
  ('33333333-3333-3333-3333-333333333333', 'Pedro Costa', '+5511999999003', 'passenger', 5.0, 18, NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- Insert test driver profiles
INSERT INTO profiles (id, full_name, phone, user_type, rating, total_rides, avatar_url)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Carlos Moto', '+5511999999004', 'driver', 4.9, 250, NULL),
  ('55555555-5555-5555-5555-555555555555', 'Ana Carro', '+5511999999005', 'driver', 4.7, 180, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Roberto Comfort', '+5511999999006', 'driver', 5.0, 320, NULL),
  ('77777777-7777-7777-7777-777777777777', 'Lucia Moto', '+5511999999007', 'driver', 4.8, 145, NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  user_type = EXCLUDED.user_type;

-- Insert driver profiles with vehicle info
INSERT INTO driver_profiles (id, license_number, vehicle_type, vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, is_verified, is_available)
VALUES
  ('44444444-4444-4444-4444-444444444444', '12345678900', 'moto', 'Honda', 'CG 160', 2023, 'ABC1234', 'Vermelha', true, true),
  ('55555555-5555-5555-5555-555555555555', '23456789011', 'economy', 'Chevrolet', 'Onix', 2022, 'DEF5678', 'Branco', true, true),
  ('66666666-6666-6666-6666-666666666666', '34567890122', 'comfort', 'Toyota', 'Corolla', 2023, 'GHI9012', 'Prata', true, true),
  ('77777777-7777-7777-7777-777777777777', '45678901233', 'moto', 'Yamaha', 'Fazer 250', 2023, 'JKL3456', 'Azul', true, true)
ON CONFLICT (id) DO UPDATE SET
  vehicle_type = EXCLUDED.vehicle_type,
  vehicle_brand = EXCLUDED.vehicle_brand,
  vehicle_model = EXCLUDED.vehicle_model,
  is_verified = EXCLUDED.is_verified,
  is_available = EXCLUDED.is_available;

-- Insert some sample completed rides for stats
INSERT INTO rides (id, passenger_id, driver_id, vehicle_type, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance_km, estimated_duration_minutes, passenger_price_offer, final_price, payment_method, status, completed_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'moto', 'Av. Paulista, 1000', 'Rua Augusta, 500', -23.561414, -46.656178, -23.557000, -46.654000, 3.5, 15, 18.50, 18.50, 'pix', 'completed', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'economy', 'Shopping Iguatemi', 'Jardins', -23.578825, -46.689346, -23.571000, -46.670000, 5.2, 20, 25.00, 25.00, 'cash', 'completed', NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'moto', 'Bairro Vila Mariana', 'Centro', -23.588000, -46.640000, -23.550000, -46.633000, 4.8, 18, 20.00, 20.00, 'pix', 'completed', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- Update total_rides count
UPDATE profiles p
SET total_rides = (
  SELECT COUNT(*)
  FROM rides r
  WHERE (r.passenger_id = p.id OR r.driver_id = p.id)
    AND r.status = 'completed'
)
WHERE p.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

-- Display test accounts
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST ACCOUNTS CREATED:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PASSENGERS:';
  RAISE NOTICE '  João Silva - +5511999999001';
  RAISE NOTICE '  Maria Santos - +5511999999002';
  RAISE NOTICE '  Pedro Costa - +5511999999003';
  RAISE NOTICE '';
  RAISE NOTICE 'DRIVERS:';
  RAISE NOTICE '  Carlos Moto (MOTO) - +5511999999004';
  RAISE NOTICE '  Ana Carro (ECONOMY) - +5511999999005';
  RAISE NOTICE '  Roberto Comfort (COMFORT) - +5511999999006';
  RAISE NOTICE '  Lucia Moto (MOTO) - +5511999999007';
  RAISE NOTICE '========================================';
END $$;
