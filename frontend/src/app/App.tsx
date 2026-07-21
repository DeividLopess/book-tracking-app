import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart2,
  BookOpen,
  CalendarDays,
  Clock,
  Tags,
  X,
  Star,
} from "lucide-react";
import { defaultLanguage, getTranslation, type Language } from "./i18n";
import { BookModal } from "./components/BookModal";
import { CalendarTab } from "./components/CalendarTab";
import { LibraryTab } from "./components/LibraryTab";
import { StatsTab } from "./components/StatsTab";
import { TimelineTab } from "./components/TimelineTab";
import { MetadataTab } from "./components/MetadataTab";
import { RatingGuideTab } from "./components/RatingGuideTab";
import { toPayload, type Book, type BookForm, type Tab } from "./components/common";
import { Footer } from "./components/Footer";
import logo from "../assets/logo.svg";

import { initDatabase } from "../db/database";
import { listBooks, createBook, updateBook, deleteBook } from "../services/bookService";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [aboutOpen, setAboutOpen] = useState(false);
  const t = getTranslation(language);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [modal, setModal] = useState<{ open: boolean; book: Partial<Book> }>({
    open: false,
    book: {},
  });

  // Inicializa o banco SQLite local uma única vez, antes de qualquer
  // tentativa de ler/escrever dados. Só depois disso é seguro chamar
  // fetchBooks() ou qualquer outra função do bookService.
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error("Falha ao inicializar o banco:", err);
        setError(t.errors.loadBooks);
      });
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listBooks();
      setBooks(data);
    } catch {
      setError(t.errors.loadBooks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbReady) {
      fetchBooks();
    }
  }, [dbReady]);

  const handleSave = async (form: BookForm) => {
    try {
      const payload = toPayload(form);
      if (form.id) {
        await updateBook(form.id, payload);
      } else {
        await createBook(payload);
      }
      setModal({ open: false, book: {} });
      await fetchBooks();
    } catch (error) {
      setError(error instanceof Error ? error.message : t.errors.saveBook);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : t.errors.deleteBook);
    }
  };

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "library", label: t.tabs.library, icon: <BookOpen size={15} /> },
    { id: "timeline", label: t.tabs.timeline, icon: <Clock size={15} /> },
    {
      id: "calendar",
      label: t.tabs.calendar,
      icon: <CalendarDays size={15} />,
    },
    { id: "stats", label: t.tabs.stats, icon: <BarChart2 size={15} /> },
    { id: "ratings", label: "Avaliações", icon: <Star size={15} /> },
    { id: "metadata", label: t.tabs.metadata, icon: <Tags size={15} /> },
  ];

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <header className="mb-8">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-3">
              <div className="flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center rounded-full border border-border bg-primary/10">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-10 sm:h-auto sm:w-auto"
                />
              </div>

              <div>
                <h1
                  className="text-foreground leading-none"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                  }}
                >
                  {t.appTitle}
                </h1>

                <p className="mt-1 max-w-xs text-xs text-muted-foreground sm:max-w-none">
                  {t.header.aboutDescription}
                </p>
              </div>
            </div>

            <div
              className="flex flex-nowrap items-center gap-2"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground transition-all hover:border-accent/40 hover:text-foreground"
                style={{ fontFamily: "DM Mono", fontWeight: 600 }}
              >
                ⓘ {t.header.about}
              </button>

              <div className="flex overflow-hidden rounded-full border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setLanguage("pt")}
                  className={`px-3 py-1 text-[10px] uppercase transition-colors ${
                    language === "pt"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  PT
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-[10px] uppercase transition-colors ${
                    language === "en"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground">
              {t.header.booksCount.replace("{count}", String(books.length))}
            </div>

            <div className="text-right text-xs text-muted-foreground">
              {new Date().toLocaleDateString(
                language === "pt" ? "pt-BR" : "en-US",
                { year: "numeric", month: "long", day: "numeric" },
              )}
            </div>
          </div>
        </header>

        {aboutOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-2 sm:p-4">
            <div className="mx-0 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-2xl sm:mx-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    className="text-lg text-foreground"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 600,
                    }}
                  >
                    {t.header.about}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t.header.aboutDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAboutOpen(false)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 rounded-md border border-border bg-background/60 p-4">
                <div className="space-y-3 text-sm leading-7 text-foreground">
                  {t.header.aboutContent.split("\n").map((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={index} />;
                    if (trimmed.startsWith("##")) {
                      return (
                        <h3
                          key={index}
                          className="text-base font-semibold"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {trimmed.replace(/^##\s?/, "")}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("###")) {
                      return (
                        <h4
                          key={index}
                          className="text-sm font-semibold"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {trimmed.replace(/^###\s?/, "")}
                        </h4>
                      );
                    }
                    if (trimmed.startsWith("- **")) {
                      return (
                        <p
                          key={index}
                          className="text-sm leading-7 text-foreground"
                        >
                          {trimmed}
                        </p>
                      );
                    }
                    if (trimmed.startsWith("**PIX:**")) {
                      return (
                        <p key={index} className="font-semibold">
                          {trimmed}
                        </p>
                      );
                    }
                    return (
                      <p
                        key={index}
                        className="text-sm leading-7 text-foreground"
                      >
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAboutOpen(false)}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent transition-colors"
                >
                  {t.actions.close}
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="mb-6 flex w-full flex-wrap gap-1 overflow-x-auto border border-border bg-card sm:mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 text-xs transition-all sm:min-w-[160px] sm:flex-1 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>

        {activeTab === "library" && (
          <LibraryTab
            books={books}
            loading={loading}
            error={error}
            onAdd={() => setModal({ open: true, book: {} })}
            onEdit={(book) => setModal({ open: true, book })}
            onDelete={handleDelete}
            language={language}
          />
        )}
        {activeTab === "timeline" && (
          <TimelineTab books={books} language={language} />
        )}
        {activeTab === "calendar" && (
          <CalendarTab books={books} language={language} />
        )}
        {activeTab === "stats" && (
          <StatsTab books={books} language={language} />
        )}
        {activeTab === "ratings" && (
          <RatingGuideTab
            books={books}
            onEdit={(book) => setModal({ open: true, book })}
            onDelete={handleDelete}
            language={language}
          />
        )}
        {activeTab === "metadata" && <MetadataTab language={language} />}
      </div>

      {modal.open && (
        <BookModal
          book={modal.book}
          onSave={handleSave}
          onClose={() => setModal({ open: false, book: {} })}
          language={language}
        />
      )}
      <Footer language={language} />
    </div>
  );
}