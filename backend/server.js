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

// Recipe parser endpoint with improved retry logic
app.post('/recipe-parser', async function(req, res) {
  if (!req.body.link) {
    return res.status(400).json({ error: 'No link provided' });
  }

  const pythonUrl = process.env.NODE_ENV !== "development" 
    ? process.env.PYTHON_URL 
    : 'http://127.0.0.1:5000/recipe-parser';

  const healthUrl = pythonUrl.replace('/recipe-parser', '/health');
  const MAX_RETRIES = 1;
  const RETRY_DELAYS = [90000]; 

  try {
    let lastError;
    let serviceReady = false;
    
    // Check health first and wait for service to wake up
    for (let healthCheck = 0; healthCheck < 5; healthCheck++) {
      try {
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        if (healthResponse.ok) {
          serviceReady = true;
          break;
        } else {
        }
      } catch (error) {
        if (healthCheck < 4) {
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }
    
    // Now attempt to parse the recipe with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        
        const response = await fetch(pythonUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link: req.body.link }),
          signal: AbortSignal.timeout(45000)
        });

        // Success!
        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }

        // If service is sleeping/unavailable and we have retries left
        if ((response.status === 502 || response.status === 503) && attempt < MAX_RETRIES) {
          const waitTime = RETRY_DELAYS[attempt];
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Other HTTP errors
        if (!response.ok) {
          lastError = new Error(`HTTP error! status: ${response.status}`);
          
          // Only retry on server errors, not client errors
          if (response.status >= 500 && attempt < MAX_RETRIES) {
            const waitTime = RETRY_DELAYS[attempt];
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw lastError;
        }
        
      } catch (fetchError) {
        lastError = fetchError;
        console.error(`Attempt ${attempt + 1} failed:`, fetchError.message);
        
        // Retry on timeout or connection errors
        if (attempt < MAX_RETRIES && 
            (fetchError.name === 'AbortError' || 
             fetchError.message.includes('fetch') ||
             fetchError.message.includes('network'))) {
          const waitTime = RETRY_DELAYS[attempt];
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw fetchError;
      }
    }

    // All retries exhausted
    throw lastError || new Error('All retry attempts failed');

  } catch (error) {
    console.error('Parser service error after all retries:', error.message);
    
    // Determine appropriate error message
    let userMessage = 'Failed to parse recipe';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      userMessage = 'Parser service request timed out';
      statusCode = 504;
    } else if (error.message.includes('502') || error.message.includes('503')) {
      userMessage = 'Parser service is unavailable. It may be starting up - please try again in 1-2 minutes.';
      statusCode = 503;
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