import { useMemo } from "react";
import { getTranslation } from "../i18n";
import { bookDate, ratingValue, type Book, type Language } from "./common";
import { StarRating } from "./StarRating";

export function TimelineTab({
  books,
  language,
}: {
  books: Book[];
  language: Language;
}) {
  const t = getTranslation(language);
  const grouped = useMemo(() => {
    const map = new Map<string, Book[]>();

    [...books]
      .filter(
        (book) => book.status === "in_progress" || book.status === "finished",
      )
      .sort((a, b) => bookDate(b).localeCompare(bookDate(a)))
      .forEach((book) => {
        const month = bookDate(book).slice(0, 7);

        if (!month) return;

        if (!map.has(month)) {
          map.set(month, []);
        }

        map.get(month)!.push(book);
      });

    return Array.from(map.entries());
  }, [books]);

  return (
    <div className="space-y-8">
      {grouped.map(([month, monthBooks]) => {
        const [year, m] = month.split("-");

        const label = new Date(
          parseInt(year),
          parseInt(m) - 1,
          1,
        ).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
          month: "long",
          year: "numeric",
        });

        return (
          <div key={month}>
            <div className="mb-4 flex items-center gap-4">
              <span
                className="text-xs uppercase tracking-widest text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {label}
              </span>

              <div className="h-px flex-1 bg-border" />

              <span
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {monthBooks.length}{" "}
                {monthBooks.length === 1
                  ? t.timeline.singularBook
                  : t.timeline.pluralBook}
              </span>
            </div>

            <div className="relative pl-6">
              <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />

              <div className="space-y-4">
                {monthBooks.map((book) => (
                  <div key={book.id} className="relative flex gap-4">
                    <div
                      className="absolute -left-[1.625rem] top-1 h-3 w-3 rounded-full border-2 border-card"
                      style={{
                        backgroundColor: book.coverColor,
                      }}
                    />

                    <div className="flex-1 border border-border bg-card p-4 transition-colors hover:border-accent/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="text-foreground"
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontWeight: 600,
                              fontSize: "0.95rem",
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

                        <div className="flex-shrink-0 text-right">
                          <div
                            className="text-xs text-muted-foreground"
                            style={{
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            {bookDate(book).slice(5)}
                          </div>

                          <div className="mt-1">
                            <StarRating value={ratingValue(book)} />
                          </div>
                        </div>
                      </div>

                      {book.description && (
                        <p
                          className="mt-2 text-xs italic leading-relaxed text-muted-foreground"
                          style={{
                            fontFamily: "'Nunito', sans-serif",
                          }}
                        >
                          &quot;{book.description}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
