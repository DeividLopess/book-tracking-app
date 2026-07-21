// frontend/src/services/bookService.ts
//
// Equivalente ao backend/src/controllers/books-controller.ts, mas rodando
// direto no SQLite local do device via @capacitor-community/sqlite.
// Ajuste o import abaixo para o caminho real do seu database.ts.
import { getDb } from "../db/database";
import { z } from "zod";
import type { Book, BookStatus } from "../app/components/common";

// ---------------------------------------------------------------------------
// Tipos e schemas (iguais aos do backend)
// ---------------------------------------------------------------------------

// Usamos o tipo Book já definido em components/common.ts como fonte única
// de verdade — evita duplicar o shape do objeto e ter tipos divergindo.
export type BookRepository = Book;

const bookStatusSchema = z.enum(["not_started", "in_progress", "finished", "abandoned"]);
const favoriteSchema = z.union([z.boolean(), z.literal(0), z.literal(1)]).transform(Boolean);

const createBookSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  author: z.string().trim().min(1),
  genre: z.string().trim().min(1),
  pages: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(0).max(5).nullable().optional(),
  coverColor: z.string().trim().min(1),
  image_url: z.string().url(),
  started_at: z.string().datetime().nullable().optional().or(z.literal("")),
  finished_at: z.string().datetime().nullable().optional().or(z.literal("")),
  favorite: favoriteSchema.optional().default(false),
  status: bookStatusSchema.optional(),
});

const updateBookSchema = createBookSchema.partial();

class AppError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveStatus(
  status: BookStatus | undefined,
  startedAt: string | null,
  finishedAt: string | null,
  currentStatus?: BookStatus
) {
  if (status === undefined && currentStatus) return currentStatus;
  if (status === "abandoned") return "abandoned" as const;
  if (finishedAt) return "finished" as const;
  if (startedAt) return "in_progress" as const;
  return "not_started" as const;
}

async function ensureMetadataValue(table: "genres" | "authors", name: string) {
  const normalized = name.trim();
  if (!normalized) return null;

  const db = getDb();
  const existing = await db.query(
    `SELECT name FROM ${table} WHERE LOWER(name) = ? LIMIT 1`,
    [normalized.toLowerCase()]
  );

  if (existing.values && existing.values.length > 0) {
    return existing.values[0].name as string;
  }

  await db.run(`INSERT INTO ${table} (name) VALUES (?)`, [normalized]);
  return normalized;
}

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export async function listBooks(name?: string): Promise<BookRepository[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM books WHERE name LIKE ? ORDER BY finished_at DESC, name`,
    [`%${name ?? ""}%`]
  );
  const rows = (result.values ?? []) as BookRepository[];
  // SQLite não tem tipo boolean nativo — guarda 0/1. Convertemos aqui pra
  // não vazar "número disfarçado de boolean" pro resto do app.
  return rows.map((row) => ({ ...row, favorite: Boolean(row.favorite) }));
}

export async function createBook(input: unknown) {
  const book = createBookSchema.parse(input);

  const normalizedAuthor = await ensureMetadataValue("authors", book.author);
  const normalizedGenre = await ensureMetadataValue("genres", book.genre);

  const startedAt = book.started_at === "" ? null : book.started_at ?? null;
  const finishedAt = book.finished_at === "" ? null : book.finished_at ?? null;
  const status = resolveStatus(book.status, startedAt, finishedAt);

  const db = getDb();
  await db.run(
    `INSERT INTO books
      (name, description, author, genre, pages, rating, coverColor, image_url, started_at, finished_at, favorite, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.name,
      book.description ?? "",
      normalizedAuthor ?? book.author,
      normalizedGenre ?? book.genre,
      book.pages,
      book.rating ?? null,
      book.coverColor,
      book.image_url,
      startedAt,
      finishedAt,
      book.favorite ? 1 : 0,
      status,
    ]
  );
}

