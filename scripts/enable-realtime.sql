-- Enable Supabase Realtime for rides and price_offers tables
-- This is required for postgres_changes subscriptions to work

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE price_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
