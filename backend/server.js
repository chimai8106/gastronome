import express from "express"
import recipes from "./routes/recipesRoutes.js"
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import path from "path";

const app = express()
const __dirname = path.resolve()

//middleware
app.use(express.json());
app.use(rateLimiter)
if (process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
  // This catches all routes and serves index.html
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
} else {
  app.use(cors({
    origin : "http://localhost:5173"
  }));
}

app.use("/api/recipes", recipes);


const PORT = process.env.PORT || 5001;
connectDB().then(()=>{
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

)
