import { Heart, X, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getTranslation } from "../i18n";
import {
  apiRequest,
  ratingValue,
  toDateInput,
  type Book,
  type BookComment,
  type Language,
} from "./common";
import { StarRating } from "./StarRating";

type Props = {
  book: Book | null;
  language: Language;
  onClose: () => void;
};

export function BookDetailsModal({ book, language, onClose }: Props) {
  const t = getTranslation(language);

  const [comments, setComments] = useState<BookComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  useEffect(() => {
    if (!book?.id) {
      setComments([]);
      return;
    }

    refreshComments();
  }, [book?.id]);

  if (!book) return null;

  const refreshComments = async () => {
    try {
      const response = await apiRequest(`/books/${book.id}/comments`);
      const data = (await response.json()) as {
        comments: BookComment[];
      };

      setComments(data.comments);
    } catch {
      setCommentError("Não foi possível carregar os comentários.");
    }
  };

  const addComment = async () => {
    const content = commentDraft.trim();

    if (!content || !book.id) return;

    try {
      await apiRequest(`/books/${book.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      setCommentDraft("");
      await refreshComments();
    } catch {
      setCommentError("Não foi possível adicionar comentário.");
    }
  };

  const updateComment = async (id: number) => {
    const content = editingCommentContent.trim();

    if (!content || !book.id) return;

    try {
      await apiRequest(`/books/${book.id}/comments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });

      setEditingCommentId(null);
      await refreshComments();
    } catch {
      setCommentError("Não foi possível editar comentário.");
    }
  };

  const deleteComment = async (id: number) => {
    if (!book.id) return;

    if (!window.confirm("Excluir este comentário?")) return;

    try {
      await apiRequest(`/books/${book.id}/comments/${id}`, {
        method: "DELETE",
      });

      await refreshComments();
    } catch {
      setCommentError("Não foi possível excluir comentário.");
    }
  };

  const date = toDateInput(book.finished_at);

  const locale = language === "pt" ? "pt-BR" : "en-US";

  const formatted =
    book.status === "finished" && date
      ? new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : t.library.status[book.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2
            className="text-2xl font-semibold"
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {book.name}
          </h2>

          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
          <img
            src={book.image_url}
            alt={book.name}
            className="w-full rounded-lg object-cover shadow-lg"
          />

          <div className="space-y-4">
            <p className="text-lg">{book.author}</p>

            <div className="flex items-center gap-3">
              <StarRating value={ratingValue(book)} />

              {book.favorite && (
                <Heart
                  size={18}
                  className="fill-destructive text-destructive"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p>{t.library.status[book.status]}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Gênero</p>
                <p>{book.genre}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Páginas</p>
                <p>{book.pages}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p>{formatted}</p>
              </div>
            </div>

            {book.description && (
              <div>
                <h3 className="mb-2 font-semibold">
                  Descrição
                </h3>

                <p className="whitespace-pre-wrap text-muted-foreground">
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COMENTÁRIOS */}
        <div className="border-t p-6 space-y-4">
          <h3 className="font-semibold">
            {t.tabs.comments}
          </h3>

          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            rows={3}
            placeholder="Adicionar comentário..."
            className="w-full resize-none border bg-input-background p-3 text-sm"
          />

          <button
            onClick={addComment}
            disabled={!commentDraft.trim()}
            className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
          >
            Adicionar
          </button>

          {commentError && (
            <p className="text-sm text-destructive">
              {commentError}
            </p>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border p-3"
              >
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString(locale)}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditingCommentContent(comment.content);
                      }}
                    >
                      <Edit2 size={14}/>
                    </button>

                    <button
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                {editingCommentId === comment.id ? (
                  <>
                    <textarea
                      value={editingCommentContent}
                      onChange={(e) =>
                        setEditingCommentContent(e.target.value)
                      }
                      className="mt-2 w-full border p-2"
                    />

                    <button
                      onClick={() => updateComment(comment.id)}
                      className="mt-2 bg-primary px-3 py-1 text-sm text-primary-foreground"
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {comment.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}