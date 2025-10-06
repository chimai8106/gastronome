import express from "express"
import recipes from "./routes/recipesRoutes.js"
import cors from "cors";
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

const app = express()

app.use(cors({
    origin : "http://localhost:5173"
}
));
//middleware
app.use(express.json());
app.use(rateLimiter)


app.use("/api/recipes", recipes) 
const PORT = process.env.PORT || 5001;
connectDB().then(()=>{
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

)
