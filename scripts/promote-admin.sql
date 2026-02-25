-- =============================================
-- Promover um usuario a admin no Uppi
-- =============================================
-- Substitua o numero de telefone abaixo pelo telefone
-- do usuario que deseja tornar admin.
-- O formato do email no Supabase e: {telefone}@uppi.app
-- =============================================

-- Opcao 1: Promover por telefone
UPDATE profiles
SET is_admin = true
WHERE phone = '91999999999';

-- Opcao 2: Promover por email (formato usado no auth)
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = '91999999999@uppi.app'
-- );

-- Opcao 3: Promover o primeiro usuario cadastrado
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);

-- Verificar admins existentes:
SELECT id, full_name, phone, is_admin FROM profiles WHERE is_admin = true;
