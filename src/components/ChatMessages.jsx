import { useEffect, useRef, useState, useCallback } from "react";
import { Stethoscope, User, Volume2, Loader2, Square } from "lucide-react";

const ChatMessages = ({ messages, isTyping }) => {
    const bottomRef = useRef(null);
    const [playingId, setPlayingId] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const audioRef = useRef(null);
    const playingIdRef = useRef(null);

    // Keep the ref in sync with state
    useEffect(() => {
        playingIdRef.current = playingId;
    }, [playingId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setPlayingId(null);
    }, []);

    const handleSpeak = useCallback(async (msgId, text) => {
        // If already playing this message, stop it
        if (playingIdRef.current === msgId) {
            stopAudio();
            return;
        }

        // Stop any currently playing audio first
        stopAudio();

        setLoadingId(msgId);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                console.error("TTS request failed:", response.status);
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setPlayingId(null);
                audioRef.current = null;
                URL.revokeObjectURL(url);
            };

            audio.onerror = () => {
                setPlayingId(null);
                audioRef.current = null;
                URL.revokeObjectURL(url);
            };

            setPlayingId(msgId);
            await audio.play();
        } catch (err) {
            console.error("TTS playback error:", err);
        } finally {
            setLoadingId(null);
        }
    }, [stopAudio]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                >
                    {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Stethoscope className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted text-foreground rounded-bl-md"
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === "assistant" && msg.content && (
                            <button
                                onClick={() => handleSpeak(msg.id, msg.content)}
                                disabled={loadingId === msg.id}
                                className="self-start ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                                aria-label={playingId === msg.id ? "Stop speaking" : "Read aloud"}
                                title={playingId === msg.id ? "Stop" : "Read aloud"}
                            >
                                {loadingId === msg.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : playingId === msg.id ? (
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                    <Volume2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        )}
                    </div>
                    {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-4 h-4 text-secondary-foreground" />
                        </div>
                    )}
                </div>
            ))}

            {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1.5">
                            <span
                                className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                            />
                            <span
                                className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                            />
                            <span
                                className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                            />
                        </div>
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessages;
