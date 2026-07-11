import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Compass, MapPin, Plane, Wallet } from 'lucide-react';
import { WeatherCard } from '../components/WeatherCard';
import { useAuth } from '../components/AuthContext';
import { fetchWithAuth } from '../lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolData?: any;
}

const STARTERS = [
  { icon: Plane,   text: "Plan a 4-day trip to Kyoto" },
  { icon: Compass, text: "Weather in Tokyo right now" },
  { icon: MapPin,  text: "Top attractions in Paris" },
  { icon: Wallet,  text: "Mid-budget travel tips" },
];

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const userId = user?.id || 'unknown';
  const threadId = `thread_${userId}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    try {
      const response = await fetchWithAuth('/chat/chat', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, thread_id: threadId, message: input }),
      });
      if (!response.ok) throw new Error('Chat request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token') {
                  setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content: m.content + (data.content || '') } : m));
                } else if (data.type === 'tool_data' && data.tool === 'get_weather') {
                  setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, toolData: data.data } : m));
                } else if (data.error) {
                  setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content: m.content + `\n\n**Error:** ${data.error}` } : m));
                }
              } catch (e) { console.error("SSE parse error:", line, e); }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full font-sans">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">

        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
              <Compass size={28} className="text-text-muted mx-auto mb-4" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold text-text mb-1">Wander AI</h2>
              <p className="text-text-secondary text-[13px] mb-8">Travel planning, weather, and local recommendations.</p>

              <div className="grid grid-cols-2 gap-2">
                {STARTERS.map(({ icon: Icon, text }, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(text)}
                    className="
                      flex items-center gap-2.5 text-left text-[13px]
                      bg-surface border border-border rounded-lg px-3 py-2.5
                      text-text-secondary hover:text-text hover:border-border-hover hover:bg-surface-hover
                      transition-colors
                    "
                  >
                    <Icon size={14} className="shrink-0 text-text-muted" />
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="max-w-3xl mx-auto w-full px-4 py-4 flex flex-col gap-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`px-4 py-3 rounded-lg text-[14px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-text-secondary'
                    : 'bg-surface border border-border text-text'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-[11px] font-medium text-accent mb-1.5 uppercase tracking-wider">Wander</div>
                )}
                {msg.content && (
                  <div className={
                    msg.role === 'assistant'
                      ? '[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:ml-4 [&_ul]:mb-2 [&_ol]:ml-4 [&_ol]:mb-2 [&_li]:mb-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_a]:text-accent [&_a]:underline [&_strong]:font-semibold'
                      : ''
                  }>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                {msg.toolData && <WeatherCard data={msg.toolData} />}
              </div>
            ))}

            {isLoading && (
              <div className="px-4 py-3 rounded-lg bg-surface border border-border text-text">
                <div className="text-[11px] font-medium text-accent mb-1.5 uppercase tracking-wider">Wander</div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                  </div>
                  <span className="text-[13px] text-text-muted">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e as any)}
            placeholder="Ask about a destination…"
            disabled={isLoading}
            className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-[14px] text-text placeholder-text-muted outline-none focus:border-accent transition-colors font-sans"
          />
          <button
            type="button"
            onClick={handleSubmit as any}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 rounded-lg bg-accent text-bg flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            <Send size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
