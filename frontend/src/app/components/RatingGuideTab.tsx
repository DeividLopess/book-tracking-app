import { Heart, Trash2 } from "lucide-react";
import { getTranslation } from "../i18n";
import { ratingValue, type Book, type Language } from "./common";
import { StarRating } from "./StarRating";

interface Column {
  title: string;
  books: Book[];
  icon?: string;
  color?: string;
}

function SmallBookCard({ book, onEdit, onDelete, language }: { book: Book; onEdit: () => void; onDelete: () => void; language: Language }) {
  const t = getTranslation(language);

  return (
    <div className="group flex flex-col overflow-hidden border border-border bg-card hover:border-accent/40 transition-colors">
      <img src={book.image_url} alt={book.name} className="h-24 w-full object-cover bg-muted" />
      <div className="p-2 flex-1 flex flex-col">
        <h4 className="text-xs font-semibold text-foreground line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          {book.name}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
          <div className="flex gap-0.5">
            {book.rating !== null && <StarRating value={ratingValue(book)} />}
          </div>
          {book.favorite ? <Heart size={12} className="fill-destructive text-destructive flex-shrink-0" /> : null}
        </div>
      </div>
      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity bg-secondary border-t border-border">
        <button onClick={onEdit} className="flex-1 p-1 text-xs text-muted-foreground hover:text-accent transition-colors">
          Editar
        </button>
        <button onClick={onDelete} className="flex-1 p-1 text-xs text-muted-foreground hover:text-destructive transition-colors border-l border-border">
          Excluir
        </button>
      </div>
    </div>
  );
}

export function RatingGuideTab({ books, onEdit, onDelete, language }: { books: Book[]; onEdit: (b: Book) => void; onDelete: (id: number) => void; language: Language }) {
  const t = getTranslation(language);

  // Separate books into categories
  const favorites = books.filter((b) => b.favorite && b.status !== "abandoned");
  const abandoned = books.filter((b) => b.status === "abandoned");
  const noRating = books.filter((b) => b.rating === null && b.status !== "abandoned" && !b.favorite);
  const rating5 = books.filter((b) => b.rating === 5 && b.status !== "abandoned" && !b.favorite);
  const rating4 = books.filter((b) => b.rating === 4 && b.status !== "abandoned" && !b.favorite);
  const rating3 = books.filter((b) => b.rating === 3 && b.status !== "abandoned" && !b.favorite);
  const rating2 = books.filter((b) => b.rating === 2 && b.status !== "abandoned" && !b.favorite);
  const rating1 = books.filter((b) => b.rating === 1 && b.status !== "abandoned" && !b.favorite);

  const columns: Column[] = [
    { title: `❤️ ${t.library.all} Favoritos`, books: favorites, color: "border-destructive" },
    { title: "⭐⭐⭐⭐⭐ 5 Estrelas", books: rating5, color: "border-yellow-500" },
    { title: "⭐⭐⭐⭐ 4 Estrelas", books: rating4, color: "border-yellow-500" },
    { title: "⭐⭐⭐ 3 Estrelas", books: rating3, color: "border-yellow-500" },
    { title: "⭐⭐ 2 Estrelas", books: rating2, color: "border-yellow-500" },
    { title: "⭐ 1 Estrela", books: rating1, color: "border-yellow-500" },
    { title: "⭕ Sem Avaliação", books: noRating, color: "border-muted-foreground" },
    { title: "🚫 Abandonados", books: abandoned, color: "border-destructive" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border p-4">
        <h2 className="text-lg text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
          Guia de Avaliações
        </h2>
        <p className="text-sm text-muted-foreground">
          Seus livros organizados por avaliação. Total de livros: <span className="font-semibold text-foreground">{books.length}</span>
        </p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: "min-content" }}>
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col flex-shrink-0 w-56 bg-card border border-border">
              <div className="sticky top-0 bg-secondary border-b border-border p-3 z-10">
                <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {column.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{column.books.length} livro{column.books.length !== 1 ? "s" : ""}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {column.books.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center">
                    <p className="text-xs text-muted-foreground">Nenhum livro aqui</p>
                  </div>
                ) : (
                  column.books.map((book) => (
                    <SmallBookCard key={book.id} book={book} onEdit={() => onEdit(book)} onDelete={() => onDelete(book.id)} language={language} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
