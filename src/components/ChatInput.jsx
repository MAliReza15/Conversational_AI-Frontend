import { useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";

const ChatInput = ({ onSend, disabled }) => {
    const [value, setValue] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue("");
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4 pb-4">
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all"
            >
                <button
                    type="button"
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Attach file"
                >
                    <Paperclip className="w-4 h-4" />
                </button>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Ask Nurse GPT-E anything..."
                    disabled={disabled}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!value.trim() || disabled}
                    className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity"
                    aria-label="Send message"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            </form>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
                Nurse GPT-E provides informational support only — always consult your
                doctor.
            </p>
        </div>
    );
};

export default ChatInput;
