import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './api/config/db.js';
import apiRouter from './api/routes/index.js';

dotenv.config({
    path: './.env'
});

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  "https://uttam-vastu-frontend.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Origin Not Allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    allowedHeaders: "Content-Type, Authorization"
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1", apiRouter);

const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is ready and running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.log("MONGO db connection failed !!! ", error);
        process.exit(1);
    }
};

startServer();
export default app;