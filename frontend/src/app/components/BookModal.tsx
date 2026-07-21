import { useEffect, useState } from "react";
import { Check, ChevronDown, Edit2, Heart, Trash2, X } from "lucide-react";
import { getTranslation } from "../i18n";
import {
  COVER_COLORS,
  toForm,
  type Book,
  type BookComment,
  type BookForm,
  type Language,
  type MetadataItem,
  type ModalTab,
} from "./common";
import { StarRating } from "./StarRating";
import * as bookService from "../../services/bookService";
import * as metadataService from "../../services/metadataService";

export function BookModal({
  book,
  onSave,
  onClose,
  language,
}: {
  book: Partial<Book>;
  onSave: (b: BookForm) => void;
  onClose: () => void;
  language: Language;
}) {
  const [form, setForm] = useState<BookForm>(toForm(book));
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<ModalTab>("book");
  const [genres, setGenres] = useState<MetadataItem[]>([]);
  const [authors, setAuthors] = useState<MetadataItem[]>([]);
  const [genreDrafts, setGenreDrafts] = useState<Record<number, string>>({});
  const [authorDrafts, setAuthorDrafts] = useState<Record<number, string>>({});
  const [editingGenreId, setEditingGenreId] = useState<number | null>(null);
  const [editingAuthorId, setEditingAuthorId] = useState<number | null>(null);
  const [newGenre, setNewGenre] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [comments, setComments] = useState<BookComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const set = (k: keyof BookForm, v: BookForm[keyof BookForm]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const refreshMetadata = async () => {
    try {
      const [nextGenres, nextAuthors] = await Promise.all([
        metadataService.listGenres(),
        metadataService.listAuthors(),
      ]);

      setGenres(nextGenres);
      setAuthors(nextAuthors);
      setForm((current) => ({
        ...current,
        genre: nextGenres.some((item) => item.name === current.genre)
          ? current.genre
          : (nextGenres[0]?.name ?? ""),
        author: nextAuthors.some((item) => item.name === current.author)
          ? current.author
          : (nextAuthors[0]?.name ?? ""),
      }));
    } catch {
      setGenres([]);
      setAuthors([]);
    }
  };

  useEffect(() => {
    refreshMetadata();
  }, []);

  const refreshComments = async () => {
    if (!book.id) {
      setComments([]);
      return;
    }

    const data = await bookService.listComments(book.id);
    setComments(data as BookComment[]);
  };

  useEffect(() => {
    refreshComments().catch(() =>
      setCommentError("Não foi possível carregar os comentários."),
    );
  }, [book.id]);

  const addComment = async () => {
    const content = commentDraft.trim();
    if (!book.id || !content) return;

    try {
      setCommentError(null);
      await bookService.createComment(book.id, { content });
      setCommentDraft("");
      await refreshComments();
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar o comentário.",
      );
    }
  };

  const updateComment = async (commentId: number) => {
    const content = editingCommentContent.trim();
    if (!book.id || !content) return;

    try {
      setCommentError(null);
      await bookService.updateComment(book.id, commentId, { content });
      setEditingCommentId(null);
      await refreshComments();
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Não foi possível editar o comentário.",
      );
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!book.id || !window.confirm("Excluir este comentário?")) return;

    try {
      setCommentError(null);
      await bookService.deleteComment(book.id, commentId);
      await refreshComments();
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o comentário.",
      );
    }
  };

  const formatCommentDate = (value: string) => {
    const isoDate = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
      ? value
      : `${value.replace(" ", "T")}Z`;
    return new Date(isoDate).toLocaleString(
      language === "pt" ? "pt-BR" : "en-US",
      { dateStyle: "medium", timeStyle: "short" },
    );
  };

  const addGenre = async () => {
    const value = newGenre.trim();
    if (
      !value ||
      genres.some((item) => item.name.toLowerCase() === value.toLowerCase())
    )
      return;

    try {
      await metadataService.createGenre({ name: value });
      setNewGenre("");
      await refreshMetadata();
      set("genre", value);
    } catch {
      // no-op
    }
  };

  const updateGenre = async (id: number) => {
    const value = (genreDrafts[id] ?? "").trim();
    if (!value) return;
    if (
      genres.some(
        (item) =>
          item.id !== id && item.name.toLowerCase() === value.toLowerCase(),
      )
    )
      return;

    try {
      await metadataService.updateGenre(id, { name: value });
      setEditingGenreId(null);
      await refreshMetadata();
      set("genre", value);
    } catch {
      // no-op
    }
  };

  const deleteGenre = async (id: number) => {
    const item = genres.find((genre) => genre.id === id);
    if (!window.confirm(`Excluir o gênero ${item?.name ?? "selecionado"}?`))
      return;

    try {
      await metadataService.deleteGenre(id);
      await refreshMetadata();
    } catch {
      // no-op
    }
  };

  const addAuthor = async () => {
    const value = newAuthor.trim();
    if (
      !value ||
      authors.some((item) => item.name.toLowerCase() === value.toLowerCase())
    )
      return;

    try {
      await metadataService.createAuthor({ name: value });
      setNewAuthor("");
      await refreshMetadata();
      set("author", value);
    } catch {
      // no-op
    }
  };

  const updateAuthor = async (id: number) => {
    const value = (authorDrafts[id] ?? "").trim();
    if (!value) return;
    if (
      authors.some(
        (item) =>
          item.id !== id && item.name.toLowerCase() === value.toLowerCase(),
      )
    )
      return;

    try {
      await metadataService.updateAuthor(id, { name: value });
      setEditingAuthorId(null);
      await refreshMetadata();
      set("author", value);
    } catch {
      // no-op
    }
  };

  const deleteAuthor = async (id: number) => {
    const item = authors.find((author) => author.id === id);
    if (!window.confirm(`Excluir o autor ${item?.name ?? "selecionado"}?`))
      return;

    try {
      await metadataService.deleteAuthor(id);
      await refreshMetadata();
    } catch {
      // no-op
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm px-2 py-3 sm:px-4">
      <div
        className="bg-card w-full max-w-lg mx-0 shadow-2xl border border-border max-h-[90vh] flex flex-col overflow-hidden"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0 sm:px-6">
          <h2
            className="text-lg text-foreground"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
          >
            {book.id ? t.bookForm.editTitle : t.bookForm.createTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 pt-4 flex-shrink-0 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab("book")}
            className={`px-3 py-2 text-sm transition-colors ${activeTab === "book" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            {t.tabs.book}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`px-3 py-2 text-sm transition-colors ${activeTab === "comments" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            {t.tabs.comments}
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {activeTab === "book" ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.name}
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.currentTarget.value)}
                    className="w-full bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.author}
                  </label>
                  <select
                    value={form.author}
                    onChange={(e) => set("author", e.currentTarget.value)}
                    className="w-full appearance-none bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8"
                  >
                    {authors.map((author) => (
                      <option key={author.id} value={author.name}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.genre}
                  </label>
                  <div className="relative">
                    <select
                      value={form.genre}
                      onChange={(e) => set("genre", e.currentTarget.value)}
                      className="w-full appearance-none bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8"
                    >
                      {genres.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.pages}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.pages}
                    onChange={(e) =>
                      set("pages", parseInt(e.currentTarget.value) || 1)
                    }
                    className="w-full bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div></div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.startedAt}
                  </label>
                  <input
                    type="date"
                    value={form.started_at}
                    onChange={(e) => set("started_at", e.currentTarget.value)}
                    className="w-full bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t.bookForm.startedAtHint}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.finishedAt}
                  </label>
                  <input
                    type="date"
                    value={form.finished_at}
                    onChange={(e) => set("finished_at", e.currentTarget.value)}
                    className="w-full bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.imageUrl}
                  </label>
                  <input
                    value={form.image_url}
                    onChange={(e) => set("image_url", e.currentTarget.value)}
                    className="w-full bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  {t.bookForm.rating}
                </label>
                <StarRating
                  value={form.rating ?? 0}
                  onChange={(v) => set("rating", v)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:col-span-2 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.favorite}
                  </label>
                  <div>
                    <button
                      type="button"
                      onClick={() => set("favorite", !form.favorite)}
                      className={`flex h-10 w-10 items-center justify-center border transition-colors ${form.favorite ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-input-background text-muted-foreground hover:text-destructive"}`}
                      aria-label={t.bookForm.favorite}
                      aria-pressed={form.favorite}
                    >
                      <Heart
                        size={18}
                        fill={form.favorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                    {t.bookForm.abandoned}
                  </label>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "status",
                          form.status === "abandoned"
                            ? form.finished_at
                              ? "finished"
                              : form.started_at
                                ? "in_progress"
                                : "not_started"
                            : "abandoned",
                        )
                      }
                      className={`flex h-10 w-10 items-center justify-center border transition-colors ${form.status === "abandoned" ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-input-background text-muted-foreground hover:text-destructive"}`}
                      aria-label={t.bookForm.abandoned}
                      aria-pressed={form.status === "abandoned"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block">
                      {t.bookForm.spineColor}
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.bookForm.spineColorHint}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Cor personalizada da lombada"
                      value={form.coverColor}
                      onChange={(e) => set("coverColor", e.currentTarget.value)}
                      className="h-8 w-10 cursor-pointer border border-border bg-input-background p-0.5"
                    />
                    <span
                      className="text-xs text-muted-foreground uppercase"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {t.bookForm.custom}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap border-t border-border pt-3">
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Usar cor sugerida ${c}`}
                      onClick={() => set("coverColor", c)}
                      className="w-6 h-6 rounded-sm border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor:
                          form.coverColor === c ? "#1C1510" : "transparent",
                      }}
                    >
                      {form.coverColor === c && (
                        <Check size={12} className="text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">
                  {t.bookForm.description}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.currentTarget.value)}
                  rows={3}
                  className="w-full bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </>
          ) : activeTab === "comments" ? (
            <div className="space-y-4">
              {!book.id ? (
                <p className="border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  {t.comments.saveBookFirst}
                </p>
              ) : (
                <>
                  <div className="border border-border bg-secondary/40 p-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {t.comments.add}
                    </label>
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.currentTarget.value)}
                      rows={3}
                      placeholder={t.comments.placeholder}
                      className="w-full resize-none border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={addComment}
                        disabled={!commentDraft.trim()}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t.comments.add}
                      </button>
                    </div>
                  </div>
                  {commentError && (
                    <p className="text-sm text-destructive">{commentError}</p>
                  )}
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t.comments.empty}
                      </p>
                    ) : (
                      comments.map((comment) => {
                        const isEditing = editingCommentId === comment.id;
                        return (
                          <article
                            key={comment.id}
                            className="border border-border bg-card p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <time className="block text-xs text-muted-foreground">
                                {formatCommentDate(comment.created_at)}
                              </time>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingCommentContent(comment.content);
                                  }}
                                  className="p-1 text-muted-foreground transition-colors hover:text-accent"
                                  aria-label={t.comments.edit}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteComment(comment.id)}
                                  className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                                  aria-label={t.comments.delete}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {isEditing ? (
                              <>
                                <textarea
                                  value={editingCommentContent}
                                  onChange={(e) =>
                                    setEditingCommentContent(
                                      e.currentTarget.value,
                                    )
                                  }
                                  rows={3}
                                  className="mt-2 w-full resize-none border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                  >
                                    {t.actions.cancel}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateComment(comment.id)}
                                    disabled={!editingCommentContent.trim()}
                                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-accent disabled:opacity-40"
                                  >
                                    {t.actions.save}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                                {comment.content}
                              </p>
                            )}
                          </article>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          ) : activeTab === "genres" ? (
            <div className="space-y-4">
              <div className="bg-secondary/40 border border-border p-4">
                <h3
                  className="text-sm text-foreground"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                  }}
                >
                  {t.metadata.addGenre}
                </h3>
                <div className="flex gap-2 mt-3">
                  <input
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.currentTarget.value)}
                    placeholder={t.metadata.genrePlaceholder}
                    className="flex-1 bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addGenre}
                    disabled={!newGenre.trim()}
                    className="px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {genres.map((genre) => {
                  const isEditing = editingGenreId === genre.id;
                  return (
                    <div
                      key={genre.id}
                      className="flex items-center justify-between gap-2 border border-border bg-card px-3 py-2"
                    >
                      {isEditing ? (
                        <input
                          value={genreDrafts[genre.id] ?? genre.name}
                          onChange={(e) =>
                            setGenreDrafts((prev) => ({
                              ...prev,
                              [genre.id]: e.currentTarget.value,
                            }))
                          }
                          className="flex-1 bg-input-background border border-border px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      ) : (
                        <span className="text-sm text-foreground">
                          {genre.name}
                        </span>
                      )}
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateGenre(genre.id)}
                              className="p-1.5 text-primary hover:text-accent transition-colors"
                              aria-label="Salvar gênero"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingGenreId(null)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Cancelar edição de gênero"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGenreId(genre.id);
                                setGenreDrafts((prev) => ({
                                  ...prev,
                                  [genre.id]: genre.name,
                                }));
                              }}
                              className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                              aria-label="Editar gênero"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGenre(genre.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Excluir gênero"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/40 border border-border p-4">
                <h3
                  className="text-sm text-foreground"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                  }}
                >
                  {t.metadata.addAuthor}
                </h3>
                <div className="flex gap-2 mt-3">
                  <input
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.currentTarget.value)}
                    placeholder={t.metadata.authorPlaceholder}
                    className="flex-1 bg-input-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addAuthor}
                    disabled={!newAuthor.trim()}
                    className="px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {authors.map((author) => {
                  const isEditing = editingAuthorId === author.id;
                  return (
                    <div
                      key={author.id}
                      className="flex items-center justify-between gap-2 border border-border bg-card px-3 py-2"
                    >
                      {isEditing ? (
                        <input
                          value={authorDrafts[author.id] ?? author.name}
                          onChange={(e) =>
                            setAuthorDrafts((prev) => ({
                              ...prev,
                              [author.id]: e.currentTarget.value,
                            }))
                          }
                          className="flex-1 bg-input-background border border-border px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      ) : (
                        <span className="text-sm text-foreground">
                          {author.name}
                        </span>
                      )}
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateAuthor(author.id)}
                              className="p-1.5 text-primary hover:text-accent transition-colors"
                              aria-label="Salvar autor"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAuthorId(null)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Cancelar edição de autor"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAuthorId(author.id);
                                setAuthorDrafts((prev) => ({
                                  ...prev,
                                  [author.id]: author.name,
                                }));
                              }}
                              className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                              aria-label="Editar autor"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAuthor(author.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Excluir autor"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-4 flex-shrink-0 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.bookForm.cancelEntry}
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.author || !form.image_url}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.bookForm.saveEntry}
          </button>
        </div>
      </div>
    </div>
  );
}