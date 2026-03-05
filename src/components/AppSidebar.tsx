import {
  Search,
  Activity,
  FileText,
  HelpCircle,
  MessageSquare,
  ClipboardList,
  Trash2,
  Stethoscope,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  onClearSession: () => void;
  onQuickAction?: (action: string) => void;
}

const navItems = [
  { icon: ClipboardList, label: "Recovery Plan", active: false },
  { icon: Activity, label: "Medical History", active: false },
  { icon: FileText, label: "Files", active: false },
  { icon: HelpCircle, label: "FAQs", active: false },
];

const recentChats = [
  "Day 3 Check-in",
  "Pain Level Report",
  "Medication Questions",
  "Wound Care Follow-up",
];

const AppSidebar = ({ onClearSession, onQuickAction }: SidebarProps) => {
  return (
    <aside className="w-72 h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Profile Section */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-sidebar-foreground">Nurse GPT-E</h2>
            <p className="text-xs text-muted-foreground">Medical AI Assistant</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 border-b border-sidebar-border">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onQuickAction?.(item.label)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent Chats
        </p>
        {recentChats.map((chat) => (
          <button
            key={chat}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate">{chat}</span>
          </button>
        ))}
      </div>

      {/* Clear Session */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onClearSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Session</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
