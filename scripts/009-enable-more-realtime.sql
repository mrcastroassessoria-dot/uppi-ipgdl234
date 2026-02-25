-- ============================================================
-- UPPI - Habilitar Realtime em mais tabelas críticas
-- ============================================================

-- Tabelas já com Realtime (não mexer):
-- - rides
-- - price_offers
-- - messages
-- - notifications

-- ============================================================
-- CRÍTICO: Segurança e Emergência
-- ============================================================

-- Emergency alerts: crítico para alertas de emergência em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;

-- ============================================================
-- MUITO IMPORTANTE: Status de Motoristas
-- ============================================================

-- Driver profiles: status online/offline, localização em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;

-- ============================================================
-- IMPORTANTE: Corridas em Grupo
-- ============================================================

-- Group rides: status do grupo e confirmações
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_rides;

-- Group ride participants: participantes entrando/saindo
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_ride_participants;

-- ============================================================
-- IMPORTANTE: Social em Tempo Real
-- ============================================================

-- Social post likes: likes em tempo real no feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_post_likes;

-- Social post comments: comentários aparecendo ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_post_comments;

-- Social posts: novos posts no feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;

-- ============================================================
-- IMPORTANTE: Suporte ao Cliente
-- ============================================================

-- Support messages: chat de suporte em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- Support tickets: atualização de status de tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- ============================================================
-- ÚTIL: Transações Financeiras
-- ============================================================

-- Wallet transactions: notificar usuário de créditos/débitos imediatos
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- User wallets: saldo atualizado em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;

-- Payments: status de pagamento em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- ============================================================
-- ÚTIL: Gamificação
-- ============================================================

-- User achievements: conquistas desbloqueadas ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;

-- User streaks: atualização de sequências
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_streaks;

-- ============================================================
-- ÚTIL: Corridas Agendadas
-- ============================================================

-- Scheduled rides: confirmação de motorista para corrida agendada
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_rides;

-- ============================================================
-- ÚTIL: Gravações e Segurança
-- ============================================================

-- Ride recordings: status de gravação (iniciada/parada/processando)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_recordings;

-- Recording consents: consentimentos em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.recording_consents;

-- ============================================================
-- RESUMO: 18 novas tabelas com Realtime habilitado
-- Total agora: 22 tabelas com Realtime (4 anteriores + 18 novas)
-- ============================================================
