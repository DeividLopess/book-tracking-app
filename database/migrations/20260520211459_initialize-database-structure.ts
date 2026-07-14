import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("books", (table) => {
    table.increments("id").primary();
    table.text("name").notNullable();
    table.text("description").notNullable();
    table.text("comments").nullable();
    table.text("author").notNullable();
    table.text("genre").notNullable();
    table.integer("pages").notNullable();
    table.integer("rating").nullable();
    table.text("coverColor").notNullable();
    table.text("image_url").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("started_at").nullable();
    table.timestamp("finished_at").nullable();
    table.string("status").notNullable().defaultTo("not_started");
    table.boolean("favorite").notNullable().defaultTo(false);
  });

  await knex.schema.createTable("genres", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("authors", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("book_comments", (table) => {
    table.increments("id").primary();
    table.integer("book_id").notNullable().references("id").inTable("books").onDelete("CASCADE");
    table.text("content").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.index(["book_id", "created_at"]);
  });

  await knex("genres").insert([
    { name: "Fiction" },
    { name: "Non-Fiction" },
    { name: "Biography" },
    { name: "History" },
    { name: "Science" },
    { name: "Philosophy" },
    { name: "Poetry" },
    { name: "Mystery" },
    { name: "Fantasy" },
    { name: "Self-Help" },
  ]);

  await knex("authors").insert([
    { name: "Mikhail Bulgakov" },
    { name: "Marcus Aurelius" },
    { name: "Kazuo Ishiguro" },
    { name: "Haruki Murakami" },
    { name: "James Clear" },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("book_comments");
  await knex.schema.dropTableIfExists("authors");
  await knex.schema.dropTableIfExists("genres");
  await knex.schema.dropTableIfExists("books");
}
