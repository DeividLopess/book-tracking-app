import { Star } from "lucide-react";

export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s === value ? 0 : s)}
          className={`transition-colors ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          <Star size={14} className={s <= value ? "fill-accent text-accent" : "fill-muted text-muted"} />
        </button>
      ))}
    </div>
  );
}
