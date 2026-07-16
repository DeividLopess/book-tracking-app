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
      setEditingCommentContent("");

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
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/60
        p-3
        sm:p-4
        animate-in
        fade-in
        duration-300
      "
      onClick={onClose}
    >
      <div
        className="
          max-h-[95vh]
          w-full
          max-w-3xl
          overflow-y-auto
          rounded-xl
          bg-card
          shadow-2xl
          animate-in
          fade-in
          zoom-in-95
          duration-300
          sm:max-h-[90vh]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-3
            border-b
            p-4
            sm:p-5
          "
        >
          <h2
            className="
              min-w-0
              flex-1
              text-xl
              font-semibold
              leading-tight
              sm:text-2xl
            "
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {book.name}
          </h2>

          <button
            onClick={onClose}
            className="
              flex-shrink-0
              rounded-full
              p-2
              hover:bg-muted
              active:bg-muted
            "
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="
            grid
            gap-5
            p-4
            sm:p-6
            md:grid-cols-[220px_1fr]
          "
        >
          <img
            src={book.image_url}
            alt={book.name}
            className="
              mx-auto
              aspect-[2/3]
              w-40
              rounded-lg
              object-cover
              shadow-lg
              sm:w-full
            "
          />

          <div className="space-y-4">
            <p className="text-lg">{book.author}</p>

            <div className="flex items-center gap-3">
              <StarRating value={ratingValue(book)} />

          {!!book.favorite && (
            <Heart
              size={14}
              className="fill-destructive text-destructive"
              aria-label={t.bookForm.favorite}
            />
          )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Status</p>

                <p className="truncate">{t.library.status[book.status]}</p>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Gênero</p>

                <p className="truncate">{book.genre}</p>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Páginas</p>

                <p>{book.pages}</p>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Data</p>

                <p className="truncate">{formatted}</p>
              </div>
            </div>

            {book.description && (
              <div>
                <h3 className="mb-2 font-semibold">Descrição</h3>

                <p
                  className="
                    whitespace-pre-wrap
                    text-sm
                    leading-relaxed
                    text-muted-foreground
                  "
                >
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COMENTÁRIOS */}
        <div
          className="
            space-y-4
            border-t
            p-4
            sm:p-6
          "
        >
          <h3 className="font-semibold">{t.tabs.comments}</h3>

          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            rows={3}
            placeholder="Adicionar comentário..."
            className="
              w-full
              resize-none
              rounded-md
              border
              bg-input-background
              p-3
              text-sm
              outline-none
              focus:ring-1
              focus:ring-primary
            "
          />

          <button
            onClick={addComment}
            disabled={!commentDraft.trim()}
            className="
              w-full
              rounded-md
              bg-primary
              px-4
              py-3
              text-sm
              text-primary-foreground
              transition-opacity
              disabled:opacity-40
              sm:w-auto
            "
          >
            Adicionar
          </button>

          {commentError && (
            <p className="text-sm text-destructive">{commentError}</p>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="
                  rounded-md
                  border
                  p-3
                  sm:p-4
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    {new Date(comment.created_at).toLocaleString(locale)}
                  </span>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditingCommentContent(comment.content);
                      }}
                      className="
                        rounded-md
                        p-1.5
                        transition-colors
                        hover:bg-muted
                      "
                      aria-label="Editar comentário"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="
                        rounded-md
                        p-1.5
                        transition-colors
                        hover:bg-muted
                      "
                      aria-label="Excluir comentário"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {editingCommentId === comment.id ? (
                  <>
                    <textarea
                      value={editingCommentContent}
                      onChange={(e) => setEditingCommentContent(e.target.value)}
                      className="
                        mt-3
                        min-h-24
                        w-full
                        resize-none
                        rounded-md
                        border
                        p-2
                        text-sm
                      "
                    />

                    <button
                      onClick={() => updateComment(comment.id)}
                      className="
                        mt-2
                        w-full
                        rounded-md
                        bg-primary
                        px-3
                        py-2
                        text-sm
                        text-primary-foreground
                        sm:w-auto
                      "
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <p
                    className="
                      mt-3
                      whitespace-pre-wrap
                      break-words
                      text-sm
                    "
                  >
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
