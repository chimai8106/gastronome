import express from "express"
import recipes from "./routes/recipesRoutes.js"
import recipeCollections from "./routes/recipeCollectionsRoutes.js"
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import path from "path";
import multer, { memoryStorage } from "multer";

const storage = memoryStorage()
const upload = multer({
  storage: multer.memoryStorage(), 
});

const app = express()
const __dirname = path.resolve()

// Middleware 
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
  const pythonUrl = process.env.PYTHON_HEALTH;

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
  console.log('=== RECIPE PARSER REQUEST ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PYTHON_URL:', process.env.PYTHON_URL);
  console.log('PYTHON_HEALTH:', process.env.PYTHON_HEALTH);
  
  if (!req.body.link) {
    return res.status(400).json({ error: 'No link provided' });
  }
  
  const pythonUrl = process.env.PYTHON_URL;
  const healthUrl = process.env.PYTHON_HEALTH;

  try {
    let serviceReady = false;
        
    // Check health with multiple attempts - allow time for cold start
    for (let healthCheck = 0; healthCheck < 10; healthCheck++) {
      try {
        console.log(`[${new Date().toISOString()}] Health check ${healthCheck + 1}/10 to ${healthUrl}`);
        
        // First 3 checks get 60s timeout (for cold start), rest get 10s
        const timeout = healthCheck < 3 ? 60000 : 10000;
        
        const healthResponse = await fetch(healthUrl, {
          signal: AbortSignal.timeout(timeout)
        });
        
        console.log(`Health check ${healthCheck + 1} - Status: ${healthResponse.status}`);
        
        if (healthResponse.ok) {
          serviceReady = true;
          console.log('Service is ready! Waiting 3 seconds for full initialization...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
        
        // If not ready (including 429 rate limit), wait before next attempt
        if (healthCheck < 9) {
          console.log('Service not ready, waiting 12 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 12000));
        }
        
      } catch (error) {
        console.log(`Health check ${healthCheck + 1} failed: ${error.name} - ${error.message}`);
        if (healthCheck < 9) {
          console.log('Waiting 12 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 12000));
        }
      }
    }
    
    if (!serviceReady) {
      console.log('Service failed to become ready after all health checks');
      return res.status(503).json({ 
        error: 'Parser service failed to wake up. Please try again.',
        details: 'The service may be experiencing cold start issues or is unavailable.'
      });
    }
    
    // Service is ready, make the actual parse request
    console.log(`[${new Date().toISOString()}] Making parse request to ${pythonUrl}`);
    console.log('Request payload:', JSON.stringify({ link: req.body.link }));
    
    const response = await fetch(pythonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: req.body.link }),
      signal: AbortSignal.timeout(60000) // 60 second timeout for actual request
    });

    console.log(`Parse request response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Parse successful, returning data');
    return res.json(data);

  } catch (error) {
    console.error('Parser service error:', error.name, error.message);
    
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