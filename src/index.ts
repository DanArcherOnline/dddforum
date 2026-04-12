import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { userRoutes } from './routes/userRoutes';

const app = express();
app.use(express.json());
app.use(cors());

app.use(userRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
