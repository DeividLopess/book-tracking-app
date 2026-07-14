import { NextFunction, Request, Response } from "express";
import { knex } from "@database/knex";
import { z } from "zod";

class MetadataController {
  async listGenres(req: Request, res: Response, next: NextFunction) {
    try {
      const genres = await knex("genres").select("id", "name").orderBy("name");
      return res.json({ genres });
    } catch (error) {
      next(error);
    }
  }

  async listAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const authors = await knex("authors").select("id", "name").orderBy("name");
      return res.json({ authors });
    } catch (error) {
      next(error);
    }
  }

  async createGenre(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().trim().min(1) });
      const { name } = schema.parse(req.body);

      const [genre] = await knex("genres")
        .insert({ name })
        .returning(["id", "name"]);

      return res.status(201).json({ genre });
    } catch (error) {
      next(error);
    }
  }

  async updateGenre(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().trim().min(1) });
      const { name } = schema.parse(req.body);
      const { id } = req.params;

      const [genre] = await knex("genres")
        .where({ id: Number(id) })
        .update({ name })
        .returning(["id", "name"]);

      return res.json({ genre });
    } catch (error) {
      next(error);
    }
  }

  async deleteGenre(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await knex("genres").where({ id: Number(id) }).delete();
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().trim().min(1) });
      const { name } = schema.parse(req.body);

      const [author] = await knex("authors")
        .insert({ name })
        .returning(["id", "name"]);

      return res.status(201).json({ author });
    } catch (error) {
      next(error);
    }
  }

  async updateAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().trim().min(1) });
      const { name } = schema.parse(req.body);
      const { id } = req.params;

      const [author] = await knex("authors")
        .where({ id: Number(id) })
        .update({ name })
        .returning(["id", "name"]);

      return res.json({ author });
    } catch (error) {
      next(error);
    }
  }

  async deleteAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await knex("authors").where({ id: Number(id) }).delete();
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export { MetadataController };
