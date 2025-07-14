import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@shared/schema";
import { chatStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatPanelProps {
  selectedSubtopicId: string | null;
  subtopicTitle: string | null;
}

export default function ChatPanel({ selectedSubtopicId, subtopicTitle }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load chat history when subtopic changes
  useEffect(() => {
    if (selectedSubtopicId) {
      const history = chatStorage.get(selectedSubtopicId);
      if (history.length === 0) {
        // Add welcome message for new chats
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Hi! I'm here to help you understand ${subtopicTitle || 'this topic'}. Feel free to ask me anything about the concepts, methods, or examples!`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        chatStorage.set(selectedSubtopicId, [welcomeMessage]);
      } else {
        setMessages(history);
      }
    } else {
      setMessages([]);
    }
  }, [selectedSubtopicId, subtopicTitle]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedSubtopicId || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // Get context from recent messages
      const recentMessages = updatedMessages.slice(-5);
      const context = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await apiRequest('POST', '/api/chat', {
        message: userMessage.content,
        subtopicId: selectedSubtopicId,
        context: `Topic: ${subtopicTitle}\n\n${context}`,
      });

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save to storage
      chatStorage.set(selectedSubtopicId, finalMessages);
      
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      // Remove the user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedSubtopicId) {
    return (
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-sm">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-robot text-slate-400"></i>
            </div>
            <p className="text-slate-500 text-sm">Select a subtopic to start chatting with AI</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-sm">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">AI Assistant</h3>
            <p className="text-xs text-slate-500">Ask questions about this topic</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-robot text-primary-600 text-xs"></i>
              </div>
            )}
            
            <div
              className={`rounded-lg p-3 max-w-xs ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-50 text-slate-700'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>

            {message.role === 'user' && (
              <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-user text-slate-600 text-xs"></i>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <i className="fas fa-robot text-primary-600 text-xs"></i>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-slate-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about this topic..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2">Press Enter to send • AI responses are powered by Gemini</p>
      </div>
    </div>
  );
}
