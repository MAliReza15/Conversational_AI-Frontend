import { useState, useRef, useEffect, useCallback } from "react";

/**
 * useWebSocket — connects to the Conversational_AI-Backend via session-based WebSocket.
 *
 * Supports multiple chat sessions stored in memory (lost on app close).
 * The welcome landing screen shows until the user sends their first message.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "";

export function useWebSocket() {
    // All chat sessions: { [sessionId]: { id, title, messages[], createdAt } }
    const [sessions, setSessions] = useState({});
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [emergency, setEmergency] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const wsRef = useRef(null);
    const activeSessionIdRef = useRef(null);

    const [isBackendUp, setIsBackendUp] = useState(false);

    // Keep ref in sync so callbacks can read latest value
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    // Backend Health Polling
    useEffect(() => {
        let interval;
        const checkHealth = async () => {
            try {
                const res = await fetch(`${API_BASE}/health`);
                setIsBackendUp(res.ok);
            } catch (e) {
                setIsBackendUp(false);
            }
        };
        checkHealth();
        interval = setInterval(checkHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    // Current session's messages
    const messages =
        activeSessionId && sessions[activeSessionId]
            ? sessions[activeSessionId].messages
            : [];

    // Chat history for sidebar
    const chatHistory = Object.values(sessions)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((s) => ({ id: s.id, title: s.title }));

    // ── Helpers ───────────────────────────────────────────────
    const getMessageType = useCallback((content) => {
        if (content.startsWith("Recovery Summary:")) return "summary";
        if (content.includes("⚠️")) return "redflag";
        return "default";
    }, []);

    const generateTitle = useCallback((text) => {
        const cleaned = text.trim().replace(/\n/g, " ");
        return cleaned.length > 30 ? cleaned.slice(0, 30) + "…" : cleaned;
    }, []);

    // ── Load All Sessions from Server on Mount ─────────────────
    useEffect(() => {
        const loadAllSessions = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/sessions`);
                const sessionList = await response.json();

                const mappedSessions = {};
                sessionList.forEach((s) => {
                    mappedSessions[s.session_id] = {
                        id: s.session_id,
                        title: s.title || "New Chat",
                        messages: s.history.map((h) => ({
                            id: crypto.randomUUID(),
                            role: h.role,
                            content: h.content,
                            timestamp: new Date(s.last_activity),
                            type: getMessageType(h.content),
                            isStreaming: false,
                        })),
                        createdAt: new Date(s.created_at).getTime(),
                    };
                });

                if (Object.keys(mappedSessions).length > 0) {
                    setSessions(mappedSessions);
                }
            } catch (err) {
                console.error("Failed to sync sessions from backend:", err);
            }
        };

        loadAllSessions();
    }, [API_BASE, getMessageType]);

    // ── Connect WebSocket for a given session ──────────────────
    const connectWS = useCallback((sid) => {
        if (!sid) return;

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        let wsUrl;
        if (WS_BASE) {
            wsUrl = `${WS_BASE}/ws/chat/${sid}`;
        } else {
            const protocol =
                window.location.protocol === "https:" ? "wss:" : "ws:";
            wsUrl = `${protocol}//${window.location.host}/ws/chat/${sid}`;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            const currentSid = activeSessionIdRef.current;

            if (e.data === "[END]") {
                setIsTyping(false);
                setSessions((prev) => {
                    const session = prev[currentSid];
                    if (!session) return prev;
                    const msgs = [...session.messages];
                    const last = msgs[msgs.length - 1];
                    if (last && last.role === "assistant") {
                        msgs[msgs.length - 1] = { ...last, isStreaming: false };
                    }
                    return { ...prev, [currentSid]: { ...session, messages: msgs } };
                });
                return;
            }

            if (e.data.includes("⚠️") && e.data.includes("immediately")) {
                setEmergency(true);
            }

            setSessions((prev) => {
                const session = prev[currentSid];
                if (!session) return prev;
                const msgs = [...session.messages];
                const last = msgs[msgs.length - 1];

                if (last && last.role === "assistant" && last.isStreaming) {
                    const newContent = last.content + e.data;
                    msgs[msgs.length - 1] = {
                        ...last,
                        content: newContent,
                        type: getMessageType(newContent),
                    };
                } else {
                    msgs.push({
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: e.data,
                        timestamp: new Date(),
                        type: getMessageType(e.data),
                        isStreaming: true,
                    });
                }
                return { ...prev, [currentSid]: { ...session, messages: msgs } };
            });
        };

        ws.onerror = () => setIsTyping(false);
        ws.onclose = () => setIsTyping(false);
    }, []);

    // ── Create a new backend session ───────────────────────────
    const createBackendSession = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/session/new`, { method: "POST" });
            const data = await res.json();
            return data.session_id;
        } catch (e) {
            console.error("Failed to create session", e);
            return null;
        }
    }, []);

    // ── Start a new chat ───────────────────────────────────────
    const startNewChat = useCallback(async () => {
        // Close existing WS
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const sid = await createBackendSession();
        if (!sid) return;

        const newSession = {
            id: sid,
            title: "New Chat",
            messages: [
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                        "Hello, I'm Nurse GPT-E, your post-operative recovery companion. What type of surgery did you recently have?",
                    timestamp: new Date(),
                    type: "default",
                    isStreaming: false,
                },
            ],
            createdAt: Date.now(),
        };

        setSessions((prev) => ({ ...prev, [sid]: newSession }));
        setActiveSessionId(sid);
        setShowWelcome(false);
        setEmergency(false);
        connectWS(sid);
    }, [createBackendSession, connectWS]);

    // ── Switch to an existing chat ─────────────────────────────
    const switchToChat = useCallback(
        (sid) => {
            if (sid === activeSessionId) return;
            setActiveSessionId(sid);
            setShowWelcome(false);
            setEmergency(false);
            connectWS(sid);
        },
        [activeSessionId, connectWS],
    );

    // ── Send a message ─────────────────────────────────────────
    const sendMessage = useCallback(
        async (text) => {
            if (!text.trim()) return;

            let sid = activeSessionId;

            // If no active session yet (user is on welcome screen), create one first
            if (!sid || showWelcome) {
                const newSid = await createBackendSession();
                if (!newSid) return;

                const newSession = {
                    id: newSid,
                    title: generateTitle(text),
                    messages: [],
                    createdAt: Date.now(),
                };

                setSessions((prev) => ({ ...prev, [newSid]: newSession }));
                setActiveSessionId(newSid);
                activeSessionIdRef.current = newSid;
                setShowWelcome(false);
                connectWS(newSid);
                sid = newSid;

                // Small delay to let WebSocket connect
                await new Promise((resolve) => setTimeout(resolve, 300));
            }

            // Update title if this is the first user message
            setSessions((prev) => {
                const session = prev[sid];
                if (!session) return prev;
                const hasUserMsg = session.messages.some((m) => m.role === "user");
                const updatedSession = {
                    ...session,
                    title: hasUserMsg ? session.title : generateTitle(text),
                    messages: [
                        ...session.messages,
                        {
                            id: crypto.randomUUID(),
                            role: "user",
                            content: text,
                            timestamp: new Date(),
                            type: "default",
                        },
                    ],
                };
                return { ...prev, [sid]: updatedSession };
            });

            setIsTyping(true);

            // Wait for WS to be open
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(text);
            } else if (ws) {
                // Wait for connection
                ws.addEventListener(
                    "open",
                    () => {
                        ws.send(text);
                    },
                    { once: true },
                );
            }
        },
        [activeSessionId, showWelcome, createBackendSession, connectWS],
    );

    // ── Clear current session ──────────────────────────────────
    const clearSession = useCallback(async () => {
        if (!activeSessionId) return;
        if (wsRef.current) wsRef.current.close();

        try {
            await fetch(`${API_BASE}/session/${activeSessionId}/reset`, {
                method: "POST",
            });
        } catch (e) {
            console.error("Reset failed", e);
        }

        // Remove the session from the list
        setSessions((prev) => {
            const updated = { ...prev };
            delete updated[activeSessionId];
            return updated;
        });

        setActiveSessionId(null);
        setShowWelcome(true);
        setEmergency(false);
        wsRef.current = null;
    }, [activeSessionId]);

    // ── Dismiss emergency banner ───────────────────────────────
    const dismissEmergency = useCallback(() => {
        setEmergency(false);
    }, []);

    // ── Go to welcome screen ──────────────────────────────────
    const goHome = useCallback(() => {
        setShowWelcome(true);
        if (wsRef.current) wsRef.current.close();
        setActiveSessionId(null);
    }, []);

    return {
        messages,
        sendMessage,
        isConnected: !!wsRef.current,
        isTyping,
        emergency,
        clearSession,
        dismissEmergency,
        showWelcome,
        chatHistory,
        startNewChat,
        switchToChat,
        goHome,
        activeSessionId,
        isBackendUp,
    };
}
