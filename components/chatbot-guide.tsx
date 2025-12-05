'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// FAQ chips for quick access
const faqChips = [
  { label: 'Create a shift', question: 'How do I create a new shift?' },
  { label: 'AI scheduling', question: 'How does AI schedule generation work?' },
  { label: 'View conflicts', question: 'How do I view and resolve conflicts?' },
  { label: 'Add employee', question: 'How do I add a new employee?' },
  { label: 'Drag & drop', question: 'How does drag and drop work for shifts?' },
  { label: 'Filter employees', question: 'How do I filter employees by bureau or role?' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Parse markdown bold (**text**) and render as JSX
function formatMessage(content: string): React.ReactNode {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove asterisks and wrap in bold
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatbotGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShimmering, setIsShimmering] = useState(true);
  const [lastAiMessageIndex, setLastAiMessageIndex] = useState<number | null>(null);
  const aiResponseRef = useRef<HTMLDivElement>(null);

  // Stop shimmering after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShimmering(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  // Scroll to top of AI response when it arrives
  useEffect(() => {
    if (lastAiMessageIndex !== null && aiResponseRef.current) {
      aiResponseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [lastAiMessageIndex]);

  const sendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          question,
          history: messages.slice(-6), // Send last 6 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
      };
      setMessages((prev) => {
        setLastAiMessageIndex(prev.length); // Index of the new AI message
        return [...prev, assistantMessage];
      });
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => {
        setLastAiMessageIndex(prev.length); // Index of the error message
        return [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, I couldn't process that request. Please try again.",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (question: string) => {
    sendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="relative">
      {/* Collapsed state - liquid metal button with shimmering text */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'group relative flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300',
            'bg-gradient-to-r from-slate-100 via-white to-slate-100',
            'hover:from-slate-200 hover:via-slate-50 hover:to-slate-200',
            'border border-slate-200/60',
            'shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05)]',
            'hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.08)]',
            'hover:scale-[1.02] active:scale-[0.98]',
            'overflow-hidden'
          )}
        >
          {/* Liquid metal shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          </div>

          {/* Sparkles icon with glow */}
          <Sparkles
            className={cn(
              'h-4 w-4 relative z-10 transition-all duration-300',
              isShimmering
                ? 'text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)] animate-pulse'
                : 'text-primary group-hover:text-orange-500'
            )}
          />

          {/* Text with shimmer animation */}
          <span
            className={cn(
              'relative z-10 transition-colors duration-300',
              isShimmering
                ? 'bg-gradient-to-r from-slate-700 via-orange-500 via-amber-400 via-orange-500 to-slate-700 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer'
                : 'text-slate-700 group-hover:text-slate-900'
            )}
          >
            Ask ShiftSmart
          </span>

          {/* Subtle pulse ring when shimmering */}
          {isShimmering && (
            <div
              className="absolute inset-0 rounded-lg border-2 border-orange-400/30 animate-ping"
              style={{ animationDuration: '2s' }}
            />
          )}
        </button>
      )}

      {/* Expanded chat panel */}
      {isOpen && (
        <div className="bg-background border rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">ShiftSmart Guide</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div className="h-[240px] overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Ask me anything about ShiftSmart!
                </p>
                {/* FAQ Chips */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {faqChips.slice(0, 4).map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleChipClick(chip.question)}
                      className="px-2 py-1 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    ref={idx === lastAiMessageIndex ? aiResponseRef : null}
                    className={cn(
                      'text-xs p-2 rounded-lg max-w-[90%]',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-muted text-xs p-2 rounded-lg max-w-[90%]">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                      <div
                        className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick chips when there are messages */}
          {messages.length > 0 && (
            <div className="px-3 pb-2">
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {faqChips.slice(0, 3).map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chip.question)}
                    disabled={isLoading}
                    className="px-2 py-0.5 text-[9px] bg-muted hover:bg-muted/80 rounded-full whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-2 border-t">
            <div className="flex gap-1.5">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="h-8 text-xs"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
