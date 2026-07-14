import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BarChart2, BookOpen, CalendarDays, Clock, Tags, X, Star } from "lucide-react";
import { defaultLanguage, getTranslation, type Language } from "./i18n";
import { BookModal } from "./components/BookModal";
import { CalendarTab } from "./components/CalendarTab";
import { LibraryTab } from "./components/LibraryTab";
import { StatsTab } from "./components/StatsTab";
import { TimelineTab } from "./components/TimelineTab";
import { MetadataTab } from "./components/MetadataTab";
import { RatingGuideTab } from "./components/RatingGuideTab";
import { apiRequest, toPayload, type Book, type BookForm, type Tab } from "./components/common";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [aboutOpen, setAboutOpen] = useState(false);
  const t = getTranslation(language);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [modal, setModal] = useState<{ open: boolean; book: Partial<Book> }>({ open: false, book: {} });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest("/books");
      const data = (await response.json()) as { books: Book[] };
      setBooks(data.books);
    } catch {
      setError(t.errors.loadBooks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSave = async (form: BookForm) => {
    try {
      const payload = toPayload(form);
      if (form.id) {
        await apiRequest(`/books/update/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiRequest("/books", { method: "POST", body: JSON.stringify(payload) });
      }
      setModal({ open: false, book: {} });
      await fetchBooks();
    } catch (error) {
      setError(error instanceof Error ? error.message : t.errors.saveBook);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/books/delete/${id}`, { method: "DELETE" });
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : t.errors.deleteBook);
    }
  };

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "library", label: t.tabs.library, icon: <BookOpen size={15} /> },
    { id: "timeline", label: t.tabs.timeline, icon: <Clock size={15} /> },
    { id: "calendar", label: t.tabs.calendar, icon: <CalendarDays size={15} /> },
    { id: "stats", label: t.tabs.stats, icon: <BarChart2 size={15} /> },
    { id: "ratings", label: "Avaliações", icon: <Star size={15} /> },
    { id: "metadata", label: t.tabs.metadata, icon: <Tags size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary/10">
                <BookOpen size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-foreground leading-none" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>{t.appTitle}</h1>
                <p className="mt-1 text-xs text-muted-foreground">{t.header.aboutDescription}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-accent/40 hover:text-foreground"
                style={{ fontFamily: "DM Mono", fontWeight: 600 }}
              >
                {t.header.about}
              </button>
              <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="border border-border bg-card px-2 py-1 text-[11px] text-foreground focus:outline-none">
                <option value="pt">PT</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">{t.header.booksCount.replace("{count}", String(books.length))}</div>
            <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </header>

        {aboutOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-2 sm:p-4">
            <div className="mx-0 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-2xl sm:mx-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                    {t.header.about}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t.header.aboutDescription}</p>
                </div>
                <button type="button" onClick={() => setAboutOpen(false)} className="text-muted-foreground transition-colors hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 rounded-md border border-border bg-background/60 p-4">
                <div className="space-y-3 text-sm leading-7 text-foreground">
                  {t.header.aboutContent.split("\n").map((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={index} />;
                    if (trimmed.startsWith("##")) {
                      return <h3 key={index} className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{trimmed.replace(/^##\s?/, "")}</h3>;
                    }
                    if (trimmed.startsWith("###")) {
                      return <h4 key={index} className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{trimmed.replace(/^###\s?/, "")}</h4>;
                    }
                    if (trimmed.startsWith("- **")) {
                      return <p key={index} className="text-sm leading-7 text-foreground">{trimmed}</p>;
                    }
                    if (trimmed.startsWith("**PIX:**")) {
                      return <p key={index} className="font-semibold">{trimmed}</p>;
                    }
                    return <p key={index} className="text-sm leading-7 text-foreground">{trimmed}</p>;
                  })}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setAboutOpen(false)} className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent transition-colors">
                  {t.actions.close}
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="mb-8 flex w-full flex-wrap gap-1 overflow-x-auto border border-border bg-card sm:w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-all sm:flex-none sm:px-5 ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "library" && <LibraryTab books={books} loading={loading} error={error} onAdd={() => setModal({ open: true, book: {} })} onEdit={(book) => setModal({ open: true, book })} onDelete={handleDelete} language={language} />}
        {activeTab === "timeline" && <TimelineTab books={books} language={language} />}
        {activeTab === "calendar" && <CalendarTab books={books} language={language} />}
        {activeTab === "stats" && <StatsTab books={books} language={language} />}
        {activeTab === "ratings" && <RatingGuideTab books={books} onEdit={(book) => setModal({ open: true, book })} onDelete={handleDelete} language={language} />}
        {activeTab === "metadata" && <MetadataTab language={language} />}
      </div>

      {modal.open && <BookModal book={modal.book} onSave={handleSave} onClose={() => setModal({ open: false, book: {} })} language={language} />}
    </div>
  );
}
