import express from "express"
import recipes from "./routes/recipesRoutes.js"
import recipeCollections from "./routes/recipeCollectionsRoutes.js"
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import path from "path";
import multer, {memoryStorage} from "multer";
import { uploadToS3 } from "./db/s3.mjs";
import request from "request";


const storage = memoryStorage()
const upload = multer({
  storage: multer.memoryStorage(), 
});

const app = express()
const __dirname = path.resolve()

//middleware 
app.use(express.json());
app.use(rateLimiter);

// CORS for development
if (process.env.NODE_ENV !== "production") {
  app.use(cors({
    origin: "http://localhost:5173"
  }));
}

// API routes BEFORE static files
app.use("/api/recipes", recipes);
app.use("/api/recipeRecipeCollections", recipeCollections);

// Recipe parser route
app.post('/recipe-parser', function(req, res) {
  if (!req.body.link) {
    return res.status(400).json({ error: 'No link provided' });
  }
  request.post(
    {
      url: 'http://127.0.0.1:5000/recipe-parser',
      json: { "link": req.body.link }
    },
    function (error, response, body) {
      if (error) {
        return res.status(500).json({ error: 'Failed to connect to parser service' });
      }
      res.send(body);
    }
  );
});

// Static files and catch-all last (only in production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, '../frontend/dist'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  
  // Catch-all route 
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 5001;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});