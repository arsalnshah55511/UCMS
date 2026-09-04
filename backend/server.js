const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const mongoSanitize = require("express-mongo-sanitize")
const cors = require("cors")
const connectDB = require("./config/db")
const path = require("path")


const authRoutes = require("./routes/authRoutes")
const departmentRoutes = require("./routes/departmentRoutes")
const complainRoutes = require("./routes/complainRoutes")
const notificationRoutes = require("./routes/notificationRoutes")


const app = express()

// Render (and most hosting platforms) sit behind a reverse proxy, which

// of this server.
app.set("trust proxy", 1)


const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL, // set this on Render to your deployed frontend URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(helmet())
app.use(morgan("common"))

// Strict limiter for auth routes — brute-force protection
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

// Generous limiter for everything else — needs to tolerate polling
// (e.g. NotificationBell fetching every 30-60s per user)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json())
app.use(mongoSanitize())
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
connectDB()


//  routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/departments", generalLimiter, departmentRoutes);
app.use("/api/complain", generalLimiter, complainRoutes)
app.use("/api/notifications", generalLimiter, notificationRoutes);

app.get("/",(req,res)=>{
    res.send("UCMS website is running")
})

const port = process.env.PORT || 5000

app.listen(port,(req,res)=>{
   console.log(`the website is running on the port ${port} `)
})