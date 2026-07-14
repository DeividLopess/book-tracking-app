import express from 'express';
import { routes } from './routes';
import { errorHandling } from './middlewares/error-handling';

const PORT = 3333;
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(routes);
app.use(errorHandling);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
