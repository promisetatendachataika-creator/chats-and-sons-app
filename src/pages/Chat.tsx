import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ChevronLeft, Volume2, VolumeX, Check, Clock } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/db';
import { useAuth } from '../hooks/useAuth';
import { Shell } from '../components/layout/Shell';
import { LogoMark } from '../components/layout/Logo';
import { Spinner } from '../components/ui/Loader';
import { BUSINESS_NAME } from '../config/constants';

interface Message { id: string; text: string; senderId: string; createdAt: { toDate?: () => Date } | null }
interface ChatThread { id: string; clientId: string; clientName: string; lastMessage: string; updatedAt: unknown }

const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
const time = (m: Message) => m.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export const Chat = () => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundRef = useRef(soundEnabled);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  // Admin: list of conversations
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ChatThread[]));
  }, [isAdmin]);

  // Clients always see their own conversation; the admin picks one from the list.
  const chatId = isAdmin ? selectedChatId : user?.uid ?? null;

  // Messages for the open conversation (one listener per conversation)
  useEffect(() => {
    if (!chatId) return;
    let first = true;
    let prevCount = 0;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[];
      const last = next[next.length - 1];
      if (!first && next.length > prevCount && last && last.senderId !== user?.uid && soundRef.current) {
        if (!audioRef.current) {
          audioRef.current = new Audio(SOUND_URL); // only downloaded the first time it's needed
        }
        audioRef.current.play().catch(() => {});
      }
      first = false;
      prevCount = next.length;
      setMessages(next);
      setLoadedFor(chatId);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' }));
    }, () => setLoadedFor(chatId));
    return unsub;
  }, [chatId, user?.uid]);

  const loadingMsgs = !!chatId && loadedFor !== chatId;
  const shown = loadingMsgs ? [] : messages;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !chatId || !user) return;
    setNewMessage('');
    try {
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        clientId: isAdmin ? chatId : user.uid,
        clientName: isAdmin
          ? chats.find((c) => c.id === chatId)?.clientName || 'Client'
          : profile?.displayName || user.email?.split('@')[0] || 'Client',
      }, { merge: true });
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: user.uid,
        senderName: profile?.displayName || 'User',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(text);
      alert('Message not sent. Check your connection and try again.');
    }
  };

  const activeName = isAdmin ? chats.find((c) => c.id === chatId)?.clientName || 'Client' : BUSINESS_NAME;

  return (
    <Shell footer={false}>
      <div className="mx-auto flex h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] w-full max-w-6xl gap-4 md:h-[calc(100dvh-4rem)] md:p-6">
        {/* Conversations (admin) */}
        {isAdmin && (
          <aside className={`w-full flex-col border-line bg-surface md:flex md:w-80 md:rounded-2xl md:border ${selectedChatId ? 'hidden' : 'flex'}`}>
            <h2 className="flex items-center gap-2 border-b border-line px-4 py-4 font-semibold">
              <MessageSquare className="h-5 w-5 text-brand" /> Conversations
            </h2>
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 && <p className="p-4 text-sm text-muted">No conversations yet.</p>}
              {chats.map((chat) => (
                <button key={chat.id} onClick={() => setSelectedChatId(chat.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${selectedChatId === chat.id ? 'bg-brand-soft' : 'hover:bg-sand'}`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-walnut text-xs font-semibold text-paper">
                    {initials(chat.clientName || 'C')}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{chat.clientName}</span>
                    <span className="block truncate text-xs text-muted">{chat.lastMessage || 'Start a conversation'}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Conversation */}
        <section className={`min-w-0 flex-1 flex-col overflow-hidden bg-surface md:rounded-2xl md:border md:border-line ${isAdmin && !selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          {!chatId ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-10 w-10 text-faint" />
              <p className="mt-3 font-semibold">Choose a conversation</p>
              <p className="mt-1 text-sm text-muted">Messages from clients appear on the left.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  {isAdmin && (
                    <button onClick={() => setSelectedChatId(null)} className="icon-btn md:hidden" aria-label="Back to conversations">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}
                  {isAdmin ? (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-walnut text-xs font-semibold text-paper">{initials(activeName)}</span>
                  ) : <LogoMark className="h-10 w-10 text-xs" />}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{activeName}</p>
                    <p className="text-xs text-muted">{isAdmin ? 'Client' : 'Workshop team'}</p>
                  </div>
                </div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="icon-btn"
                  aria-label={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}>
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto bg-paper px-3 py-4 sm:px-5">
                {loadingMsgs && <div className="grid place-items-center py-10"><Spinner /></div>}
                {!loadingMsgs && shown.length === 0 && (
                  <p className="mx-auto max-w-xs py-10 text-center text-sm text-muted">
                    {isAdmin ? 'No messages yet.' : 'Ask us anything about a product, a quote or your order.'}
                  </p>
                )}
                {shown.map((msg) => {
                  const own = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 shadow-sm ${own ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md border border-line bg-surface text-ink'}`}>
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{msg.text}</p>
                        <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${own ? 'text-white/70' : 'text-faint'}`}>
                          {time(msg) || 'Sending…'}
                          {own && (msg.createdAt ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-line bg-surface p-3">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message…" className="field" aria-label="Message" enterKeyHint="send" />
                <button type="submit" disabled={!newMessage.trim()} className="btn-primary w-12 shrink-0 px-0" aria-label="Send">
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
};
