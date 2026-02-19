import { useState } from "react";
import { X } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_OPTIONS = [
  { label: "Morning", time: "8 AM" },
  { label: "Midday", time: "12 PM" },
  { label: "Evening", time: "6 PM" },
];

interface NotificationDaysModalProps {
  onClose: () => void;
  selectedDays: string[];
  onSave: (days: string[]) => void;
}

export function NotificationDaysModal({
  onClose,
  selectedDays,
  onSave,
}: NotificationDaysModalProps) {
  const [days, setDays] = useState<string[]>(selectedDays);
  const [allOff, setAllOff] = useState(false);

  const toggle = (day: string) => {
    if (allOff) setAllOff(false);
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <ModalBackdrop>
      <div className="bg-card rounded-3xl p-6 mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground">
            Notification Days
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center tap-active"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* Off toggle */}
        <button
          onClick={() => { setAllOff(!allOff); if (!allOff) setDays([]); }}
          className={`w-full flex items-center justify-between p-4 rounded-2xl mb-4 tap-active transition-colors ${
            allOff ? "bg-amber-bg" : "bg-muted/50"
          }`}
        >
          <span className={`text-sm font-medium ${allOff ? "text-amber" : "text-muted-foreground"}`}>
            Off / Tap to disable all
          </span>
          <div
            className={`w-11 h-6 rounded-full transition-colors relative ${
              allOff ? "bg-amber" : "bg-border"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                allOff ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        {/* Day pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DAYS.map((day) => {
            const active = days.includes(day) && !allOff;
            return (
              <button
                key={day}
                onClick={() => toggle(day)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors tap-active ${
                  active
                    ? "bg-amber text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { onSave(days); onClose(); }}
          className="w-full bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber"
        >
          Done
        </button>
      </div>
    </ModalBackdrop>
  );
}

interface NotificationTimeModalProps {
  onClose: () => void;
  selectedTime: string;
  onSave: (time: string) => void;
}

export function NotificationTimeModal({
  onClose,
  selectedTime,
  onSave,
}: NotificationTimeModalProps) {
  const [selected, setSelected] = useState(selectedTime);

  return (
    <ModalBackdrop>
      <div className="bg-card rounded-3xl p-6 mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground">
            Select Time of Day
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center tap-active"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {TIME_OPTIONS.map(({ label, time }) => {
            const isSelected = selected === `${label} (${time})`;
            return (
              <button
                key={label}
                onClick={() => setSelected(`${label} (${time})`)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl tap-active transition-colors ${
                  isSelected
                    ? "bg-amber text-primary-foreground"
                    : "bg-muted/50 text-foreground"
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className={`text-sm ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {time}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { onSave(selected); onClose(); }}
          className="w-full mt-5 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber"
        >
          Done
        </button>
      </div>
    </ModalBackdrop>
  );
}

function ModalBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div className="relative w-full max-w-[380px]">{children}</div>
    </div>
  );
}
