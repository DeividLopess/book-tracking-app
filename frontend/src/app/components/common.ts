export interface Book {
  id: number;
  name: string;
  description: string;
  author: string;
  genre: string;
  pages: number;
  rating: number | null;
  coverColor: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  status: BookStatus;
  favorite: boolean;
}

export interface BookComment {
  id: number;
  content: string;
  created_at: string;
}

export type BookForm = {
  id?: number;
  name: string;
  description: string;
  author: string;
  genre: string;
  pages: number;
  rating: number | null;
  coverColor: string;
  image_url: string;
  started_at: string;
  finished_at: string;
  status: BookStatus;
  favorite: boolean;
};

export type Tab = "library" | "timeline" | "calendar" | "stats" | "metadata" | "ratings";
export type BookStatus = "not_started" | "in_progress" | "finished" | "abandoned";
export type ReadingStatus = "all" | BookStatus;
export type ModalTab = "book" | "comments" | "genres" | "authors";
export type MetadataItem = { id: number; name: string };
export type Language = "pt" | "en";

export const API_BASE_URL =
  (import.meta.env as Record<string, string | undefined>).VITE_API_URL ??
  "http://localhost:3333";

export const COVER_COLORS = [
  "#2C4A6E",
  "#4A7C59",
  "#7B3D6A",
  "#B8731A",
  "#8B4513",
  "#2C6E8A",
  "#6B4226",
  "#3D5A3E",
  "#7C3A3A",
  "#4A5568",
];

export const EMPTY_BOOK: BookForm = {
  name: "",
  description: "",
  author: "",
  genre: "Fiction",
  pages: 1,
  started_at: "",
  finished_at: "",
  status: "not_started",
  favorite: false,
  rating: 0,
  coverColor: COVER_COLORS[0],
  image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
};

export const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");
export const bookDate = (book: Book) => toDateInput(book.finished_at ?? book.started_at ?? book.created_at);
export const ratingValue = (book: Book) => book.rating ?? 0;
export const readingStatus = (book: Book): ReadingStatus => {
  return book.status;
};
export const sameDate = (a: Date, b: Date) => a.toDateString() === b.toDateString();
export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
export const parseBookDate = (value?: string | null) => {
  const date = toDateInput(value);
  return date ? new Date(`${date}T00:00:00`) : null;
};

export function toPayload(form: BookForm) {
  return {
    name: form.name,
    description: form.description,
    author: form.author,
    genre: form.genre,
    pages: Number(form.pages),
    rating: form.rating,
    coverColor: form.coverColor,
    image_url: form.image_url,
    started_at: form.started_at ? new Date(`${form.started_at}T00:00:00.000Z`).toISOString() : null,
    finished_at: form.finished_at ? new Date(`${form.finished_at}T00:00:00.000Z`).toISOString() : null,
    status: form.status,
    favorite: form.favorite,
  };
}

export function toForm(book: Partial<Book>): BookForm {
  return {
    ...EMPTY_BOOK,
    ...book,
    started_at: toDateInput(book.started_at) || EMPTY_BOOK.started_at,
    finished_at: toDateInput(book.finished_at) || EMPTY_BOOK.finished_at,
    status: book.status ?? (book.finished_at ? "finished" : book.started_at ? "in_progress" : "not_started"),
    favorite: Boolean(book.favorite),
  };
}

export async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      issues?: Record<string, { _errors?: string[] }>;
    } | null;
    const issue = data?.issues
      ? Object.entries(data.issues).find(([key]) => key !== "_errors")?.[1]?._errors?.[0]
      : null;

    throw new Error(issue ?? data?.message ?? `API error ${response.status}`);
  }

  return response;
}
