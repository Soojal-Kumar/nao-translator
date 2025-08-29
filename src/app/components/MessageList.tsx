// src/components/MessageList.tsx
import { Message } from "@/app/page";
import { MessageBubble } from "./MessageBubble";
import { FiMessageCircle, FiMic } from "react-icons/fi";

type Props = {
  messages: Message[];
  handlePlayAudio: (text: string, lang: string, isRecorded?: boolean) => void;
};

export const MessageList = ({ messages, handlePlayAudio }: Props) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          {/* Floating Icon */}
          <div className="relative mx-auto w-20 h-20 float">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-6"></div>
            <div className="absolute inset-0 glass rounded-2xl flex items-center justify-center">
              <FiMessageCircle size={32} className="text-blue-500" />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Ready to Translate
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Start a conversation by typing a message or speaking into the
              microphone. Your translations will appear here instantly.
            </p>
          </div>

          {/* Quick Start Tips */}
          <div className="grid grid-cols-1 gap-3 mt-8">
            <div className="glass rounded-xl p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <FiMic
                    size={16}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Voice Recording
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Click the microphone to speak naturally
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">
                    Aa
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Text Input
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Type messages for instant translation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-4">
      {messages.map((msg, index) => (
        <div key={msg.id} className="space-y-4">
          {/* Original Message */}
          <div
            className={`flex ${
              msg.speakerSide === "right" ? "justify-end" : "justify-start"
            }`}
          >
            <MessageBubble
              text={msg.originalText}
              language={msg.originalLang.split("-")[0]}
              isUser={msg.speakerSide === "right"}
              isOriginal={true}
              onPlayAudio={() =>
                handlePlayAudio(
                  msg.originalText,
                  msg.originalLang,
                  msg.wasRecorded
                )
              }
            />
          </div>

          {/* Translation */}
          <div
            className={`flex ${
              msg.speakerSide === "right" ? "justify-start" : "justify-end"
            }`}
          >
            <MessageBubble
              text={msg.translatedText}
              language={msg.translatedLang.split("-")[0]}
              isUser={msg.speakerSide !== "right"}
              isOriginal={false}
              onPlayAudio={() =>
                handlePlayAudio(msg.translatedText, msg.translatedLang, false)
              }
            />
          </div>

          {/* Message Separator */}
          {index < messages.length - 1 && (
            <div className="flex justify-center">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
