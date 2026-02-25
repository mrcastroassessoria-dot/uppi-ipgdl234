-- =====================================================
-- UPPI - Dados de Teste (Seed Data)
-- Popula o banco com dados iniciais para teste
-- =====================================================

-- NOTA: Você precisará criar usuários via Supabase Auth primeiro
-- Este script assume que você já tem alguns UUIDs de auth.users

-- Inserir perfis de teste (adapte os IDs conforme seus usuários do Supabase Auth)
-- Para criar usuários de teste, use o Supabase Dashboard ou a API de autenticação

-- =====================================================
-- ACHIEVEMENTS (Conquistas)
-- =====================================================

INSERT INTO achievements (name, description, type, icon, points, requirement_value) VALUES
  ('Primeira Corrida', 'Complete sua primeira corrida como passageiro', 'first_ride', '🚗', 10, 1),
  ('Estreante', 'Complete 5 corridas', 'rides_milestone', '⭐', 25, 5),
  ('Viajante', 'Complete 25 corridas', 'rides_milestone', '🌟', 50, 25),
  ('Expert', 'Complete 100 corridas', 'rides_milestone', '💎', 150, 100),
  ('Lendário', 'Complete 500 corridas', 'rides_milestone', '👑', 500, 500),
  ('Avaliador 5 Estrelas', 'Mantenha rating de 5.0 por 20 corridas', 'rating_milestone', '⭐⭐⭐⭐⭐', 100, 20),
  ('Social Butterfly', 'Faça 10 posts no feed social', 'social_milestone', '🦋', 30, 10),
  ('Influencer', 'Receba 100 likes em seus posts', 'social_milestone', '📱', 75, 100),
  ('Indicador Bronze', 'Indique 3 amigos', 'rides_milestone', '🥉', 50, 3),
  ('Indicador Prata', 'Indique 10 amigos', 'rides_milestone', '🥈', 100, 10),
  ('Indicador Ouro', 'Indique 25 amigos', 'rides_milestone', '🥇', 250, 25),
  ('Early Bird', 'Faça 10 corridas antes das 7h', 'special_event', '🌅', 40, 10),
  ('Night Rider', 'Faça 10 corridas após 22h', 'special_event', '🌙', 40, 10),
  ('Fim de Semana', 'Faça 20 corridas em fins de semana', 'special_event', '🎉', 60, 20)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CUPONS (Coupons)
-- =====================================================

INSERT INTO coupons (code, description, discount_type, discount_value, min_ride_value, max_discount, usage_limit, valid_from, valid_until, is_active) VALUES
  ('BEMVINDO', 'Desconto de boas-vindas para novos usuários', 'percentage', 50.00, 10.00, 20.00, 1000, NOW(), NOW() + INTERVAL '30 days', true),
  ('PRIMEIRAVIAGEM', 'R$ 15 OFF na primeira corrida', 'fixed', 15.00, 20.00, 15.00, 5000, NOW(), NOW() + INTERVAL '60 days', true),
  ('FERIADO2026', 'Desconto especial de feriado', 'percentage', 30.00, 15.00, 25.00, 2000, NOW(), NOW() + INTERVAL '7 days', true),
  ('VOLTESEMPRE', 'Desconto para usuários recorrentes', 'percentage', 20.00, 20.00, 15.00, NULL, NOW(), NOW() + INTERVAL '90 days', true),
  ('INDICACAO10', 'Bônus de indicação', 'fixed', 10.00, 0.00, 10.00, NULL, NOW(), NOW() + INTERVAL '365 days', true),
  ('WEEKEND', 'Desconto de fim de semana', 'percentage', 25.00, 25.00, 20.00, NULL, NOW(), NOW() + INTERVAL '180 days', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserido com sucesso!';
  RAISE NOTICE '📊 Achievements criados: 14';
  RAISE NOTICE '🎟️ Cupons criados: 6';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Crie usuários de teste via Supabase Auth';
  RAISE NOTICE '2. Insira profiles manualmente ou via API';
  RAISE NOTICE '3. Teste o fluxo de autenticação';
  RAISE NOTICE '4. Crie corridas de teste via interface do app';
END $$;
