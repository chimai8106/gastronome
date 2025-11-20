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

// Health check endpoint for Python service
app.get('/parser-health', async function(req, res) {
  const pythonUrl = process.env.NODE_ENV !== "development" 
    ? process.env.PYTHON_URL.replace('/recipe-parser', '/health')
    : 'http://127.0.0.1:5000/health';

  try {
    const response = await fetch(pythonUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
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

  const healthUrl = process.env.PYTHON_HEALTH;

  try {
    let serviceReady = false;
        
    // Check health with multiple short attempts (total ~2 min)
    for (let healthCheck = 0; healthCheck < 10; healthCheck++) {
      try {        
        const healthResponse = await fetch(healthUrl);
        
        if (healthResponse.ok) {
          serviceReady = true;
          break;
        }
      } catch (error) {        
        if (healthCheck < 9) {
          // Wait 12 seconds between attempts
          await new Promise(resolve => setTimeout(resolve, 12000));
        }
      }
    }
    
    if (!serviceReady) {
      return res.status(503).json({ 
        error: 'Parser service failed to wake up after 2 minutes. Please try again.',
        details: 'The service may need manual intervention or is experiencing issues.'
      });
    }
    
    // Service is ready, now make the actual parse request    
    const response = await fetch(pythonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: req.body.link }),
      signal: AbortSignal.timeout(30000) // 30 second timeout for actual request
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    console.error('Parser service error:', error.message);
    
    let userMessage = 'Failed to parse recipe';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      userMessage = 'Parser service request timed out';
      statusCode = 504;
    }
    
    return res.status(statusCode).json({ 
      error: userMessage,
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