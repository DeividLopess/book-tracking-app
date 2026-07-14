import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("books").del();

  await knex("books").insert([
    {
      name: "The Master and Margarita",
      description: "Utterly singular. The Satan chapters are electric.",
      author: "Mikhail Bulgakov",
      genre: "Fiction",
      pages: 412,
      rating: 5,
      coverColor: "#7B3D6A",
      image_url:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
      started_at: "2024-01-01T00:00:00.000Z",
      finished_at: "2024-01-14T00:00:00.000Z",
      status: "finished",
      favorite: true,
    },
    {
      name: "Meditations",
      description: "Return to this every winter. Never fails.",
      author: "Marcus Aurelius",
      genre: "Philosophy",
      pages: 254,
      rating: 5,
      coverColor: "#4A5568",
      image_url:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
      started_at: "2024-02-01T00:00:00.000Z",
      finished_at: null,
      status: "in_progress",
      favorite: false,
    },
    {
      name: "The Buried Giant",
      description: "Quiet and devastating. Memory as a political act.",
      author: "Kazuo Ishiguro",
      genre: "Fiction",
      pages: 317,
      rating: 4,
      coverColor: "#2C4A6E",
      image_url:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80",
      started_at: null,
      finished_at: null,
      status: "not_started",
      favorite: false,
    },
  ]);
}
