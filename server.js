// server.js (Updated)
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // Cookie-parser import karein
import connectDB from './api/config/db.js';
import apiRouter from './api/routes/index.js'; // Root router ko import karein

dotenv.config({
    path: './.env'
});

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser()); // Cookie-parser ko use karein

app.use("/api/v1", apiRouter); // API routes ko register karein

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