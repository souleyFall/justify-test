import express, { Router } from "express";
import cors from "cors";
import { registerRoutes } from "./src/routes/registerRoutes";
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.text({ type: "text/plain", limit: '5mb' }));

const apiRouter = Router();

registerRoutes(apiRouter);
app.use(apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;