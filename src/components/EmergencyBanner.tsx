import { Phone, X } from "lucide-react";

interface EmergencyBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

const EmergencyBanner = ({ visible, onDismiss }: EmergencyBannerProps) => {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-fade-in">
      <div className="bg-emergency text-emergency-foreground px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="emergency-pulse flex items-center gap-2">
            <Phone className="w-5 h-5" />
            <span className="font-semibold text-sm">
              ⚠️ Emergency Detected — Please contact your clinic immediately
            </span>
          </div>
          <a
            href="tel:5550199"
            className="ml-4 px-4 py-1.5 rounded-full bg-emergency-foreground text-emergency font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            CALL CLINIC: 555-0199
          </a>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-emergency-foreground/20 transition-colors"
          aria-label="Dismiss emergency"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EmergencyBanner;
