# gastronome 🍳
### *not your grandma's recipe book*

A social media for your ecipe.
Save recipes from anywhere: a food blog, a YouTube video, or a TikTok. Paste the link and gastronome turns it into a clean recipe card you can edit, organize into collections, and share.


> The parser service runs on a free tier, so the first import after it has been idle can take up to a minute while it wakes up.

---

## Features

- **Import from any link.** Paste a URL and gastronome pulls out the title, ingredients, steps, servings, cook time, and photo.
  - **Recipe websites:** reads the page's structured recipe data, with a fallback HTML scraper for sites that don't publish it.
  - **YouTube:** grabs the video transcript and uses an AI agent (built on [Atomic Agents](https://github.com/BrainBlend-AI/atomic-agents)) to turn it into a structured recipe.
  - **TikTok:** downloads the video, transcribes it with Whisper, and uses GPT-4o to extract the recipe.
- **Cook with what you have.** Type in the ingredients in your fridge to get matching recipes (powered by Spoonacular), and save any result to your own book.
- **Write your own recipes**, with photo uploads stored on AWS S3.
- **Collections.** Group recipes into public or private collections, like "Weeknight dinners" or "Holiday baking".
- **Search** across public recipes and collections by title, ingredient, cuisine, or author.
- **Accounts** with Firebase Authentication. Private recipes stay private, and only the owner can edit or delete them.

## How it works

```mermaid
flowchart LR
    U[React frontend<br/>Vite] -->|REST + Firebase token| B[Node.js / Express API]
    B --> M[(MongoDB)]
    B --> S3[(AWS S3<br/>recipe photos)]
    B --> R[(Upstash Redis<br/>rate limiting)]
    B --> SP[Spoonacular API]
    B -->|/recipe-parser| P[Flask parser service]
    P --> W[Recipe websites]
    P --> YT[YouTube transcript<br/>+ Atomic Agents]
    P --> TT[TikTok<br/>yt-dlp + Whisper + GPT-4o]
```

The app has three parts:

| Part | Folder | What it does |
|---|---|---|
| **Frontend** | `frontend/` | React 19 single-page app (Vite, React Router, Firebase Auth) |
| **Backend API** | `backend/` | Express 5 REST API: recipes, collections, auth checks, image uploads, rate limiting. In production it also serves the built frontend. |
| **Parser service** | `recipe-parser-service/` | Flask service that turns a link into a structured recipe |

## Tech stack

**Frontend:** React, React Router, Vite, Firebase Auth, react-hot-toast
**Backend:** Node.js, Express, MongoDB + Mongoose, Firebase Admin, AWS S3 (presigned URLs), Upstash Redis rate limiting, Multer
**Parser service:** Python, Flask, Gunicorn, recipe-scrapers, BeautifulSoup, Atomic Agents, OpenAI (GPT, Whisper), yt-dlp, YouTube Data API
**Hosting:** Render

---

## Getting started

### Prerequisites

- Node.js 18+
- Python 3.12
- A MongoDB database (e.g. MongoDB Atlas)
- A Firebase project with Email/Password sign-in enabled
- An AWS S3 bucket
- An Upstash Redis database
- API keys for OpenAI, YouTube Data API v3, and Spoonacular

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/gastronome.git
cd gastronome
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5001

MONGO_URI=mongodb+srv://...

# Firebase Admin (Project settings > Service accounts > Generate new private key)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BUCKET=your-bucket-name

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Spoonacular (search by ingredients)
SPOONACULAR_API_KEY=...

# Parser service
PYTHON_URL=http://127.0.0.1:5000/recipe-parser
PYTHON_HEALTH=http://127.0.0.1:5000/health
```

Start it:

```bash
npm run dev     # http://localhost:5001
```

### 3. Parser service

```bash
cd recipe-parser-service
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # also installs the bundled atomic-agents package
```

Create `recipe-parser-service/.env`:

```env
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...
```

Start it:

```bash
python flask_server.py   # http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

The Firebase web config lives in `frontend/src/firebase/firebase.js`. To use your own Firebase project, replace the values there with the ones from your project settings.

---

## API overview

All routes are prefixed with `/api`. 🔒 means a Firebase ID token is required (`Authorization: Bearer <token>`).

### Recipes: `/api/recipes`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List public recipes |
| GET | `/:id` | Get one recipe |
| GET | `/search-text?q=` | Full-text search over public recipes |
| POST | `/search` | Find recipes by ingredients (Spoonacular) |
| GET | `/dashboard` 🔒 | List my recipes |
| POST | `/` 🔒 | Create a recipe (multipart, optional `image`) |
| PUT | `/:id` 🔒 | Update a recipe |
| DELETE | `/:id` 🔒 | Delete a recipe |
| POST | `/add-to-collection` 🔒 | Add a recipe to a collection |
| POST | `/remove-from-collection` 🔒 | Remove a recipe from a collection |

### Collections: `/api/recipeCollections`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List public collections |
| GET | `/:id` | Get one collection |
| GET | `/search?q=` | Search collections |
| GET | `/dashboard` 🔒 | List my collections |
| POST | `/` 🔒 | Create a collection |
| PUT | `/:id` 🔒 | Update a collection |
| DELETE | `/:id` 🔒 | Delete a collection |

### Parser

| Method | Route | Description |
|---|---|---|
| POST | `/recipe-parser` | Body `{ "link": "<url>" }`. Returns a structured recipe. Waits for the parser service to wake up if needed. |
| GET | `/parser-health` | Checks whether the parser service is up |

---

## Deployment (Render)

**Web service (frontend + backend)**, from the repo root:

- Build command: `npm run build` (installs both apps and builds the frontend)
- Start command: `npm start`
- Environment: everything in `backend/.env`, with `NODE_ENV=production` and `PYTHON_URL` / `PYTHON_HEALTH` pointing at the deployed parser service

**Parser service**, with root directory `recipe-parser-service`:

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn flask_server:app`
- Environment: `OPENAI_API_KEY`, `YOUTUBE_API_KEY`

If you deploy under a different domain, add it to the CORS origins in `recipe-parser-service/flask_server.py`.

## Project structure

```
gastronome/
├── package.json                 # root scripts used by Render
├── backend/
│   ├── server.js                # Express app, parser proxy, static hosting
│   ├── config/                  # MongoDB + Upstash setup
│   ├── controllers/             # recipe + collection logic
│   ├── middleware/              # Firebase auth, rate limiter, error handler
│   ├── models/                  # Mongoose schemas
│   ├── routes/
│   ├── db/s3.mjs                # S3 upload / presigned URLs
│   └── utils/                   # validation + custom errors
├── frontend/
│   └── src/
│       ├── pages/               # Home, Dashboard, Create, Collection, Search, ...
│       ├── components/
│       ├── contexts/            # auth, import, create, add-to-collection
│       ├── services/            # API clients
│       └── firebase/
└── recipe-parser-service/
    ├── flask_server.py          # routes links to the right parser
    ├── recipe_service.py        # website parser
    ├── tiktok_service.py        # TikTok parser
    └── atomic-agents/           # vendored Atomic Agents (YouTube to recipe agent)
```

## Acknowledgements

- [Atomic Agents](https://github.com/BrainBlend-AI/atomic-agents) by BrainBlend AI (MIT), used for the YouTube-to-recipe agent
- [recipe-scrapers](https://github.com/hhursev/recipe-scrapers)
- [Spoonacular API](https://spoonacular.com/food-api)

## Author

**Mai Nguyen** · [LinkedIn](https://www.linkedin.com/in/mai-nguyen-674432218/) · [Portfolio](https://chimai8106.github.io)

## License

MIT
