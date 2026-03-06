import { Activity, Clock, AlertTriangle } from "lucide-react";

const cards = [
    {
        icon: Activity,
        title: "Check My Day 3 Progress",
        description: "Recovery progress overview",
        message: "How am I doing? Show me my recovery progress.",
        color: "bg-primary/10 text-primary",
    },
    {
        icon: Clock,
        title: "Log Pain Level",
        description: "Update your conversation memory",
        message: "I want to log my current pain level.",
        color: "bg-accent/10 text-accent",
    },
    {
        icon: AlertTriangle,
        title: "Wound Care Video",
        description: "Step-by-step wound care guide",
        message: "Show me the wound care instructions and video.",
        color: "bg-medical-warm/10 text-medical-warm",
    },
];

const QuickActionCards = ({ onAction }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
            {cards.map((card, i) => (
                <button
                    key={card.title}
                    onClick={() => onAction(card.message)}
                    className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-left animate-scale-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <div
                        className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                        <card.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-sm text-card-foreground mb-1">
                        {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                </button>
            ))}
        </div>
    );
};

export default QuickActionCards;