export async function updateBook(id: number, input: unknown) {
  const data = updateBookSchema.parse(input);
  const db = getDb();

  const existing = await db.query(`SELECT * FROM books WHERE id = ? LIMIT 1`, [id]);
  const book = existing.values?.[0] as BookRepository | undefined;
  if (!book) throw new AppError("Book not found", 404);

  const normalizedAuthor = data.author ? await ensureMetadataValue("authors", data.author) : null;
  const normalizedGenre = data.genre ? await ensureMetadataValue("genres", data.genre) : null;

  const startedAt =
    data.started_at === undefined ? book.started_at : data.started_at === "" ? null : data.started_at;
  const finishedAt =
    data.finished_at === undefined ? book.finished_at : data.finished_at === "" ? null : data.finished_at;
  const shouldResolveStatus =
    data.status !== undefined || data.started_at !== undefined || data.finished_at !== undefined;

  const status = resolveStatus(
    data.status,
    startedAt,
    finishedAt,
    shouldResolveStatus ? undefined : book.status
  );

  await db.run(
    `UPDATE books SET
      name = ?, description = ?, author = ?, genre = ?, pages = ?, rating = ?,
      favorite = ?, status = ?, coverColor = ?, image_url = ?, started_at = ?,
      finished_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      data.name ?? book.name,
      data.description ?? book.description,
      normalizedAuthor ?? data.author ?? book.author,
      normalizedGenre ?? data.genre ?? book.genre,
      data.pages ?? book.pages,
      data.rating ?? book.rating,
      (data.favorite ?? book.favorite) ? 1 : 0,
      status,
      data.coverColor ?? book.coverColor,
      data.image_url ?? book.image_url,
      startedAt,
      finishedAt,
      id,
    ]
  );
}

export async function deleteBook(id: number) {
  const db = getDb();
  const existing = await db.query(`SELECT id FROM books WHERE id = ? LIMIT 1`, [id]);
  if (!existing.values || existing.values.length === 0) {
    throw new AppError("Book not found", 404);
  }
  await db.run(`DELETE FROM books WHERE id = ?`, [id]);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function listComments(bookId: number) {
  const db = getDb();
  const book = await db.query(`SELECT id FROM books WHERE id = ? LIMIT 1`, [bookId]);
  if (!book.values || book.values.length === 0) throw new AppError("Book not found", 404);

  const result = await db.query(
    `SELECT id, content, created_at FROM book_comments
     WHERE book_id = ? ORDER BY created_at DESC, id DESC`,
    [bookId]
  );
  return result.values ?? [];
}

export async function createComment(bookId: number, input: unknown) {
  const { content } = z.object({ content: z.string().trim().min(1) }).parse(input);
  const db = getDb();

  const book = await db.query(`SELECT id FROM books WHERE id = ? LIMIT 1`, [bookId]);
  if (!book.values || book.values.length === 0) throw new AppError("Book not found", 404);

  const insertResult = await db.run(
    `INSERT INTO book_comments (book_id, content) VALUES (?, ?)`,
    [bookId, content]
  );
  const newId = insertResult.changes?.lastId;

  const comment = await db.query(`SELECT * FROM book_comments WHERE id = ? LIMIT 1`, [newId]);
  return comment.values?.[0];
}

export async function updateComment(bookId: number, commentId: number, input: unknown) {
  const { content } = z.object({ content: z.string().trim().min(1) }).parse(input);
  const db = getDb();

  const comment = await db.query(
    `SELECT id FROM book_comments WHERE id = ? AND book_id = ? LIMIT 1`,
    [commentId, bookId]
  );
  if (!comment.values || comment.values.length === 0) throw new AppError("Comment not found", 404);

  await db.run(`UPDATE book_comments SET content = ? WHERE id = ?`, [content, commentId]);
  const updated = await db.query(`SELECT * FROM book_comments WHERE id = ? LIMIT 1`, [commentId]);
  return updated.values?.[0];
}

export async function deleteComment(bookId: number, commentId: number) {
  const db = getDb();
  const result = await db.run(
    `DELETE FROM book_comments WHERE id = ? AND book_id = ?`,
    [commentId, bookId]
  );
  if (!result.changes || result.changes.changes === 0) {
    throw new AppError("Comment not found", 404);
  }
}