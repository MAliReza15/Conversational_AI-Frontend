import { useState, useEffect, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseWebSocketReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
  isTyping: boolean;
  emergency: boolean;
  clearSession: () => void;
  dismissEmergency: () => void;
}

export function useWebSocket(url: string = "ws://localhost:8000/ws/chat"): UseWebSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => setIsConnected(true);
      socket.onclose = () => {
        setIsConnected(false);
        setIsTyping(false);
        reconnectTimeout.current = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket.close();

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.emergency) {
            setEmergency(true);
            return;
          }

          if (data.type === "stream_start") {
            setIsTyping(true);
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
                timestamp: new Date(),
              },
            ]);
          } else if (data.type === "stream_token") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + data.text,
                };
              }
              return updated;
            });
          } else if (data.type === "stream_end") {
            setIsTyping(false);
          } else if (data.text) {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.text,
                timestamp: new Date(),
              },
            ]);
          }
        } catch {
          // non-JSON message
        }
      };
    } catch {
      // connection failed, will retry
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      socketRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: text }));
      setIsTyping(true);
    } else {
      // Mock response when not connected
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: getMockResponse(text),
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
      }, 1200);
    }
  }, []);

  const clearSession = useCallback(() => {
    setMessages([]);
    setEmergency(false);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "reset" }));
    }
  }, []);

  const dismissEmergency = useCallback(() => {
    setEmergency(false);
  }, []);

  return { messages, sendMessage, isConnected, isTyping, emergency, clearSession, dismissEmergency };
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("pain")) {
    return "I understand you're experiencing pain. On a scale of 1-10, how would you rate it? Also, can you describe the location and type of pain (sharp, dull, throbbing)?";
  }
  if (lower.includes("medication") || lower.includes("medicine")) {
    return "Your current medication schedule:\n\n💊 **Ibuprofen 400mg** — Every 6 hours with food\n💊 **Amoxicillin 500mg** — Every 8 hours\n\nRemember to complete the full antibiotic course. Would you like me to set reminders?";
  }
  if (lower.includes("progress") || lower.includes("doing")) {
    return "Based on your Day 3 recovery data:\n\n✅ Wound healing: On track\n✅ Temperature: Normal (98.4°F)\n⚠️ Mobility: Slightly below target\n\nOverall, you're recovering well! Keep up with your exercises.";
  }
  return "I'm here to help with your recovery. You can ask me about your medication schedule, report symptoms, or check your recovery progress. What would you like to know?";
}
