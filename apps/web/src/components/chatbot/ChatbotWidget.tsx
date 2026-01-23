"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Bot } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  type: 'user' | 'bot' | 'system';
  timestamp: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate session ID for anonymous users
    if (!sessionId) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadWelcomeMessage = async () => {
    try {
      const res = await fetch(`${API_URL}/chatbot/welcome`);
      if (res.ok) {
        const data = await res.json();
        addMessage(data.message, 'bot');
      }
    } catch (error) {
      console.error("Error loading welcome message:", error);
      addMessage("Bonjour ! Comment puis-je vous aider aujourd'hui ?", 'bot');
    }
  };

  const addMessage = (message: string, type: 'user' | 'bot' | 'system') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage("");
    addMessage(message, 'user');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        addMessage(data.response, 'bot');

        // Handle escalation
        if (data.type === 'escalation') {
          // Could add escalation UI here
        }
      } else {
        addMessage("Désolé, une erreur s'est produite. Veuillez réessayer.", 'bot');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("Désolé, une erreur s'est produite. Veuillez réessayer.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      loadWelcomeMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        aria-label="Ouvrir le chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 z-40 flex flex-col">
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">Assistant Althea</h3>
            <p className="text-sm opacity-90">Support & Informations</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.type === 'bot' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-primary text-white'
                      : msg.type === 'system'
                      ? 'bg-slate-100 text-slate-600 italic'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {msg.message}
                </div>

                {msg.type === 'user' && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="bg-slate-100 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-primary"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Envoyer"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="mt-2 text-xs text-slate-500 text-center">
              Besoin d'aide urgente ? <button
                onClick={async () => {
                  try {
                    await fetch(`${API_URL}/chatbot/escalate`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId }),
                    });
                    addMessage("Demande d'escalade envoyée. Un conseiller vous contactera bientôt.", 'system');
                  } catch (error) {
                    console.error("Error escalating:", error);
                  }
                }}
                className="text-primary hover:underline"
              >
                Parler à un humain
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}