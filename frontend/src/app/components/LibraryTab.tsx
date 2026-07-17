import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { getTranslation } from "../i18n";
import { BookCard } from "./BookCard";
import { Search } from "lucide-react";
import {
  bookDate,
  ratingValue,
  readingStatus,
  type Book,
  type Language,
  type ReadingStatus,
} from "./common";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { BookDetailsModal } from "./BookDetailsModal";

export function LibraryTab({
  books,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  language,
}: {
  books: Book[];
  loading: boolean;
  error: string | null;
  onAdd: () => void;
  onEdit: (b: Book) => void;
  onDelete: (id: number) => void;
  language: Language;
}) {
  const [search, setSearch] = useState("");
  const t = getTranslation(language);
  const [filterGenre, setFilterGenre] = useState(t.library.all);
  const [statusFilter, setStatusFilter] = useState<ReadingStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "rating">("date");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    setFilterGenre(t.library.all);
  }, [t.library.all]);

  const genres = useMemo(
    () => [
      t.library.all,
      ...Array.from(new Set(books.map((b) => b.genre))).sort(),
    ],
    [books, t.library.all],
  );
  const filtered = useMemo(() => {
    let result = books.filter((b) => {
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    });
    if (filterGenre !== t.library.all)
      result = result.filter((b) => b.genre === filterGenre);
    if (statusFilter !== "all")
      result = result.filter((b) => readingStatus(b) === statusFilter);
    return [...result].sort((a, b) => {
      if (sortBy === "date") return bookDate(b).localeCompare(bookDate(a));
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return ratingValue(b) - ratingValue(a);
    });
  }, [books, search, filterGenre, statusFilter, sortBy, t.library.all]);

  const finishedBooks = books.filter((b) => b.status === "finished");
  const totalPages = finishedBooks.reduce((s, b) => s + b.pages, 0);
  const rated = finishedBooks.filter((b) => b.rating !== null);
  const hasActiveFilters =
    search.trim() !== "" ||
    filterGenre !== t.library.all ||
    statusFilter !== "all";
  const activeFilterLabels = [
    search.trim()
      ? { label: `${t.actions.filterSearch}: ${search.trim()}` }
      : null,
    filterGenre !== t.library.all
      ? { label: `${t.actions.filterGenre}: ${filterGenre}` }
      : null,
    statusFilter !== "all"
      ? {
          label: `${t.actions.filterStatus}: ${t.library.status[statusFilter]}`,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string }>;

  const clearAllFilters = () => {
    setSearch("");
    setFilterGenre(t.library.all);
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: t.library.booksRead, value: finishedBooks.length },
          { label: t.library.pagesRead, value: totalPages.toLocaleString() },
          {
            label: t.library.averageRating,
            value: rated.length
              ? (
                  rated.reduce((s, b) => s + ratingValue(b), 0) / rated.length
                ).toFixed(1)
              : "-",
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border p-2 sm:px-4 sm:py-3"
          >
            <div
              className="text-lg sm:text-2xl text-foreground"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
              }}
            >
              {value}
            </div>
            <div
              className="mt-0.5 text-[8px] sm:text-xs text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.currentTarget.value)
            }
            placeholder={t.actions.searchPlaceholder}
            className="w-full bg-card border border-border py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:flex-1 sm:items-center">
          <div className="relative">
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.currentTarget.value)}
              className="w-full appearance-none bg-card border border-border px-2 py-2 pr-7 text-xs sm:px-3 sm:text-sm text-foreground focus:outline-none"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.currentTarget.value as ReadingStatus)
              }
              className="w-full appearance-none bg-card border border-border px-2 py-2 pr-7 text-xs sm:px-3 sm:text-sm text-foreground focus:outline-none"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <option value="all">{t.library.all}</option>
              <option value="finished">{t.library.status.finished}</option>
              <option value="in_progress">
                {t.library.status.in_progress}
              </option>
              <option value="not_started">
                {t.library.status.not_started}
              </option>
              <option value="abandoned">{t.library.status.abandoned}</option>
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.currentTarget.value as "date" | "name" | "rating")
              }
              className="w-full appearance-none bg-card border border-border px-2 py-2 pr-7 text-xs sm:px-3 sm:text-sm text-foreground focus:outline-none"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <option value="date">{t.library.byDate}</option>
              <option value="name">{t.library.byName}</option>
              <option value="rating">{t.library.byRating}</option>
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-1 bg-primary px-3 py-2 text-xs text-primary-foreground transition-colors hover:bg-accent sm:hidden"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={onAdd}
          className="hidden items-center justify-center gap-2 bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-accent sm:flex"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          <Plus size={15} />
          {t.actions.addBook}
        </button>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2">
          <span
            className="text-xs uppercase tracking-widest text-muted-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {t.actions.filterActive}
          </span>
          {activeFilterLabels.map((filter) => (
            <span
              key={filter.label}
              className="px-2 py-1 text-xs bg-secondary text-foreground border border-border"
            >
              {filter.label}
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-auto text-xs text-primary hover:text-accent transition-colors"
          >
            {t.actions.clearFilters}
          </button>
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <div className="flex overflow-hidden rounded-full border border-border bg-card">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-xs transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ☰
          </button>

          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1 text-xs transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ▦
          </button>
        </div>
      </div>
      <div
        className={
          viewMode === "list"
            ? "space-y-3 sm:space-y-2"
            : "grid grid-cols-2 gap-4 md:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]"
        }
      >
        {error && (
          <div className="py-16 text-center text-destructive">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            {t.library.empty}
          </div>
        )}

        {!loading &&
          !error &&
          filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onView={() => setSelectedBook(book)}
              onEdit={() => onEdit(book)}
              onDelete={() => setBookToDelete(book)}
              language={language}
              viewMode={viewMode}
            />
          ))}

        <ConfirmDeleteModal
          open={bookToDelete !== null}
          title="Excluir livro"
          message={`Tem certeza que deseja excluir "${bookToDelete?.name}"? Esta ação não pode ser desfeita.`}
          onCancel={() => setBookToDelete(null)}
          onConfirm={() => {
            if (!bookToDelete) return;

            onDelete(bookToDelete.id);
            setBookToDelete(null);
          }}
        />
        <BookDetailsModal
          book={selectedBook}
          language={language}
          onClose={() => setSelectedBook(null)}
        />
      </div>
    </div>
  );
}
