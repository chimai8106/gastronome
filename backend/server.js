import express from "express"
import recipes from "./routes/recipesRoutes.js"
import recipeCollections from "./routes/recipeCollectionsRoutes.js"
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import path from "path";
import multer, { memoryStorage } from "multer";
import errorHandlerModule from "./middleware/errorHandler.js";

// Constants
const PARSER_HEALTH_CHECK_ATTEMPTS = 10;
const COLD_START_TIMEOUT_MS = 60000; // 60 seconds
const NORMAL_TIMEOUT_MS = 10000; // 10 seconds
const HEALTH_CHECK_WAIT_MS = 12000; // 12 seconds between checks
const PARSER_READY_WAIT_MS = 3000; // 3 seconds after service is ready
const PARSER_REQUEST_TIMEOUT_MS = 60000; // 60 seconds for actual parse request
const PARSER_QUICK_HEALTH_TIMEOUT_MS = 5000; // 5 seconds for quick health check
const COLD_START_ATTEMPTS = 3; // First 3 attempts get longer timeout

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

//route
app.use("/api/recipes", recipes);
app.use("/api/recipeCollections", recipeCollections);

// Health check endpoint for Python service
app.get('/parser-health', async function(req, res) {
  const pythonUrl = process.env.NODE_ENV !== "development" 
    ? process.env.PYTHON_HEALTH
    : 'http://127.0.0.1:5000/health';
    
  try {
    const response = await fetch(pythonUrl, {
      method: 'GET',
      headers: {
        'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(PARSER_QUICK_HEALTH_TIMEOUT_MS)
    });

    if (response.ok) {
      res.json({ status: 'healthy', message: 'Parser service is ready' });
    } else {
      res.status(503).json({ status: 'unhealthy', message: 'Parser service is not responding' });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', message: 'Parser service is not responding' });
  }
});

// Recipe parser endpoint with retry logic
app.post('/recipe-parser', async function(req, res) {
  if (!req.body.link) {
    return res.status(400).json({ error: 'No link provided' });
  }
  
  const pythonUrl = process.env.PYTHON_URL;
  const healthUrl = process.env.PYTHON_HEALTH;
  
  try {
    let serviceReady = false;
        
    // Check health with multiple attempts - allow time for cold start
    for (let healthCheck = 0; healthCheck < PARSER_HEALTH_CHECK_ATTEMPTS; healthCheck++) {
      try {
        // First 3 checks get longer timeout (for cold start), rest get normal timeout
        const timeout = healthCheck < COLD_START_ATTEMPTS ? COLD_START_TIMEOUT_MS : NORMAL_TIMEOUT_MS;
        
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(timeout)
        });
        
        if (healthResponse.ok) {
          serviceReady = true;
          await new Promise(resolve => setTimeout(resolve, PARSER_READY_WAIT_MS));
          break;
        }
        
        // If not ready, wait before next attempt (except on last attempt)
        if (healthCheck < PARSER_HEALTH_CHECK_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_WAIT_MS));
        }
      } catch (error) {
        // Wait before next attempt (except on last attempt)
        if (healthCheck < PARSER_HEALTH_CHECK_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_WAIT_MS));
        }
      }
    }
    
    if (!serviceReady) {
      return res.status(503).json({ 
        error: 'Parser service failed to wake up. Please try again.',
        details: 'The service may be experiencing cold start issues or is unavailable.'
      });
    }
    
    // Service is ready, make the actual parse request
    const response = await fetch(pythonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: req.body.link }),
      signal: AbortSignal.timeout(PARSER_REQUEST_TIMEOUT_MS)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
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

// Apply error handlers
app.use(errorHandlerModule.notFoundHandler);
app.use(errorHandlerModule.errorHandler);

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});