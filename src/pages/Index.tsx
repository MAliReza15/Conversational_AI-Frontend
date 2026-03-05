import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import Background3D from "@/components/Background3D";
import QuickActionCards from "@/components/QuickActionCards";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import EmergencyBanner from "@/components/EmergencyBanner";
import { useWebSocket } from "@/hooks/useWebSocket";

const Index = () => {
  const { messages, sendMessage, isTyping, emergency, clearSession, dismissEmergency } =
    useWebSocket();
  const [userName] = useState("Patient");

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar onClearSession={clearSession} />

      <div className="flex-1 flex flex-col relative min-w-0">
        <Background3D />
        <EmergencyBanner visible={emergency} onDismiss={dismissEmergency} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
          {!hasMessages ? (
            /* Welcome state */
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
              <div className="text-center animate-fade-in">
                <h1 className="text-5xl sm:text-6xl font-bold mb-3">
                  <span className="gradient-hello">Hello, </span>
                  <span className="text-foreground">{userName}</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  How can I help with your recovery today?
                </p>
              </div>
              <QuickActionCards onAction={sendMessage} />
            </div>
          ) : (
            /* Chat state */
            <ChatMessages messages={messages} isTyping={isTyping} />
          )}

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
};

export default Index;
