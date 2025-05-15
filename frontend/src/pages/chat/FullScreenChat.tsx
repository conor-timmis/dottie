import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/!to-migrate/button';
import { Input } from '@/src/components/ui/!to-migrate/input';
import { ScrollArea } from '@/src/components/ui/!to-migrate/scroll-area';
import { Send, Loader2, X, Minimize2, Plus, Trash2, MessageSquare } from 'lucide-react';
import { getAIFeedback } from '@/src/services/ai';
import { getHistory, getConversation, deleteConversation } from '@/src/api/message';
import sendMessage from '@/src/api/message/requests/send';
import { Conversation, ApiMessage } from '@/src/api/message/utils/types';
import { toast } from 'sonner';

interface FullscreenChatProps {
  onClose: () => void;
  initialMessage?: string;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FullscreenChat({ onClose, initialMessage, setIsFullscreen }: FullscreenChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessage = useRef(false);

  const fetchConversations = React.useCallback(async () => {
    try {
      const history = await getHistory();
      setConversations(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load conversations');
      setConversations([]);
    }
  }, []);

  const handleSend = React.useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || input.trim();
      if (!textToSend || isLoading) return;

      const userMessage = textToSend;
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setIsLoading(true);

      try {
        // Create ApiMessage object
        const messagePayload: ApiMessage = {
          content: userMessage,
          role: 'user',
          timestamp: new Date().toISOString()
        };

        const userData = {
          age: sessionStorage.getItem('age') || '',
          cycleLength: sessionStorage.getItem('cycleLength') || '',
          periodDuration: sessionStorage.getItem('periodDuration') || '',
          flowHeaviness: sessionStorage.getItem('flowLevel') || '',
          painLevel: sessionStorage.getItem('painLevel') || '',
          symptoms: JSON.parse(sessionStorage.getItem('symptoms') || '[]')
        };

        try {
          const response = await sendMessage(messagePayload);
          if (response?.conversationId) {
            setCurrentConversationId(response.conversationId);
            await fetchConversations();
          }
        } catch (error) {
          console.error('Failed to send message:', error);
          toast.error('Failed to send message. Please try again.');
        }

        const aiResponse = await getAIFeedback(userData, userMessage);
        setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              "I apologize, but I'm having trouble processing your request right now. Please try again later."
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, fetchConversations]
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load conversation when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await getConversation(conversationId);
      setMessages(
        conversation.messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        }))
      );
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
    hasSentInitialMessage.current = false;
    if (initialMessage) {
      handleSend(initialMessage);
    }
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent | React.KeyboardEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteConversation(conversationId);
      await fetchConversations();
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const sendInitialMessage = async () => {
      if (initialMessage && messages.length === 0 && !hasSentInitialMessage.current) {
        hasSentInitialMessage.current = true;
        await handleSend(initialMessage);
      }
    };

    sendInitialMessage();
  }, [initialMessage, messages.length, handleSend]);

  return (
    <div
      className="fixed inset-0 z-50 flex w-full bg-white dark:bg-slate-900"
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Dottie"
    >
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-80 flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="complementary"
        aria-label="Conversations sidebar"
      >
        {/* Add overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSidebarOpen(false);
              }
            }}
            role="presentation"
            aria-hidden="true"
          />
        )}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Conversations</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-full hover:bg-pink-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4 text-pink-500 dark:text-pink-400" />
          </Button>
        </div>

        <Button
          type="button"
          onClick={handleNewConversation}
          className="mx-4 mt-4 flex items-center gap-2 bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                onClick={() => setCurrentConversationId(conversation.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentConversationId(conversation.id);
                  }
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 ${
                  currentConversationId === conversation.id ? 'bg-pink-50 dark:bg-slate-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="truncate text-sm text-gray-900 dark:text-slate-100">
                      {conversation.preview}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {new Date(conversation.lastMessageDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id, e);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="h-8 w-8 rounded-full hover:bg-pink-100 dark:hover:bg-slate-700"
                >
                  <Trash2 className="h-4 w-4 text-gray-500 hover:text-pink-500 dark:text-slate-400 dark:hover:text-pink-400" />
                </Button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col" role="main">
        <header className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-full hover:bg-pink-100 dark:hover:bg-slate-800"
            >
              <MessageSquare className="h-4 w-4 text-pink-500 dark:text-pink-400" />
            </Button>
            <h1 className="text-lg font-bold text-pink-500 dark:text-pink-400">Chat with Dottie</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="rounded-full hover:bg-pink-100 dark:hover:bg-slate-800"
            >
              <Minimize2 className="h-4 w-4 text-pink-500 dark:text-pink-400" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-pink-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4 text-pink-500 dark:text-pink-400" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4" role="log" aria-label="Chat messages">
            {messages.length === 0 && !isLoading && (
              <div
                className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-slate-400"
                role="status"
              >
                <MessageSquare className="mb-4 h-12 w-12 text-pink-200 dark:text-pink-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-slate-100">
                  Start a new conversation
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-200">
                  Ask Dottie anything about your menstrual health
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                role="listitem"
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    message.role === 'user'
                      ? 'bg-pink-500 text-white dark:bg-pink-500'
                      : 'border border-gray-200 bg-gray-50 text-gray-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                  role="article"
                  aria-label={`${message.role === 'user' ? 'Your message' : "Dottie's message"}`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div
                className="flex animate-fadeIn justify-start"
                role="status"
                aria-label="Loading response"
              >
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                  <Loader2
                    className="h-4 w-4 animate-spin text-pink-500 dark:text-pink-400"
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div
          className="border-t border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          role="form"
          aria-label="Message input"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              className="flex-1 rounded-full border-gray-200 bg-white focus:border-pink-300 focus:ring-pink-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-pink-400 dark:focus:ring-pink-500"
            />
            <Button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading}
              className="rounded-full bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
