-- Add chat messages table used by the sidebar chat UI.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_sender_recipient_idx ON public.chat_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS chat_messages_recipient_sender_idx ON public.chat_messages(recipient_id, sender_id);
