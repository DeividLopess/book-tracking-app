import { Edit2, Heart, Trash2 } from "lucide-react";
import { getTranslation } from "../i18n";
import { ratingValue, toDateInput, type Book, type Language } from "./common";
import { StarRating } from "./StarRating";

type ViewMode = "list" | "grid";

type BookCardProps = {
  book: Book;
  onEdit: () => void;
  onDelete: () => void;
  language: Language;
  viewMode: ViewMode;
};

export function BookCard({
  book,
  onEdit,
  onDelete,
  language,
  viewMode,
}: BookCardProps) {
  const t = getTranslation(language);

  const date = toDateInput(book.finished_at);

  const locale = language === "pt" ? "pt-BR" : "en-US";

  const formatted =
    book.status === "finished" && date
      ? new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : t.library.status[book.status];

  // ===========================
  // GRID
  // ===========================
  if (viewMode === "grid") {
    return (
      <div className="group overflow-hidden rounded-md border border-border bg-card transition-all duration-200 hover:border-accent/40 hover:shadow-lg">
        <div className="h-1" style={{ backgroundColor: book.coverColor }} />

        <div className="relative">
          <img
            src={book.image_url}
            alt={book.name}
            className="aspect-[2/3] w-full object-cover bg-muted"
          />

          <div className="absolute top-2 right-2 z-20 flex gap-2">
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur transition-colors hover:text-accent"
            >
              <Edit2 size={15} />
            </button>

            <button
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur transition-colors hover:text-destructive"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div>
            <h3
              className="line-clamp-2 text-base font-semibold leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {book.name}
            </h3>

            <p
              className="truncate text-sm text-muted-foreground"
              style={{
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {book.author}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StarRating value={ratingValue(book)} />

            {!!book.favorite && (
              <Heart
                size={15}
                className="fill-destructive text-destructive"
                aria-label={t.bookForm.favorite}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span
              className="rounded-sm bg-secondary px-2 py-1 text-xs text-muted-foreground"
              style={{
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {book.genre}
            </span>

            <span
              className="text-xs text-muted-foreground"
              style={{
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {book.pages}p
            </span>
          </div>

          <p
            className="text-xs text-muted-foreground"
            style={{
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {formatted}
          </p>
        </div>
      </div>
    );
  }

  // ===========================
  // LISTA (SEU LAYOUT ATUAL)
  // ===========================

  return (
    <div className="group flex flex-row overflow-hidden border border-border bg-card transition-all duration-200 hover:border-accent/40 hover:shadow-md">
      <div
        className="h-auto w-1.5 flex-shrink-0 sm:w-2"
        style={{ backgroundColor: book.coverColor }}
      />

      <img
        src={book.image_url}
        alt={book.name}
        className="h-auto w-20 flex-shrink-0 object-cover bg-muted sm:w-24"
      />

      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className="line-clamp-2 text-foreground leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {book.name}
            </h3>

            <p
              className="mt-0.5 text-sm text-muted-foreground"
              style={{
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {book.author}
            </p>
          </div>

          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur transition-all duration-200 hover:scale-105 hover:text-accent"
              aria-label="Editar"
            >
              <Edit2 size={15} />
            </button>

            <button
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur transition-all duration-200 hover:scale-105 hover:text-destructive"
              aria-label="Excluir"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StarRating value={ratingValue(book)} />

          {!!book.favorite && (
            <Heart
              size={14}
              className="fill-destructive text-destructive"
              aria-label={t.bookForm.favorite}
            />
          )}

          <span
            className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
            style={{
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {book.genre}
          </span>

          <span
            className="text-xs text-muted-foreground sm:ml-auto"
            style={{
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {book.pages}p - {formatted}
          </span>
        </div>

        {book.description && (
          <p
            className="mt-2 hidden line-clamp-2 text-xs italic leading-relaxed text-muted-foreground sm:block"
            style={{
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            "{book.description}"
          </p>
        )}
      </div>
    </div>
  );
}
