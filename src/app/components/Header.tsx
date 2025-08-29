// src/components/Header.tsx
import { FiTrash2, FiShield } from "react-icons/fi";
import { useState } from "react";

type Props = {
  onClear: () => void;
  messageCount: number;
};

export const Header = ({ onClear, messageCount }: Props) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);

    // Add a slight delay for better UX
    setTimeout(() => {
      onClear();
      setIsClearing(false);
    }, 300);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Nao Translator
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time AI Translation
                </p>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center gap-4">
              {messageCount > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <FiShield size={14} />
                  <span>{messageCount} messages • Private & Secure</span>
                </div>
              )}

              <button
                onClick={handleClear}
                disabled={messageCount === 0 || isClearing}
                className={`
                  relative p-2.5 rounded-xl transition-all duration-200
                  ${
                    messageCount === 0
                      ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : "text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  }
                  ${isClearing ? "animate-pulse" : ""}
                  focus:outline-none focus:ring-2 focus:ring-red-500/20
                `}
                aria-label="Clear all messages permanently"
                title="Clear all messages (immediate deletion)"
              >
                <FiTrash2 size={18} />
                {isClearing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
