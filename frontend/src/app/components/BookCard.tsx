import { Edit2, Heart, Trash2 } from "lucide-react";
import { getTranslation } from "../i18n";
import { ratingValue, toDateInput, type Book, type Language } from "./common";
import { StarRating } from "./StarRating";

export function BookCard({ book, onEdit, onDelete, language }: { book: Book; onEdit: () => void; onDelete: () => void; language: Language }) {
  const t = getTranslation(language);
  const date = toDateInput(book.finished_at);
  const locale = language === "pt" ? "pt-BR" : "en-US";
  const formatted = book.status === "finished" && date
    ? new Date(`${date}T00:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
    : t.library.status[book.status];

  return (
    <div className="group flex flex-col overflow-hidden border border-border bg-card transition-all duration-200 hover:border-accent/40 hover:shadow-md sm:flex-row">
      <div className="h-1.5 w-full flex-shrink-0 sm:h-auto sm:w-2" style={{ backgroundColor: book.coverColor }} />
      <img src={book.image_url} alt={book.name} className="h-36 w-full object-cover bg-muted sm:h-auto sm:w-24 sm:flex-shrink-0" />
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground leading-tight line-clamp-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem" }}>
              {book.name}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground" style={{ fontFamily: "'Nunito', sans-serif" }}>{book.author}</p>
          </div>
          <div className="flex flex-shrink-0 gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            <button onClick={onEdit} className="p-1.5 text-muted-foreground transition-colors hover:text-accent"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StarRating value={ratingValue(book)} />
          {book.favorite ? <Heart size={14} className="fill-destructive text-destructive" aria-label={t.bookForm.favorite} /> : null}
          <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{book.genre}</span>
          <span className="ml-auto text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{book.pages}p - {formatted}</span>
        </div>

        {book.description && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground italic line-clamp-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
            "{book.description}"
          </p>
        )}
      </div>
    </div>
  );
}
