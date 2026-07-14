import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { getTranslation } from "../i18n";
import { BookCard } from "./BookCard";
import { bookDate, ratingValue, readingStatus, type Book, type Language, type ReadingStatus } from "./common";

export function LibraryTab({ books, loading, error, onAdd, onEdit, onDelete, language }: { books: Book[]; loading: boolean; error: string | null; onAdd: () => void; onEdit: (b: Book) => void; onDelete: (id: number) => void; language: Language }) {
  const [search, setSearch] = useState("");
  const t = getTranslation(language);
  const [filterGenre, setFilterGenre] = useState(t.library.all);
  const [statusFilter, setStatusFilter] = useState<ReadingStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "rating">("date");

  useEffect(() => {
    setFilterGenre(t.library.all);
  }, [t.library.all]);

  const genres = useMemo(() => [t.library.all, ...Array.from(new Set(books.map((b) => b.genre))).sort()], [books, t.library.all]);
  const filtered = useMemo(() => {
    let result = books.filter((b) => {
      const q = search.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    });
    if (filterGenre !== t.library.all) result = result.filter((b) => b.genre === filterGenre);
    if (statusFilter !== "all") result = result.filter((b) => readingStatus(b) === statusFilter);
    return [...result].sort((a, b) => {
      if (sortBy === "date") return bookDate(b).localeCompare(bookDate(a));
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return ratingValue(b) - ratingValue(a);
    });
  }, [books, search, filterGenre, statusFilter, sortBy, t.library.all]);

  const finishedBooks = books.filter((b) => b.status === "finished");
  const totalPages = finishedBooks.reduce((s, b) => s + b.pages, 0);
  const rated = finishedBooks.filter((b) => b.rating !== null);
  const hasActiveFilters = search.trim() !== "" || filterGenre !== t.library.all || statusFilter !== "all";
  const activeFilterLabels = [
    search.trim() ? { label: `${t.actions.filterSearch}: ${search.trim()}` } : null,
    filterGenre !== t.library.all ? { label: `${t.actions.filterGenre}: ${filterGenre}` } : null,
    statusFilter !== "all" ? { label: `${t.actions.filterStatus}: ${t.library.status[statusFilter]}` } : null,
  ].filter(Boolean) as Array<{ label: string }>;

  const clearAllFilters = () => {
    setSearch("");
    setFilterGenre(t.library.all);
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t.library.booksRead, value: finishedBooks.length },
          { label: t.library.pagesRead, value: totalPages.toLocaleString() },
          { label: t.library.averageRating, value: rated.length ? (rated.reduce((s, b) => s + ratingValue(b), 0) / rated.length).toFixed(1) : "-" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border px-4 py-3">
            <div className="text-2xl text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input value={search} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)} placeholder={t.actions.searchPlaceholder} className="w-full min-w-[180px] flex-1 bg-card border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto" style={{ fontFamily: "'Nunito', sans-serif" }} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:flex-1 sm:items-center">
          <div className="relative">
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.currentTarget.value)} className="w-full appearance-none bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none pr-7" style={{ fontFamily: "'DM Mono', monospace" }}>
              {genres.map((g) => <option key={g}>{g}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.currentTarget.value as ReadingStatus)} className="w-full appearance-none bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none pr-7" style={{ fontFamily: "'DM Mono', monospace" }}>
              <option value="all">{t.library.all}</option>
              <option value="finished">{t.library.status.finished}</option>
              <option value="in_progress">{t.library.status.in_progress}</option>
              <option value="not_started">{t.library.status.not_started}</option>
              <option value="abandoned">{t.library.status.abandoned}</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.currentTarget.value as "date" | "name" | "rating")} className="w-full appearance-none bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none pr-7" style={{ fontFamily: "'DM Mono', monospace" }}>
              <option value="date">{t.library.byDate}</option>
              <option value="name">{t.library.byName}</option>
              <option value="rating">{t.library.byRating}</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <button onClick={onAdd} className="flex w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-accent sm:w-auto" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <Plus size={15} />
          {t.actions.addBook}
        </button>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{t.actions.filterActive}</span>
          {activeFilterLabels.map((filter) => (
            <span key={filter.label} className="px-2 py-1 text-xs bg-secondary text-foreground border border-border">
              {filter.label}
            </span>
          ))}
          <button type="button" onClick={clearAllFilters} className="ml-auto text-xs text-primary hover:text-accent transition-colors">
            {t.actions.clearFilters}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {loading && <div className="text-center py-16 text-muted-foreground">{t.library.loading}</div>}
        {error && <div className="text-center py-16 text-destructive">{error}</div>}
        {!loading && !error && filtered.length === 0 && <div className="text-center py-16 text-muted-foreground">{t.library.empty}</div>}
        {!loading && !error && filtered.map((book) => <BookCard key={book.id} book={book} onEdit={() => onEdit(book)} onDelete={() => onDelete(book.id)} language={language} />)}
      </div>
    </div>
  );
}
