import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslation } from "../i18n";
import { addDays, parseBookDate, sameDate, type Book, type Language } from "./common";

export function CalendarTab({ books, language }: { books: Book[]; language: Language }) {
  const t = getTranslation(language);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const readingPeriods = useMemo(() => {
    return books
      .map((book) => {
        const start = parseBookDate(book.started_at);
        if (!start) return null;
        const finished = parseBookDate(book.finished_at);
        return {
          book,
          start,
          end: finished ?? start,
          inProgress: !finished,
        };
      })
      .filter((period): period is { book: Book; start: Date; end: Date; inProgress: boolean } => Boolean(period));
  }, [books]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = addDays(firstDay, -firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [visibleMonth]);

  const locale = language === "pt" ? "pt-BR" : "en-US";
  const monthLabel = visibleMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const weekDays = language === "pt" ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const changeMonth = (direction: number) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground capitalize" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.35rem" }}>{monthLabel}</h2>
          <p className="text-xs text-muted-foreground mt-1">{t.calendar.monthLabel}</p>
        </div>
        <div className="flex border border-border bg-card">
          <button type="button" onClick={() => changeMonth(-1)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" aria-label={t.calendar.prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => changeMonth(1)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-l border-border" aria-label={t.calendar.nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border p-4">
        <div className="grid grid-cols-7 gap-0 border-b border-border pb-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {calendarDays.map((day) => {
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const isToday = sameDate(day, new Date());
            const periods = readingPeriods.filter(({ start, end }) => day >= start && day <= end).slice(0, 3);

            return (
              <div key={day.toISOString()} className="relative min-h-20 border-b border-r border-border/60 p-2 last:border-r-0">
                <div className={`inline-flex h-6 min-w-6 items-center justify-center text-sm ${isToday ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                  {day.getDate()}
                </div>
                <div className="absolute left-0 right-0 bottom-2 space-y-1 px-1">
                  {periods.map(({ book, start, end, inProgress }) => {
                    const startsHere = sameDate(day, start);
                    const endsHere = sameDate(day, end);
                    const rounded = inProgress || (startsHere && endsHere);
                    const radiusClass = rounded ? "rounded-full" : `${startsHere ? "rounded-l-full" : ""} ${endsHere ? "rounded-r-full" : ""}`;
                    return (
                      <div
                        key={`${book.id}-${day.toISOString()}`}
                        title={`${book.name}${inProgress ? ` - ${t.calendar.inProgress}` : ""}`}
                        className={`h-1.5 ${radiusClass}`}
                        style={{ backgroundColor: book.coverColor }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">{t.calendar.legend}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {readingPeriods.slice(0, 8).map(({ book, inProgress }) => (
            <div key={book.id} className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: book.coverColor }} />
              <span className="truncate text-sm text-foreground">{book.name}</span>
              {inProgress && <span className="text-xs text-muted-foreground">{t.calendar.inProgress}</span>}
            </div>
          ))}
          {readingPeriods.length === 0 && <div className="text-sm text-muted-foreground">{t.calendar.noReadingPeriods}</div>}
        </div>
      </div>
    </div>
  );
}
