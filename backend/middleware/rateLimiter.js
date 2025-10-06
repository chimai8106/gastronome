import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
  try {
    // Use user ID if logged in, else fallback to IP
    const userId = req.user?.id || req.ip; 

    const { success, remaining, reset } = await ratelimit.limit(userId);



    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later",
      });
    }

    next();
  } catch (error) {
    console.log("Rate limit error", error);
    next(error);
  }
};

export default rateLimiter;