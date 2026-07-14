import { Router } from "express";
import { BooksController } from "../controllers/books-controller";
import { MetadataController } from "../controllers/metadata-controller";

const booksRoutes = Router();
const booksController = new BooksController();
const metadataController = new MetadataController();

booksRoutes.get("/", booksController.index);
booksRoutes.post("/", booksController.create);
booksRoutes.put("/update/:id", booksController.update);
booksRoutes.delete("/delete/:id", booksController.delete);
booksRoutes.get("/:id/comments", booksController.listComments);
booksRoutes.post("/:id/comments", booksController.createComment);
booksRoutes.put("/:id/comments/:commentId", booksController.updateComment);
booksRoutes.delete("/:id/comments/:commentId", booksController.deleteComment);
booksRoutes.get("/genres", metadataController.listGenres);
booksRoutes.post("/genres", metadataController.createGenre);
booksRoutes.put("/genres/:id", metadataController.updateGenre);
booksRoutes.delete("/genres/:id", metadataController.deleteGenre);
booksRoutes.get("/authors", metadataController.listAuthors);
booksRoutes.post("/authors", metadataController.createAuthor);
booksRoutes.put("/authors/:id", metadataController.updateAuthor);
booksRoutes.delete("/authors/:id", metadataController.deleteAuthor);

export { booksRoutes };
