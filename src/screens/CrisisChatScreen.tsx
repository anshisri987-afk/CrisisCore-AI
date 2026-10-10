import React, { useState, useRef, useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { GeminiMode, GEMINI_MODES } from '../types';
import {
  Bot,
  Send,
  Trash2,
  Loader2,
  Sparkles,
  Search,
  MapPin,
  Cpu,
  Zap
} from 'lucide-react';

export const CrisisChatScreen: React.FC = () => {
  const {
    chatMessages,
    selectedGeminiMode,
    setGeminiMode,
    sendChatMessage,
    clearChat,
    isChatLoading
  } = useCrisis();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    const txt = input;
    setInput('');
    sendChatMessage(txt);
  };

  const modes: GeminiMode[] = [
    'BALANCED_GENERAL',
    'FAST_LOW_LATENCY',
    'HIGH_THINKING',
    'SEARCH_GROUNDED',
    'MAPS_GROUNDED'
  ];

  const quickPrompts = [
    'Flood evacuation checklist',
    'Triage protocol for hypothermia',
    'Alternative route for submerged NH-24',
    'Generate SITREP command summary'
  ];

  const getModeIcon = (mode: GeminiMode) => {
    switch (mode) {
      case 'FAST_LOW_LATENCY':
        return <Zap className="w-3.5 h-3.5" />;
      case 'HIGH_THINKING':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'SEARCH_GROUNDED':
        return <Search className="w-3.5 h-3.5" />;
      case 'MAPS_GROUNDED':
        return <MapPin className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#070E18] max-w-4xl mx-auto w-full">
      {/* 1. Intelligence Mode Selector Bar */}
      <div className="bg-[#0E1A2B] border-b border-[#223854] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C2E0] animate-pulse" />
            <span className="text-[11px] font-bold text-[#00C2E0] uppercase tracking-wider">
              AI INTELLIGENCE ENGINE
            </span>
          </div>

          <button
            onClick={clearChat}
            data-testid="clear_chat_button"
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white transition"
            title="Clear Chat Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {modes.map((mode) => {
            const isSelected = selectedGeminiMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setGeminiMode(mode)}
                data-testid={`gemini_mode_${mode}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isSelected
                    ? mode === 'HIGH_THINKING'
                      ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                      : mode === 'FAST_LOW_LATENCY'
                      ? 'bg-[#009624] text-white border-[#00C853]'
                      : 'bg-[#008BA3] text-white border-[#00C2E0]'
                    : 'bg-[#16253B] text-[#94A3B8] border-[#223854] hover:text-white'
                }`}
              >
                {getModeIcon(mode)}
                <span>{GEMINI_MODES[mode].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Chat Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase ${
                    isUser ? 'text-[#FF6B00]' : 'text-[#00C2E0]'
                  }`}
                >
                  {isUser ? 'Operator' : 'CrisisCore AI'}
                </span>

                {!isUser && msg.groundingSource && (
                  <span className="text-[9px] font-black text-[#00C2E0] bg-[#008BA3]/30 px-1.5 py-0.2 rounded border border-[#00C2E0]/40">
                    GROUNDED
                  </span>
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#FF6B00]/20 text-white border border-[#FF6B00]/50 rounded-br-xs'
                    : 'bg-[#16253B] text-white border border-[#223854] rounded-bl-xs'
                }`}
              >
                {msg.text}

                {msg.groundingSource && (
                  <div className="mt-2 pt-2 border-t border-[#223854] text-[10px] text-[#00C2E0] font-medium">
                    Source: {msg.groundingSource}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isChatLoading && (
          <div className="flex items-center gap-2 text-xs text-[#00C2E0] py-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#00C2E0]" />
            <span>
              {selectedGeminiMode === 'HIGH_THINKING'
                ? 'Thinking deeply (Gemini 3.1 Pro High Thinking)...'
                : selectedGeminiMode === 'FAST_LOW_LATENCY'
                ? 'Responding fast (3.1 Flash-Lite)...'
                : selectedGeminiMode === 'SEARCH_GROUNDED'
                ? 'Grounding with Google Search Met data...'
                : selectedGeminiMode === 'MAPS_GROUNDED'
                ? 'Grounding with Google Maps GIS data...'
                : 'Generating tactical command advice...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Emergency Prompt Chips */}
      <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendChatMessage(p)}
            data-testid={`prompt_chip_${p.slice(0, 10)}`}
            className="px-2.5 py-1 rounded-full bg-[#0E1A2B] hover:bg-[#16253B] border border-[#223854] text-[11px] text-[#94A3B8] hover:text-white whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* 4. Input Row */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-[#0E1A2B] border-t border-[#223854] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask tactical command or request triage..."
          data-testid="chat_input_field"
          className="flex-1 bg-[#070E18] border border-[#223854] focus:border-[#00C2E0] rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder-[#64748B] outline-none transition"
        />

        <button
          type="submit"
          disabled={!input.trim() || isChatLoading}
          data-testid="chat_send_button"
          className="w-10 h-10 rounded-full bg-[#FF6B00] hover:bg-[#FF8533] disabled:opacity-50 text-white flex items-center justify-center transition shadow shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
