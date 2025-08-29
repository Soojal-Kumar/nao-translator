// src/components/Controls.tsx
import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { FiMic, FiSend, FiRotateCcw } from "react-icons/fi";

const LANGUAGES = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
  { code: "pt-BR", name: "Portuguese", flag: "🇧🇷" },
  { code: "ru-RU", name: "Russian", flag: "🇷🇺" },
  { code: "zh-CN", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
  { code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
  { code: "pl-PL", name: "Polish", flag: "🇵🇱" },
  { code: "sv-SE", name: "Swedish", flag: "🇸🇪" },
  { code: "tr-TR", name: "Turkish", flag: "🇹🇷" },
];

type Props = {
  isListening: boolean;
  interimTranscript: string;
  fromLanguage: string;
  toLanguage: string;
  setFromLanguage: (lang: string) => void;
  setToLanguage: (lang: string) => void;
  onListen: () => void;
  onSendText: (text: string) => void;
};

export const Controls = ({
  isListening,
  interimTranscript,
  fromLanguage,
  toLanguage,
  setFromLanguage,
  setToLanguage,
  onListen,
  onSendText,
}: Props) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [text, interimTranscript]);

  const handleSend = () => {
    if (text.trim()) {
      onSendText(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const swapLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(temp);
  };

  const getLanguageDisplay = (code: string) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40">
      <div className="glass border-t border-white/10">
        <div className="container mx-auto p-6 space-y-4">
          {/* Language Selection */}
          <div className="flex items-center justify-center gap-3">
            <select
              value={fromLanguage}
              onChange={(e) => setFromLanguage(e.target.value)}
              className="glass rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[130px] bg-white/50 dark:bg-slate-800/50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <button
              onClick={swapLanguages}
              className="p-2 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Swap languages"
            >
              <FiRotateCcw size={18} />
            </button>

            <select
              value={toLanguage}
              onChange={(e) => setToLanguage(e.target.value)}
              className="glass rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[130px] bg-white/50 dark:bg-slate-800/50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Area */}
          <div className="relative max-w-2xl mx-auto">
            <div className="glass rounded-2xl p-1 bg-white/70 dark:bg-slate-800/70">
              <div className="flex items-end gap-3 p-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={isListening ? interimTranscript : text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isListening
                        ? "Listening... Speak clearly"
                        : `Type in ${
                            getLanguageDisplay(fromLanguage).split(" ")[1]
                          }...`
                    }
                    className="w-full bg-transparent resize-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                    rows={1}
                    disabled={isListening}
                  />

                  {/* Listening indicator */}
                  {isListening && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={text.trim() ? handleSend : onListen}
                  className={`
                    relative p-3 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent min-w-[48px] min-h-[48px]
                    ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50 pulse-ring"
                        : text.trim()
                        ? "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500/50 hover:shadow-lg hover:shadow-blue-500/25"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-500/50"
                    }
                  `}
                  aria-label={
                    isListening
                      ? "Stop recording"
                      : text.trim()
                      ? "Send message"
                      : "Start voice recording"
                  }
                >
                  {text.trim() && !isListening ? (
                    <FiSend size={20} />
                  ) : (
                    <FiMic size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Input Hint */}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
              {isListening
                ? "Recording... Click the mic to stop"
                : "Type a message or click the mic to speak"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
