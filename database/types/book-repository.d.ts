type BookRepository = {
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
  status: "not_started" | "in_progress" | "finished" | "abandoned";
  favorite: boolean;
}
