"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send } from "lucide-react";

interface AIAssistantProps {
  onNewOrder?: (order: { id: string; total: number; currency: string; userName?: string }) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  type: "assistant" | "user";
  buttons?: { label: string; action: () => void }[];
}

const FACE_CONFIG = {
  idle: { emoji: "👩‍💼", color: "from-violet-500 to-purple-600", bounce: false },
  happy: { emoji: "💖", color: "from-pink-400 to-rose-500", bounce: true },
  excited: { emoji: "🎉", color: "from-yellow-400 to-orange-500", bounce: true },
  thinking: { emoji: "🤔", color: "from-blue-400 to-indigo-500", bounce: false },
  sleeping: { emoji: "😴", color: "from-slate-400 to-slate-600", bounce: false },
  surprised: { emoji: "😮", color: "from-amber-400 to-orange-500", bounce: false },
};

type FaceState = keyof typeof FACE_CONFIG;

const QUICK_ACTIONS = {
  lazy: { emoji: "😴", label: "Feeling Lazy", message: "Need a quick break! What's up?", color: "from-indigo-500 to-violet-600" },
  coffee: { emoji: "☕", label: "Need Coffee", message: "Time for a coffee! ☕", color: "from-amber-600 to-yellow-500" },
  problem: { emoji: "😤", label: "Have Issue", message: "Having a problem here!", color: "from-red-500 to-orange-500" },
  working: { emoji: "⏰", label: "How Long?", message: "I've been working for", color: "from-blue-500 to-cyan-500" },
  questions: { emoji: "❓", label: "Questions", message: "Have some questions!", color: "from-green-500 to-emerald-600" },
  love: { emoji: "💕", label: "Just Say Hi", message: "Just checking in! 💕", color: "from-pink-500 to-rose-600" },
};

export function AIAssistant({ onNewOrder }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>("idle");
  const [sessionStart] = useState(Date.now());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const face = FACE_CONFIG[faceState];

  const addMessage = useCallback((text: string, type: "assistant" | "user" = "assistant", buttons?: ChatMessage["buttons"]) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      type,
      buttons,
    };
    setMessages(prev => [...prev, newMsg]);
  }, []);

  const handleQuickAction = (action: keyof typeof QUICK_ACTIONS) => {
    const a = QUICK_ACTIONS[action];
    setFaceState(action === 'lazy' ? 'idle' : action === 'coffee' ? 'idle' : action === 'problem' ? 'surprised' : 'happy');
    addMessage(a.message, "user");
    
    setTimeout(() => {
      const responses: Record<string, string[]> = {
        lazy: ["💪 Take a 5-minute break! Stretch and refresh!", "☕ Go get some coffee, you deserve it!", "🧘 Short breaks increase productivity!"],
        coffee: ["☕ Coffee time! You earned it!", "☕ Another one? I won't judge!", "💪 Caffeine powers activate!"],
        problem: ["😤 Let's figure it out together!", "💪 Don't worry, we got this!", "🔧 Let me help you troubleshoot!"],
        working: [`Working for ${Math.floor((Date.now() - sessionStart) / 60000)} minutes! That's ${Math.floor((Date.now() - sessionStart) / 3600000)} hours!`],
        questions: ["❓ Sure! Ask me anything!", "💬 I'm here to help!"],
        love: ["💕 Love you too! 💕", "🥰 You're the best!", "✨ Working with you is fun!"],
      };
      const response = responses[action][Math.floor(Math.random() * responses[action].length)];
      addMessage(response, "assistant");
      setFaceState("idle");
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage(inputText, "user");
    setInputText("");
    setFaceState("thinking");
    
    setTimeout(() => {
      const autoResponses = [
        "💪 Got it! Let me help with that!",
        "✅ I'll look into it!",
        "🔄 Working on it...",
        "💬 Thanks for letting me know!",
        "📝 noted! Anything else?",
      ];
      const response = autoResponses[Math.floor(Math.random() * autoResponses.length)];
      addMessage(response, "assistant");
      setFaceState("idle");
    }, 1500);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        addMessage("🌟 Hi! I'm your AI buddy! Click me to chat or express how you're feeling!", "assistant");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Floating Button with Quick Actions */}
      <div className="fixed z-50" style={{ right: 16, bottom: 100 }}>
        {/* Quick Actions Popup */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-black/10 p-3 w-48"
            >
              <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider mb-2">How are you feeling?</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(QUICK_ACTIONS).slice(0, 6).map(([key, action]) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleQuickAction(key as keyof typeof QUICK_ACTIONS);
                      setShowQuickActions(false);
                    }}
                    className={`flex items-center gap-1 p-2 rounded-xl text-xs font-bold bg-gradient-to-r ${action.color} text-white hover:opacity-90 transition-all hover:scale-105`}
                  >
                    <span>{action.emoji}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button */}
        <div className="relative">
          {/* Notification Badge */}
          {messages.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 z-10"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {messages.length > 9 ? "9+" : messages.length}
              </span>
            </motion.div>
          )}

          {/* Quick Actions Toggle */}
          <motion.button
            onClick={() => setShowQuickActions(!showQuickActions)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute -top-10 -right-2 w-8 h-8 rounded-full bg-gradient-to-r ${face.color} shadow-lg flex items-center justify-center text-white text-sm border-2 border-white`}
          >
            💬
          </motion.button>

          {/* Main Avatar Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={face.bounce ? { y: [0, -5, 0] } : {}}
            transition={face.bounce ? { duration: 0.5, repeat: Infinity } : {}}
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${face.color} shadow-2xl flex items-center justify-center border-4 border-white`}
          >
            <span className="text-3xl">{face.emoji}</span>
          </motion.button>

          {/* Status Indicator */}
          <motion.div
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border-2 border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-4 sm:right-8 w-[90vw] sm:w-96 bg-white rounded-3xl shadow-2xl border border-black/5 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={face.bounce ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl"
                  >
                    {face.emoji}
                  </motion.div>
                  <div>
                    <h3 className="text-white font-black text-lg">AI Buddy</h3>
                    <p className="text-white/80 text-xs font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Online & Ready!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.span 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl block mb-3"
                  >
                    👋
                  </motion.span>
                  <p className="text-gray-500 font-medium">Hi! I'm your AI buddy! 💕</p>
                  <p className="text-gray-400 text-sm mt-1">Click the button above to tell me how you're feeling!</p>
                </motion.div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.type === "user"
                        ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                        : "bg-white border-2 border-gray-100 shadow-sm"
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      
                      {msg.buttons && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.buttons.map((btn, i) => (
                            <button
                              key={i}
                              onClick={btn.action}
                              className="flex-1 min-w-[100px] bg-black/10 hover:bg-black/20 text-xs font-bold py-2 px-3 rounded-xl transition"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 hover:bg-gray-200 focus:bg-white border-2 border-transparent focus:border-purple-400 rounded-2xl px-4 py-3 text-sm transition-all outline-none"
                />
                <motion.button
                  onClick={handleSendMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}