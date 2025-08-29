// src/components/MessageBubble.tsx
import { FiVolume2, FiUser, FiMessageSquare  } from "react-icons/fi";
import { useState } from "react";

type Props = {
  text: string;
  language: string;
  isUser: boolean;
  onPlayAudio: () => void;
  isOriginal: boolean;
};

export const MessageBubble = ({
  text,
  language,
  isUser,
  onPlayAudio,
  isOriginal,
}: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    onPlayAudio();

    // Reset playing state after a reasonable time
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const getLanguageName = (lang: string) => {
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "language" }).of(lang) || lang
      );
    } catch {
      return lang;
    }
  };

  const getLanguageFlag = (lang: string) => {
    const flags: { [key: string]: string } = {
      en: "🇺🇸",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      pt: "🇧🇷",
      zh: "🇨🇳",
      ja: "🇯🇵",
    };
    return flags[lang] || "🌐";
  };

  return (
    <div
      className={`group relative max-w-[85%] sm:max-w-lg ${
        isUser ? "ml-auto" : "mr-auto"
      }`}
    >
      {/* Message Container */}
      <div
        className={`
        relative p-4 rounded-2xl shadow-sm backdrop-blur-sm border
        ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400/20 rounded-br-md"
            : "glass bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-white/20 dark:border-slate-700/50 rounded-bl-md"
        }
        ${isOriginal ? "font-medium" : "font-normal"}
        transform transition-all duration-200 group-hover:scale-[1.02]
      `}
      >
        {/* Message Text */}
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
          {text}
        </p>

        {/* Message Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            {/* Speaker Icon */}
            <div
              className={`
              p-1 rounded-full 
              ${isUser ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}
            `}
            >
              {isUser ? (
                <FiUser size={12} className="text-white" />
              ) : (
                <FiMessageSquare 
                  size={12}
                  className="text-slate-600 dark:text-slate-400"
                />
              )}
            </div>

            {/* Language Info */}
            <div className="flex items-center gap-1">
              <span className="text-xs">{getLanguageFlag(language)}</span>
              <span
                className={`
                text-xs font-medium
                ${
                  isUser
                    ? "text-white/80"
                    : "text-slate-500 dark:text-slate-400"
                }
              `}
              >
                {getLanguageName(language)}
              </span>
            </div>
          </div>

          {/* Audio Button */}
          <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className={`
              p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
              ${
                isUser
                  ? "text-white/70 hover:text-white hover:bg-white/20 focus:ring-white/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500/50"
              }
              ${
                isPlaying
                  ? "animate-pulse"
                  : "opacity-0 group-hover:opacity-100 focus:opacity-100"
              }
            `}
            aria-label={`Play audio in ${getLanguageName(language)}`}
          >
            <FiVolume2 size={14} />
          </button>
        </div>
      </div>

      {/* Message Type Indicator */}
      {isOriginal && (
        <div
          className={`
          absolute -top-2 text-xs px-2 py-0.5 rounded-full font-medium
          ${
            isUser
              ? "-right-2 bg-blue-100 text-blue-700"
              : "-left-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }
        `}
        >
          Original
        </div>
      )}
    </div>
  );
};
