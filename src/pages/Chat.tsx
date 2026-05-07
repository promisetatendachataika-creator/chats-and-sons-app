import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageSquare, Clock, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface Chat {
  id: string;
  clientId: string;
  clientName: string;
  lastMessage: string;
  updatedAt: any;
}

export const Chat = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isAdmin = profile?.role === 'admin';

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  }, []);

  // Admin: Fetch all active chats
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Chat[]);
    });
    return () => unsub();
  }, [isAdmin]);

  // Client: Fetch or Create their own chat ID
  useEffect(() => {
    if (isAdmin || !user) return;
    setSelectedChatId(user.uid);
  }, [isAdmin, user]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return;
    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const newMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
      
      // Play sound if a new message arrived from someone else
      if (newMsgs.length > messages.length) {
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg.senderId !== user?.uid && soundEnabled) {
          audioRef.current?.play().catch(e => console.log('Audio play failed', e));
        }
      }
      
      setMessages(newMsgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [selectedChatId, user?.uid, soundEnabled, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      // 1. Create/Update Chat metadata
      const chatRef = doc(db, 'chats', selectedChatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        clientName: isAdmin ? chats.find(c => c.id === selectedChatId)?.clientName : profile?.displayName
      }).catch(async () => {
        // If update fails, document might not exist (first message)
        const { setDoc } = await import('firebase/firestore');
        await setDoc(chatRef, {
          clientId: isAdmin ? selectedChatId : user.uid,
          clientName: profile?.displayName || 'User',
          lastMessage: text,
          updatedAt: serverTimestamp()
        });
      });

      // 2. Add message to sub-collection
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        text,
        senderId: user.uid,
        senderName: profile?.displayName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 pb-6 px-4 max-w-6xl mx-auto w-full flex gap-6 h-[calc(100vh-80px)]">
        
        {/* Admin Sidebar */}
        {isAdmin && (
          <div className={`w-full md:w-80 glass-panel flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--color-neon-blue)]" />
                Active Chats
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    selectedChatId === chat.id 
                      ? 'bg-[var(--color-neon-blue)]/20 border border-[var(--color-neon-blue)]/30' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <p className="text-white font-semibold text-sm">{chat.clientName}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{chat.lastMessage || 'Start a conversation'}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Window */}
        <div className={`flex-1 glass-panel flex flex-col relative overflow-hidden ${isAdmin && !selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          {!selectedChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <MessageSquare className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white">Select a client to start chatting</h3>
              <p className="text-gray-500 mt-2">Real-time support and order discussions</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-[var(--color-neon-blue)]/20 flex items-center justify-center border border-[var(--color-neon-blue)]/20">
                    <User className="w-5 h-5 text-[var(--color-neon-blue)]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold leading-none">
                      {isAdmin ? chats.find(c => c.id === selectedChatId)?.clientName : 'Business Support'}
                    </h3>
                    <p className="text-[10px] text-emerald-400 mt-1 uppercase tracking-widest font-bold">Online</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-cyan-400 hover:bg-cyan-400/10' : 'text-gray-500 hover:bg-white/10'}`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.uid;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                          isOwn 
                            ? 'bg-gradient-to-br from-[var(--color-neon-blue)] to-blue-700 text-white rounded-tr-none' 
                            : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/10'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px]">
                              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-blue)]/50 placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-[var(--color-neon-blue)] hover:bg-cyan-400 text-black rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-[var(--color-neon-blue)] active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
