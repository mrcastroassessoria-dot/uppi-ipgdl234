-- Support chat system
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  sender_id UUID,
  sender_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tickets" ON support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own messages" ON support_messages FOR SELECT USING (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
);
CREATE POLICY "Users insert own messages" ON support_messages FOR INSERT WITH CHECK (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) AND sender_type = 'user'
);
-- Admin can do everything (service role bypasses RLS)

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;

-- Index
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
