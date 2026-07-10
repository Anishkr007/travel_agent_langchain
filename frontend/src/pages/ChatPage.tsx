import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, Loader2 } from 'lucide-react';
import { WeatherCard } from '../components/WeatherCard';
import { useAuth } from '../components/AuthContext';
import { fetchWithAuth } from '../lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolData?: any;
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();

  const userId = user?.id || 'unknown';
  // Use a stable thread per user for now, or generate it dynamically
  const threadId = `thread_${userId}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetchWithAuth('/chat/chat', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          thread_id: threadId,
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

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
          
          // Keep the last line in the buffer because it might be incomplete
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'token') {
                  setMessages((prev) => 
                    prev.map((m) => 
                      m.id === assistantMessageId 
                        ? { ...m, content: m.content + (data.content || '') } 
                        : m
                    )
                  );
                } else if (data.type === 'tool_data' && data.tool === 'get_weather') {
                  setMessages((prev) => 
                    prev.map((m) => 
                      m.id === assistantMessageId 
                        ? { ...m, toolData: data.data } 
                        : m
                    )
                  );
                } else if (data.error) {
                  setMessages((prev) => 
                    prev.map((m) => 
                      m.id === assistantMessageId 
                        ? { ...m, content: m.content + `\n\n**Error:** ${data.error}` } 
                        : m
                    )
                  );
                }
              } catch (e) {
                console.error("Error parsing SSE data line:", line, e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <Bot className="bot-icon-large" />
            <p style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--text-main)' }}>AI Travel Assistant</p>
            <div className="starter-prompts">
              {[
                "My name is Anish, I want to visit Kyoto for 4 days.",
                "What's the weather like in Tokyo right now?",
                "Find me top attractions in Paris.",
                "I prefer mid-budget travel, any tips?"
              ].map((starter, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(starter)}
                  className="starter-btn"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="avatar">
                  <Bot className="avatar-icon" />
                </div>
              )}
              <div className={`message-bubble ${msg.role}`}>
                {msg.content && (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
                {msg.toolData && (
                  <WeatherCard data={msg.toolData} />
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message-row assistant">
            <div className="avatar">
              <Loader2 className="avatar-icon spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Where would you like to go?"
          className="chat-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="send-btn"
        >
          <Send style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
      </form>
    </div>
  );
};
