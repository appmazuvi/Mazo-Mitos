import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../lib/NotificationsContext";
import { Icon } from "../components/Icon";
import type { Conversation, Message } from "../types";

export function MessagesPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { clearUnreadMessages } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Conversation["otherUser"] | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function loadConversations() {
    api.get<Conversation[]>("/api/messages").then(setConversations);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!username) {
      setMessages([]);
      setOtherUser(null);
      return;
    }
    api
      .get<{ otherUser: Conversation["otherUser"]; messages: Message[] }>(`/api/messages/${username}`)
      .then((data) => {
        setOtherUser(data.otherUser);
        setMessages(data.messages);
        loadConversations();
      });
  }, [username]);

  useEffect(() => {
    clearUnreadMessages();
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    const onMessage = (payload: { conversationId: string; message: Message; from: string }) => {
      if (payload.from === username) {
        setMessages((m) => [...m, payload.message]);
      }
      loadConversations();
    };
    socket.on("message:new", onMessage);
    return () => {
      socket.off("message:new", onMessage);
    };
  }, [token, username]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !username) return;
    const message = await api.post<Message>(`/api/messages/${username}`, { content: text });
    setMessages((m) => [...m, message]);
    setText("");
    loadConversations();
  }

  return (
    <div className="h-app-screen flex pb-16 md:pb-0">
      <aside className={`w-full md:w-80 shrink-0 border-r border-white/5 overflow-y-auto ${username ? "hidden md:block" : ""}`}>
        <h1 className="font-display text-lg font-bold px-4 py-5">Mensajes</h1>
        {conversations.length === 0 && <p className="text-sm text-white/40 px-4">Sin conversaciones todavía.</p>}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/mensajes/${c.otherUser.username}`)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition ${username === c.otherUser.username ? "bg-white/5" : ""}`}
          >
            <div className="w-10 h-10 rounded-full bg-arcane-800 flex items-center justify-center font-semibold shrink-0 overflow-hidden">
              {c.otherUser.avatarUrl ? (
                <img src={c.otherUser.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                (c.otherUser.displayName ?? c.otherUser.username)[0].toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{c.otherUser.displayName ?? c.otherUser.username}</p>
              <p className="text-xs text-white/40 truncate">{c.lastMessage?.content ?? "Sin mensajes"}</p>
            </div>
            {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-arcane-500 text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}
          </button>
        ))}
      </aside>

      <main className={`flex-1 flex flex-col ${username ? "" : "hidden md:flex"}`}>
        {!otherUser ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">Elegí una conversación</div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <button onClick={() => navigate("/mensajes")} className="md:hidden text-white/50">
                <Icon name="x" size={18} />
              </button>
              <div className="w-9 h-9 rounded-full bg-arcane-800 flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                {otherUser.avatarUrl ? (
                  <img src={otherUser.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  (otherUser.displayName ?? otherUser.username)[0].toUpperCase()
                )}
              </div>
              <p className="font-medium text-sm">{otherUser.displayName ?? otherUser.username}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                    m.senderId === user?.id ? "self-end bg-arcane-500 text-white" : "self-start bg-white/5 text-white/90"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="p-3 border-t border-white/5 flex gap-2">
              <input
                className="input-field flex-1 text-sm"
                placeholder="Escribí un mensaje..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className="btn-primary px-4">
                <Icon name="send" size={16} />
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
