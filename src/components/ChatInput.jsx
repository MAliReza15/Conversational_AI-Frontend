import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowUp, Mic, Square, Loader2, ChevronDown } from "lucide-react";

const ASR_MODES = {
    live: { label: "Live", description: "Real-time (Sherpa)" },
    recorded: { label: "Recorded", description: "High accuracy (Whisper)" },
};

const ChatInput = ({ onSend, disabled }) => {
    const [value, setValue] = useState("");
    const [asrMode, setAsrMode] = useState("live"); // "live" | "recorded"
    const [showDropdown, setShowDropdown] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const dropdownRef = useRef(null);

    // Refs for live streaming ASR
    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);

    // Refs for recorded mode
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue("");
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ════════════════════════════════════════
    // LIVE MODE (Sherpa streaming WebSocket)
    // ════════════════════════════════════════
    const startLiveRecording = useCallback(async () => {
        try {
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true }
            });
            streamRef.current = micStream;

            const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/ws/asr`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsRecording(true);
                setIsTranscribing(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.partial !== undefined) setValue(data.partial);
                    if (data.final !== undefined) {
                        setValue(data.final);
                        stopLiveCleanup();
                    }
                    if (data.error) {
                        console.error("ASR error:", data.error);
                        stopLiveCleanup();
                    }
                } catch (e) {
                    console.error("Failed to parse ASR message:", e);
                }
            };

            ws.onclose = () => stopLiveCleanup();
            ws.onerror = () => stopLiveCleanup();

            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(micStream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (ws.readyState !== WebSocket.OPEN) return;
                const float32Data = e.inputBuffer.getChannelData(0);
                const int16Data = new Int16Array(float32Data.length);
                for (let i = 0; i < float32Data.length; i++) {
                    const s = Math.max(-1, Math.min(1, float32Data[i]));
                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                ws.send(int16Data.buffer);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        } catch (err) {
            console.error("Error starting live recording:", err);
            alert("Could not access microphone.");
        }
    }, []);

    const stopLiveCleanup = useCallback(() => {
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close().catch(() => { }); audioContextRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        setIsRecording(false);
        setIsTranscribing(false);
    }, []);

    const stopLiveRecording = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send("STOP");
        } else {
            stopLiveCleanup();
        }
    }, [stopLiveCleanup]);

    // ════════════════════════════════════════
    // RECORDED MODE (Whisper batch)
    // ════════════════════════════════════════
    const startRecordedRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                stream.getTracks().forEach(t => t.stop());
                await transcribeWithWhisper(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recorded recording:", err);
            alert("Could not access microphone.");
        }
    }, []);

    const stopRecordedRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const transcribeWithWhisper = async (blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", blob, "recording.webm");

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transcribe`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.text) {
                setValue(prev => prev ? `${prev} ${data.text}` : data.text);
            } else if (data.error) {
                console.error("Whisper error:", data.error);
            }
        } catch (err) {
            console.error("Failed to transcribe with Whisper:", err);
        } finally {
            setIsTranscribing(false);
        }
    };

    // ════════════════════════════════════════
    // Unified start/stop
    // ════════════════════════════════════════
    const startRecording = () => {
        if (asrMode === "live") startLiveRecording();
        else startRecordedRecording();
    };

    const stopRecording = () => {
        if (asrMode === "live") stopLiveRecording();
        else stopRecordedRecording();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            stopLiveCleanup();
        };
    }, [stopLiveCleanup]);

    return (
        <div className="w-full max-w-2xl mx-auto px-4 pb-4">
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all"
            >
                {/* ASR Mode Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        disabled={isRecording || disabled}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/50 text-foreground hover:bg-muted transition-all disabled:opacity-50 border border-border/50"
                        aria-label="Select transcription mode"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {ASR_MODES[asrMode].label}
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                    {showDropdown && (
                        <div className="absolute bottom-full left-0 mb-4 w-60 bg-popover border border-border rounded-2xl shadow-2xl py-2 z-[100] ring-1 ring-black/5">
                            <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">
                                Speech Engine
                            </div>
                            {Object.entries(ASR_MODES).map(([key, mode]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setAsrMode(key); setShowDropdown(false); }}
                                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors relative group ${asrMode === key ? "text-primary bg-primary/5" : "text-foreground"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="text-sm font-semibold">{mode.label}</div>
                                        {asrMode === key && (
                                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                        )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground leading-tight">{mode.description}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mic Button */}
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={disabled || isTranscribing}
                    className={`p-1.5 rounded-full transition-colors ${isRecording
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20 animate-pulse"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text Input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={
                        isTranscribing
                            ? (asrMode === "live" ? "Listening..." : "Transcribing...")
                            : "Ask Nurse GPT-E anything..."
                    }
                    disabled={disabled}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={!value.trim() || disabled}
                    className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity"
                    aria-label="Send message"
                >
                    {isTranscribing && asrMode === "recorded"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArrowUp className="w-4 h-4" />
                    }
                </button>
            </form>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
                Nurse GPT-E provides informational support only — always consult your doctor.
            </p>
        </div>
    );
};

export default ChatInput;
