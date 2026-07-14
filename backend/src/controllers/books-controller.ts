import { NextFunction, Request, Response } from "express";
import { knex } from "@database/knex";
import { AppError } from "../utils/AppError";
import { z } from "zod";

async function ensureMetadataValue(table: "genres" | "authors", name: string) {
  const normalized = name.trim();
  if (!normalized) return null;

  const existing = await knex(table)
    .whereRaw("LOWER(name) = ?", [normalized.toLowerCase()])
    .first();

  if (existing) {
    return existing.name as string;
  }

  await knex(table).insert({ name: normalized });
  return normalized;
}

const bookStatusSchema = z.enum(["not_started", "in_progress", "finished", "abandoned"]);
type BookStatus = z.infer<typeof bookStatusSchema>;
const favoriteSchema = z.union([z.boolean(), z.literal(0), z.literal(1)]).transform(Boolean);

function resolveStatus(status: BookStatus | undefined, startedAt: string | null, finishedAt: string | null, currentStatus?: BookStatus) {
  if (status === undefined && currentStatus) return currentStatus;
  if (status === "abandoned") return "abandoned" as const;
  if (finishedAt) return "finished" as const;
  if (startedAt) return "in_progress" as const;
  return "not_started" as const;
}

class BooksController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.query;
      const books = await knex<BookRepository>("books")
        .select()
        .whereLike("name", `%${name ?? ""}%`)
        .orderBy("finished_at", "desc")
        .orderBy("name");

      return res.json({ books });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const bodySchema = z.object({
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

      const book = bodySchema.parse(req.body);
      const normalizedAuthor = await ensureMetadataValue("authors", book.author);
      const normalizedGenre = await ensureMetadataValue("genres", book.genre);

      const startedAt = book.started_at === "" ? null : book.started_at ?? null;
      const finishedAt = book.finished_at === "" ? null : book.finished_at ?? null;
      await knex<BookRepository>("books").insert({
        ...book,
        author: normalizedAuthor ?? book.author,
        genre: normalizedGenre ?? book.genre,
        rating: book.rating ?? null,
        started_at: startedAt,
        finished_at: finishedAt,
        status: resolveStatus(book.status, startedAt, finishedAt),
      });

      return res.status(201).json({ message: "Book created successfully" });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const bodySchema = z.object({
        name: z.string().trim().min(1).optional(),
        description: z.string().trim().optional(),
        author: z.string().trim().min(1).optional(),
        genre: z.string().trim().min(1).optional(),
        pages: z.coerce.number().int().positive().optional(),
        rating: z.coerce.number().int().min(0).max(5).nullable().optional(),
        coverColor: z.string().trim().min(1).optional(),
        image_url: z.string().url().optional(),
        started_at: z.string().datetime().nullable().optional().or(z.literal("")),
        finished_at: z.string().datetime().nullable().optional().or(z.literal("")),
        favorite: favoriteSchema.optional(),
        status: bookStatusSchema.optional(),
      });

      const data = bodySchema.parse(req.body);

      const book = await knex<BookRepository>("books")
        .where({ id: Number(id) })
        .first();

      if (!book) {
        throw new AppError("Book not found", 404);
      }

      const normalizedAuthor = data.author
        ? await ensureMetadataValue("authors", data.author)
        : null;
      const normalizedGenre = data.genre
        ? await ensureMetadataValue("genres", data.genre)
        : null;

      const startedAt = data.started_at === undefined ? book.started_at : data.started_at === "" ? null : data.started_at;
      const finishedAt = data.finished_at === undefined ? book.finished_at : data.finished_at === "" ? null : data.finished_at;
      const shouldResolveStatus = data.status !== undefined || data.started_at !== undefined || data.finished_at !== undefined;

      await knex<BookRepository>("books")
        .where({ id: Number(id) })
        .update({
          name: data.name ?? book.name,
          description: data.description ?? book.description,
          author: normalizedAuthor ?? data.author ?? book.author,
          genre: normalizedGenre ?? data.genre ?? book.genre,
          pages: data.pages ?? book.pages,
          rating: data.rating ?? book.rating,
          favorite: data.favorite ?? book.favorite,
          status: resolveStatus(data.status, startedAt, finishedAt, shouldResolveStatus ? undefined : book.status),
          coverColor: data.coverColor ?? book.coverColor,
          image_url: data.image_url ?? book.image_url,
          started_at: startedAt,
          finished_at: finishedAt,
          updated_at: knex.fn.now(),
        });
      return res.status(200).json({ message: "Book updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const book = await knex<BookRepository>("books")
        .where({ id: Number(id) })
        .first();

      if (!book) {
        throw new AppError("Book not found", 404);
      }

      await knex<BookRepository>("books")
        .where({ id: Number(id) })
        .delete();

      return res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listComments(req: Request, res: Response, next: NextFunction) {
    try {
      const bookId = Number(req.params.id);
      const book = await knex<BookRepository>("books").where({ id: bookId }).first();
      if (!book) throw new AppError("Book not found", 404);

      const comments = await knex("book_comments")
        .select("id", "content", "created_at")
        .where({ book_id: bookId })
        .orderBy("created_at", "desc")
        .orderBy("id", "desc");

      return res.json({ comments });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const bookId = Number(req.params.id);
      const { content } = z.object({ content: z.string().trim().min(1) }).parse(req.body);
      const book = await knex<BookRepository>("books").where({ id: bookId }).first();
      if (!book) throw new AppError("Book not found", 404);

      const [id] = await knex("book_comments").insert({ book_id: bookId, content });
      const comment = await knex("book_comments").where({ id }).first();
      return res.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const bookId = Number(req.params.id);
      const commentId = Number(req.params.commentId);
      const { content } = z.object({ content: z.string().trim().min(1) }).parse(req.body);
      const comment = await knex("book_comments").where({ id: commentId, book_id: bookId }).first();
      if (!comment) throw new AppError("Comment not found", 404);

      await knex("book_comments").where({ id: commentId }).update({ content });
      const updatedComment = await knex("book_comments").where({ id: commentId }).first();
      return res.json({ comment: updatedComment });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const bookId = Number(req.params.id);
      const commentId = Number(req.params.commentId);
      const deleted = await knex("book_comments").where({ id: commentId, book_id: bookId }).delete();
      if (!deleted) throw new AppError("Comment not found", 404);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export { BooksController };
