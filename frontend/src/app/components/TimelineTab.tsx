import { useMemo } from "react";
import { getTranslation } from "../i18n";
import { bookDate, ratingValue, type Book, type Language } from "./common";
import { StarRating } from "./StarRating";

export function TimelineTab({ books, language }: { books: Book[]; language: Language }) {
  const t = getTranslation(language);
  const grouped = useMemo(() => {
    const map = new Map<string, Book[]>();
    [...books].sort((a, b) => bookDate(b).localeCompare(bookDate(a))).forEach((b) => {
      const month = bookDate(b).slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(b);
    });
    return Array.from(map.entries()).filter(([month]) => month);
  }, [books]);

  return (
    <div className="space-y-8">
      {grouped.map(([month, monthBooks]) => {
        const [year, m] = month.split("-");
        const label = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", { month: "long", year: "numeric" });
        return (
          <div key={month}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{label}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{monthBooks.length} {monthBooks.length === 1 ? t.timeline.singularBook : t.timeline.pluralBook}</span>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {monthBooks.map((book) => (
                  <div key={book.id} className="relative flex gap-4">
                    <div className="absolute -left-[1.625rem] top-1 w-3 h-3 rounded-full border-2 border-card" style={{ backgroundColor: book.coverColor }} />
                    <div className="flex-1 bg-card border border-border p-4 hover:border-accent/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "0.95rem" }}>{book.name}</h3>
                          <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>{book.author}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{bookDate(book).slice(5)}</div>
                          <div className="mt-1"><StarRating value={ratingValue(book)} /></div>
                        </div>
                      </div>
                      {book.description && <p className="text-xs text-muted-foreground italic mt-2 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>&quot;{book.description}&quot;</p>}
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
