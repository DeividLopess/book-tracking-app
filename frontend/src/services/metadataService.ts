// frontend/src/services/metadataService.ts
//
// Equivalente ao backend/src/controllers/metadata-controller.ts, rodando
// direto no SQLite local do device via @capacitor-community/sqlite.
import { getDb } from "../db/database";
import { z } from "zod";

export interface MetadataItem {
  id: number;
  name: string;
}

const nameSchema = z.object({ name: z.string().trim().min(1) });

class AppError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Helper genérico — genres e authors têm exatamente a mesma estrutura,
// então uma função parametrizada por tabela evita duplicar tudo 2x.
// ---------------------------------------------------------------------------

async function list(table: "genres" | "authors"): Promise<MetadataItem[]> {
  const db = getDb();
  const result = await db.query(`SELECT id, name FROM ${table} ORDER BY name`);
  return (result.values ?? []) as MetadataItem[];
}

async function create(table: "genres" | "authors", input: unknown): Promise<MetadataItem> {
  const { name } = nameSchema.parse(input);
  const db = getDb();

  const insertResult = await db.run(`INSERT INTO ${table} (name) VALUES (?)`, [name]);
  const newId = insertResult.changes?.lastId;

  const created = await db.query(`SELECT id, name FROM ${table} WHERE id = ? LIMIT 1`, [newId]);
  return created.values?.[0] as MetadataItem;
}

async function update(table: "genres" | "authors", id: number, input: unknown): Promise<MetadataItem> {
  const { name } = nameSchema.parse(input);
  const db = getDb();

  await db.run(`UPDATE ${table} SET name = ? WHERE id = ?`, [name, id]);

  const updated = await db.query(`SELECT id, name FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  if (!updated.values || updated.values.length === 0) {
    throw new AppError(`${table === "genres" ? "Genre" : "Author"} not found`, 404);
  }
  return updated.values[0] as MetadataItem;
}

async function remove(table: "genres" | "authors", id: number): Promise<void> {
  const db = getDb();
  await db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

// ---------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------

export const listGenres = () => list("genres");
export const createGenre = (input: unknown) => create("genres", input);
export const updateGenre = (id: number, input: unknown) => update("genres", id, input);
export const deleteGenre = (id: number) => remove("genres", id);

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

export const listAuthors = () => list("authors");
export const createAuthor = (input: unknown) => create("authors", input);
export const updateAuthor = (id: number, input: unknown) => update("authors", id, input);
export const deleteAuthor = (id: number) => remove("authors", id);