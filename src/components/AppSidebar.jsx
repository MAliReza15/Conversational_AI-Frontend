import {
    Search,
    Activity,
    ClipboardList,
    HelpCircle,
    MessageSquare,
    Trash2,
    Stethoscope,
    Plus,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { toast } from "sonner";

const navItems = [
    { icon: ClipboardList, label: "Recovery Plan" },
    { icon: Activity, label: "Medical History" },
    { icon: HelpCircle, label: "FAQs" },
];

const AppSidebar = ({
    onClearSession,
    onNewChat,
    chatHistory = [],
    activeSessionId,
    onSelectChat,
    onGoHome,
}) => {
    const handleNavClick = (label) => {
        toast(`${label} — coming soon!`, {
            description: "This feature is under development.",
            duration: 3000,
        });
    };

    return (
        <aside className="w-72 h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
            {/* Profile Section */}
            <div className="p-5 border-b border-sidebar-border">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={onGoHome}
                        className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                        <Stethoscope className="w-5 h-5 text-primary-foreground" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-sm text-sidebar-foreground">
                            Nurse GPT-E
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Medical AI Assistant
                        </p>
                    </div>
                    <ThemeToggle />
                </div>

                {/* New Chat button */}
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 border-b border-sidebar-border">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => handleNavClick(item.label)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Recent Chats — dynamic, from user sessions */}
            <div className="flex-1 overflow-y-auto p-3">
                <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent Chats
                </p>
                {chatHistory.length === 0 ? (
                    <p className="px-3 text-xs text-muted-foreground/60 italic">
                        No chats yet — start a conversation!
                    </p>
                ) : (
                    chatHistory.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${chat.id === activeSessionId
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{chat.title}</span>
                        </button>
                    ))
                )}
            </div>

            {/* Clear Session */}
            <div className="p-3 border-t border-sidebar-border">
                <button
                    onClick={onClearSession}
                    disabled={!activeSessionId}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Chat</span>
                </button>
            </div>
        </aside>
    );
};

export default AppSidebar;
