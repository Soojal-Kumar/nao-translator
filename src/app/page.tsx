// src/app/page.tsx
"use client";

import { Header } from "./components/Header";
import { Controls } from "./components/Controls";
import { MessageList } from "./components/MessageList";
import { useState, useRef, useEffect, useCallback } from "react";

export type Message = {
  id: number;
  originalText: string;
  translatedText: string;
  originalLang: string;
  translatedLang: string;
  speakerSide: "left" | "right";
  wasRecorded: boolean; // Track if message came from voice recording
  recordedAudio?: Blob; // Store the actual recorded audio
};

// --- FIX: Define strict types for the Web Speech API to avoid 'any' ---
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [key: number]: {
      transcript: string;
    };
  }[];
}

interface SpeechRecognitionErrorEvent {
  error:
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
  message: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// Extend Window and Navigator interfaces for speech recognition and Brave detection
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    gc?: () => void;
  }
  // For Brave browser detection
  interface Navigator {
    brave?: {
      isBrave: () => Promise<boolean>;
    };
  }
}

// --- FIX: Moved STORAGE_KEYS outside the component ---
// This makes it a true constant and resolves several useEffect dependency warnings.
const STORAGE_KEYS = {
  MESSAGES: "nao-translator-messages",
  FROM_LANG: "nao-translator-from-lang",
  TO_LANG: "nao-translator-to-lang",
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fromLanguage, setFromLanguage] = useState("en-US");
  const [toLanguage, setToLanguage] = useState("es-ES");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [showToast, setShowToast] = useState<{
    type: "save" | "clear";
    message: string;
  } | null>(null);

  // --- FIX: Typed the ref correctly ---
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

  // --- FIX: Wrapped in useCallback for stable reference in useEffect ---
  const showToastMessage = useCallback(
    (type: "save" | "clear", message: string) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setShowToast({ type, message });
      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(null);
      }, 3000);
    },
    []
  );

  // Handle client-side mounting and load from session storage
  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      try {
        const savedMessages = sessionStorage.getItem(STORAGE_KEYS.MESSAGES);
        if (savedMessages) {
          const parsedMessages: Message[] = JSON.parse(savedMessages);
          const messagesWithoutAudio = parsedMessages.map((msg) => ({
            ...msg,
            recordedAudio: undefined,
          }));
          setMessages(messagesWithoutAudio);
        }

        const savedFromLang = sessionStorage.getItem(STORAGE_KEYS.FROM_LANG);
        const savedToLang = sessionStorage.getItem(STORAGE_KEYS.TO_LANG);

        if (savedFromLang) setFromLanguage(savedFromLang);
        if (savedToLang) setToLanguage(savedToLang);
      } catch (error) {
        console.warn("Failed to load from session storage:", error);
      }
    }
  }, []); // This is correct, runs only once on mount.

  // Save messages to session storage whenever they change
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      try {
        const messagesToSave = messages.map((msg) => ({
          ...msg,
          recordedAudio: undefined,
        }));
        sessionStorage.setItem(
          STORAGE_KEYS.MESSAGES,
          JSON.stringify(messagesToSave)
        );

        if (messages.length > 0) {
          showToastMessage("save", "Conversation auto-saved");
        }
      } catch (error) {
        console.warn("Failed to save messages to session storage:", error);
      }
    }
  }, [messages, isMounted, showToastMessage]);

  // Save language preferences to session storage
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEYS.FROM_LANG, fromLanguage);
      } catch (error) {
        console.warn("Failed to save from language:", error);
      }
    }
  }, [fromLanguage, isMounted]);

  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEYS.TO_LANG, toLanguage);
      } catch (error) {
        console.warn("Failed to save to language:", error);
      }
    }
  }, [toLanguage, isMounted]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- FIX: Wrapped in useCallback for stable reference in other hooks ---
  const getTranslation = useCallback(
    async (text: string, wasRecorded = false, audioBlob?: Blob) => {
      if (!text) return;
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, fromLanguage, toLanguage }),
        });
        const data = await response.json();

        if (data.translatedText) {
          const newMessage: Message = {
            id: Date.now(),
            originalText: text,
            translatedText: data.translatedText,
            originalLang: fromLanguage,
            translatedLang: toLanguage,
            speakerSide: fromLanguage.startsWith("en") ? "right" : "left",
            wasRecorded,
            recordedAudio: audioBlob,
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      } catch (error) {
        console.error("Failed to fetch translation:", error);
      }
    },
    [fromLanguage, toLanguage]
  );

  // Browser detection helper
  const getBrowserInfo = () => {
    if (typeof window === "undefined")
      return { name: "unknown", isBrave: false };

    const userAgent = navigator.userAgent;
    // --- FIX: No 'any' needed due to updated Navigator interface ---
    const isBrave =
      !!navigator.brave && typeof navigator.brave.isBrave === "function";

    return {
      name: isBrave
        ? "Brave"
        : userAgent.includes("Chrome")
        ? "Chrome"
        : userAgent.includes("Safari")
        ? "Safari"
        : userAgent.includes("Firefox")
        ? "Firefox"
        : userAgent.includes("Edge")
        ? "Edge"
        : "Unknown",
      isBrave,
    };
  };

  // Initialize Speech Recognition and Media Recorder
  useEffect(() => {
    if (typeof window === "undefined") return;

    const browserInfo = getBrowserInfo();
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn(`Speech recognition not supported in ${browserInfo.name}`);
      return;
    }

    if (browserInfo.isBrave) {
      console.warn(
        "Brave browser detected. Speech recognition may be limited due to privacy settings."
      );
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = fromLanguage;
    recognition.maxAlternatives = 1;

    if (browserInfo.isBrave) {
      recognition.continuous = false;
      recognition.interimResults = false;
    }

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    // --- FIX: Used the strictly typed event ---
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          if (!browserInfo.isBrave) {
            interim += transcript;
          }
        }
      }

      if (!browserInfo.isBrave) {
        setInterimTranscript(interim);
      }

      if (finalTranscript.trim()) {
        console.log("Final transcript:", finalTranscript);
        getTranslation(finalTranscript.trim(), true);
        setInterimTranscript("");
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      if (isListening) {
        const restartDelay = browserInfo.isBrave ? 500 : 100;
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log("Could not restart recognition:", error);
              setIsListening(false);
            }
          }
        }, restartDelay);
      } else {
        setInterimTranscript("");
      }
    };

    // --- FIX: Used the strictly typed event ---
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      const browserName = browserInfo.name;

      switch (event.error) {
        case "network":
          setIsListening(false);
          setInterimTranscript("");
          if (browserInfo.isBrave) {
            alert(
              `Brave browser has blocked the speech recognition service for privacy. Please:\n1. Click the shield icon in the address bar\n2. Turn off "Block fingerprinting"\n3. Refresh and try again\n\nOr use Chrome/Safari for better speech recognition support.`
            );
          } else {
            alert(
              "Speech recognition service is currently unavailable. Please try typing your message instead."
            );
          }
          break;
        case "not-allowed":
          setIsListening(false);
          setInterimTranscript("");
          if (browserInfo.isBrave) {
            alert(
              `Microphone blocked in ${browserName}. Please:\n1. Click the microphone icon in the address bar\n2. Select "Allow"\n3. Try again`
            );
          } else {
            alert(
              "Microphone access denied. Please allow microphone permissions and try again."
            );
          }
          break;
        case "no-speech":
          console.warn("No speech detected");
          if (browserInfo.isBrave) {
            if (isListening) {
              setTimeout(() => {
                if (isListening && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (error) {
                    setIsListening(false);
                  }
                }
              }, 200);
            }
          }
          break;
        case "aborted":
          console.log("Speech recognition aborted");
          setIsListening(false);
          setInterimTranscript("");
          break;
        case "service-not-allowed":
          setIsListening(false);
          setInterimTranscript("");
          alert(
            `Speech recognition blocked in ${browserName}. Please enable speech recognition in your browser settings or try Chrome/Safari.`
          );
          break;
        default:
          console.warn(
            `Speech recognition error in ${browserName}: ${event.error}`
          );
          setIsListening(false);
          setInterimTranscript("");
      }
    };

    recognitionRef.current = recognition;
    // --- FIX: Added missing dependencies to satisfy the linter ---
  }, [fromLanguage, getTranslation, isListening]);

  // Initialize Media Recorder for audio recording
  const initMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        audioChunksRef.current = [];

        setMessages((currentMessages) => {
          if (currentMessages.length > 0) {
            const lastMessage = currentMessages[currentMessages.length - 1];
            if (lastMessage.wasRecorded && !lastMessage.recordedAudio) {
              const updatedMessages = [...currentMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                recordedAudio: audioBlob,
              };
              return updatedMessages;
            }
          }
          return currentMessages;
        });

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      return mediaRecorder;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
      return null;
    }
  };

  // Toggle listening state for the microphone
  const handleListen = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      setInterimTranscript("");
    } else {
      const browserInfo = getBrowserInfo();
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          `Speech recognition is not supported in ${browserInfo.name}. Please try Chrome, Safari, or Edge.`
        );
        return;
      }

      if (browserInfo.isBrave) {
        const userConfirmed = confirm(
          `You're using Brave browser. Speech recognition may not work due to privacy settings.\n\n` +
            `To enable:\n1. Click the shield icon in the address bar\n2. Turn off "Block fingerprinting"\n3. Refresh the page\n\n` +
            `Click OK to try anyway, or Cancel to type instead.`
        );
        if (!userConfirmed) return;
      }

      setInterimTranscript("");
      setIsListening(true);

      try {
        if (!browserInfo.isBrave) {
          const mediaRecorder = await initMediaRecorder();
          if (mediaRecorder) {
            mediaRecorder.start(1000);
          }
        }
        if (recognitionRef.current) {
          recognitionRef.current.lang = fromLanguage;
          recognitionRef.current.start();
        }
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);

        if (browserInfo.isBrave) {
          alert(
            "Speech recognition failed to start in Brave. Please check your privacy settings or try Chrome/Safari."
          );
        } else {
          alert("Failed to start speech recognition. Please try again.");
        }
      }
    }
  };

  // Enhanced audio playback function
  const handlePlayAudio = (text: string, lang: string, isRecorded = false) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (isRecorded) {
        const message = messages.find(
          (m) =>
            (m.originalText === text && m.wasRecorded) ||
            (m.translatedText === text && m.wasRecorded)
        );

        if (message?.recordedAudio && message.originalText === text) {
          const audioUrl = URL.createObjectURL(message.recordedAudio);
          const audio = new Audio(audioUrl);
          audio.play().catch(() => {
            playTTS(text, lang);
          });
          audio.onended = () => URL.revokeObjectURL(audioUrl);
          return;
        }
      }
      playTTS(text, lang);
    }
  };

  // Text-to-speech function
  const playTTS = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Clear chat with immediate data deletion
  const clearChat = () => {
    setMessages([]);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
        showToastMessage("clear", "All data deleted for privacy");
        console.log("Session storage cleared for privacy");
      } catch (error) {
        console.warn("Failed to clear session storage:", error);
      }
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      setInterimTranscript("");
    }

    audioChunksRef.current = [];

    if (window.gc) {
      window.gc();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onClear={clearChat} messageCount={messages.length} />

      <main className="flex-1 pt-24 pb-64">
        <div className="container mx-auto px-4 max-w-4xl">
          {isMounted && (
            <MessageList
              messages={messages}
              handlePlayAudio={handlePlayAudio}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {isMounted && (
        <Controls
          isListening={isListening}
          interimTranscript={interimTranscript}
          fromLanguage={fromLanguage}
          toLanguage={toLanguage}
          setFromLanguage={setFromLanguage}
          setToLanguage={setToLanguage}
          onListen={handleListen}
          onSendText={(text) => getTranslation(text, false)}
        />
      )}

      {showToast && (
        <div
          className={`
          fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300
          ${
            showToast.type === "save"
              ? "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          }
        `}
        >
          <div className="flex items-center gap-2 text-sm">
            {showToast.type === "save" ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
            <span>{showToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
