"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageSquare, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface ChatUser {
  id: string;
  email: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id?: string;
  room_id?: string;
  read_at?: string | null;
  message: string;
  created_at: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: string;
}

type ChatSelection =
  | { type: "user"; id: string; label: string; recipientId: string }
  | { type: "room"; id: string; label: string; roomId: string };

export default function ChatPage() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSelection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default",
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const selectedChatRef = useRef<ChatSelection | null>(null);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/chat/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load users.");
      setUsers(json.users ?? []);
      setCurrentUserId(json.current_user_id ?? null);
      setUnreadCounts((prev) => {
        const base = { ...prev };
        (json.users ?? []).forEach((user: ChatUser) => {
          if (!(user.id in base)) base[user.id] = 0;
        });
        return base;
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Could not load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/chat/rooms");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load chat rooms.");
      setRooms(json.rooms ?? []);
      setUnreadCounts((prev) => {
        const base = { ...prev };
        (json.rooms ?? []).forEach((room: ChatRoom) => {
          if (!(room.id in base)) base[room.id] = 0;
        });
        return base;
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Could not load chat rooms.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (selection: ChatSelection) => {
    setLoadingMessages(true);
    try {
      const url =
        selection.type === "room"
          ? `/api/chat/messages?roomId=${selection.roomId}`
          : `/api/chat/messages?userId=${selection.recipientId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load messages.");
      setMessages(json.messages ?? []);
    } catch (error: any) {
      toast.error(error?.message ?? "Could not load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } else {
      setNotificationPermission(Notification.permission);
    }
  };

  const showDesktopNotification = (title: string, body: string) => {
    if (typeof window === "undefined" || notificationPermission !== "granted") return;
    try {
      new Notification(title, {
        body,
        silent: false,
      });
    } catch (error) {
      console.warn("Desktop notification failed", error);
    }
  };

  const markMessagesAsRead = async (selection: ChatSelection) => {
    if (selection.type !== "user" || !currentUserId) return;
    try {
      await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selection.recipientId }),
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const handleSelectUser = async (user: ChatUser) => {
    const selection: ChatSelection = {
      type: "user",
      id: user.id,
      label: user.email,
      recipientId: user.id,
    };
    setSelectedChat(selection);
    selectedChatRef.current = selection;
    setUnreadCounts((prev) => ({ ...prev, [selection.id]: 0 }));
    setMessages([]);
    await loadMessages(selection);
    await markMessagesAsRead(selection);
  };

  const handleSelectRoom = async (room: ChatRoom) => {
    const selection: ChatSelection = {
      type: "room",
      id: room.id,
      label: room.name,
      roomId: room.id,
    };
    setSelectedChat(selection);
    selectedChatRef.current = selection;
    setUnreadCounts((prev) => ({ ...prev, [selection.id]: 0 }));
    setMessages([]);
    await loadMessages(selection);
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedChat || !messageText.trim()) return;

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        message: messageText.trim(),
      };
      if (selectedChat.type === "room") {
        payload.room_id = selectedChat.roomId;
      } else {
        payload.recipient_id = selectedChat.recipientId;
      }
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send message.");
      setMessages((prev) => [...prev, json.message]);
      setMessageText("");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const addDirectMessage = (message: ChatMessage) => {
      if (message.sender_id !== currentUserId && message.recipient_id !== currentUserId) {
        return;
      }
      const conversationUserId =
        message.sender_id === currentUserId ? message.recipient_id : message.sender_id;
      if (!conversationUserId) return;
      const currentSelection = selectedChatRef.current;
      const isCurrentConversation =
        currentSelection?.type === "user" && currentSelection.recipientId === conversationUserId;

      setMessages((prev) => {
        if (isCurrentConversation && !prev.some((item) => item.id === message.id)) {
          return [...prev, message];
        }
        return prev;
      });

      if (!isCurrentConversation && message.sender_id !== currentUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationUserId]: (prev[conversationUserId] ?? 0) + 1,
        }));
        const sender = users.find((u) => u.id === message.sender_id);
        toast.success(`New message from ${sender?.email ?? "a contact"}`);
        showDesktopNotification(
          `New message from ${sender?.email ?? "Chat"}`,
          message.message,
        );
      }
    };

    const addRoomMessage = (message: ChatMessage) => {
      const roomId = message.room_id;
      if (!roomId) return;
      if (!rooms.some((room) => room.id === roomId)) return;
      const currentSelection = selectedChatRef.current;
      const isCurrentRoom = currentSelection?.type === "room" && currentSelection.roomId === roomId;

      setMessages((prev) => {
        if (isCurrentRoom && !prev.some((item) => item.id === message.id)) {
          return [...prev, message];
        }
        return prev;
      });

      if (!isCurrentRoom && message.sender_id !== currentUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] ?? 0) + 1,
        }));
        const room = rooms.find((item) => item.id === roomId);
        toast.success(`New message in ${room?.name ?? "a team chat"}`);
        showDesktopNotification(
          `New message in ${room?.name ?? "Team chat"}`,
          message.message,
        );
      }
    };

    const directChannel = supabase
      .channel(`chat_messages_${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          addDirectMessage(payload.new as ChatMessage);
        },
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`chat_room_messages_${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_room_messages" },
        (payload) => {
          addRoomMessage(payload.new as ChatMessage);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(directChannel);
      void supabase.removeChannel(roomChannel);
    };
  }, [currentUserId, rooms, users]);

  useEffect(() => {
    void Promise.all([loadUsers(), loadRooms()]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="px-0 py-0">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
          <MessageSquare size={18} strokeWidth={1.75} />
          <span>My Chats</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a contact or team to open the conversation in the main panel.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="space-y-4 rounded-3xl border border-border bg-background p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Contacts
              </p>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {users.length}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Teams
              </p>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {rooms.length}
              </span>
            </div>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading teams...
              </div>
            ) : rooms.length > 0 ? (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => void handleSelectRoom(room)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedChat?.type === "room" && selectedChat.id === room.id
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {room.name}
                      </p>
                    </div>
                    {unreadCounts[room.id] ? (
                      <span className="rounded-full bg-foreground/10 px-2 py-1 text-[10px] font-semibold text-foreground">
                        {unreadCounts[room.id]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading contacts...
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts found.</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => void handleSelectUser(user)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedChat?.type === "user" && selectedChat.id === user.id
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.email}
                    </p>
                  </div>
                  {unreadCounts[user.id] ? (
                    <span className="rounded-full bg-foreground/10 px-2 py-1 text-[10px] font-semibold text-foreground">
                      {unreadCounts[user.id]}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-background p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Conversation
              </p>
              <p className="text-base font-semibold text-foreground">
                {selectedChat ? selectedChat.label : "Select a conversation"}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {selectedChat ? "Active" : "Idle"}
            </span>
          </div>

          <div className="min-h-72 rounded-3xl bg-muted/5 p-4">
            {loadingMessages ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading messages...
              </div>
            ) : selectedChat ? (
              messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet. Send the first one.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isMine = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`rounded-3xl px-4 py-3 text-sm ${
                          isMine
                            ? "ml-auto max-w-[80%] bg-foreground/10 text-foreground"
                            : "max-w-[80%] bg-card text-muted-foreground"
                        }`}
                      >
                        <p>{message.message}</p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span>
                            {new Date(message.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMine ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {message.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
                              {message.read_at ? "Seen" : "Sent"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground">
                Select a contact from the left panel to view their chat.
              </div>
            )}
          </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
                disabled={!selectedChat}
                placeholder={selectedChat ? "Type a message…" : "Select a conversation first"}
              className="flex-1 rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/40"
            />
            <button
              type="submit"
                disabled={!selectedChat || !messageText.trim() || sending}
              className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
