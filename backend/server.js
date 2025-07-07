import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error(
    "MONGO_URI not set in .env. Please add it and restart the server."
  );
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET not set in .env. Please add it and restart the server."
  );
  process.exit(1);
}

const app = express();
// Allow requests from frontend (Vite dev server)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.log("MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;
// Listen on all interfaces for dev/prod compatibility
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("All required environment variables loaded.");
});
