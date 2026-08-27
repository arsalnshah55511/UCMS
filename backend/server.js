const express = require("express")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const mongoSanitize = require("express-mongo-sanitize")
const dotenv = require("dotenv")
const cors = require("cors")
const connectDB = require("./config/db")
const path = require("path")


const authRoutes = require("./routes/authRoutes")
const departmentRoutes = require("./routes/departmentRoutes")
const complainRoutes = require("./routes/complainRoutes")
const notificationRoutes = require("./routes/notificationRoutes")


dotenv.config()
const app = express()
app.use(helmet())
app.use(morgan("common"))
const limiter = rateLimit(
    {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
);
app.use(limiter)
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
connectDB()



//  routes
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/complain",complainRoutes)
app.use("/uploads", express.static("uploads"));
app.use("/api/notifications", notificationRoutes);

app.get("/",(req,res)=>{
    res.send("UCMS website is running")
})

const port = process.env.PORT || 5000

app.listen(port,(req,res)=>{
   console.log(`the website is running on the port ${port} `)
})