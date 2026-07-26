// Accessible switch used across settings pages.
import { cn } from "@/lib/cn";

export function Toggle({
  checked, onChange, label, hint, id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none py-1.5">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "shrink-0 w-10 h-6 rounded-full relative transition-colors mt-0.5",
          checked ? "bg-accent" : "bg-panel-3"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
      {(label || hint) && (
        <span className="flex-1 min-w-0">
          {label && <span className="block text-sm text-text">{label}</span>}
          {hint && <span className="block text-[11px] text-muted mt-0.5">{hint}</span>}
        </span>
      )}
    </label>
  );
}
