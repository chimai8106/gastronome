import express from "express"
import recipes from "./routes/recipesRoutes.js"
import recipeCollections from "./routes/recipeCollectionsRoutes.js"
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import path from "path";
import multer, {memoryStorage} from "multer";

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

app.use("/api/recipes", recipes);
app.use("/api/recipeRecipeCollections", recipeCollections);

// Recipe parser route
// Health check endpoint for Python service
app.get('/parser-health', async function(req, res) {
  const pythonUrl = process.env.NODE_ENV !== "development" 
    ? process.env.PYTHON_URL.replace('/recipe-parser', '/health')
    : 'http://127.0.0.1:5000/health';

  try {
    const response = await fetch(pythonUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      res.json({ status: 'healthy', message: 'Parser service is ready' });
    } else {
      res.status(503).json({ status: 'unhealthy', message: 'Parser service is not responding' });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', message: 'Parser service is sleeping or unavailable' });
  }
});

// Recipe parser endpoint with retry logic
app.post('/recipe-parser', async function(req, res) {
  if (!req.body.link) {
    return res.status(400).json({ error: 'No link provided' });
  }

  const pythonUrl = process.env.NODE_ENV !== "development" 
    ? process.env.PYTHON_URL 
    : 'http://127.0.0.1:5000/recipe-parser';

  try {
    //First attempt
    let response = await fetch(pythonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: req.body.link }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    // If 502 or 503, the service is likely sleeping
    // wait and retry
    if (response.status === 502 || response.status === 503) {
      console.log('Service is sleeping (status:', response.status, '), waiting 60s and retrying...');
  
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
      
      console.log('Retrying request...');
      response = await fetch(pythonUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: req.body.link }),
        signal: AbortSignal.timeout(30000)
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully parsed recipe');
    res.json(data);
  } catch (error) {
    console.error('Parser service error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to connect to parser service',
      details: error.message 
    });
  }
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