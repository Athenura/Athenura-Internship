import express from "express";
const app = express();
import cron from "node-cron"
import axios from "axios";
import ConnectDB from "./config/DB.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import {updateInternStatus} from "./CronJob/CalculateDuration.js" 
dotenv.config();

import cors from "cors";
app.use(cors({ origin: "*" }));
const PORT = process.env.PORT || 8000;

app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true })); 
app.use(cookieParser());

let lastActiveTime = Date.now();

app.use((req, res, next) => {
  
  lastActiveTime = Date.now();
  next();
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});



import authRoutes from './routers/AuthRoutes.js'
import internRoutes from './routers/InternRoutes.js'
import hrRoutes from './routers/HrRoutes.js'
import adminRoutes from './routers/AdminRoutes.js'
import Incharge from "./routers/InchargeRoutes.js"
import Feedback from "./routers/FeedbackRoutes.js";
import ReviewTeam from "./routers/ReviewRouters.js";


// connecting to database
await ConnectDB();
// routers
app.use('/api', authRoutes);
app.use('/api', internRoutes);  
app.use('/api', hrRoutes);
app.use('/api', adminRoutes);
app.use("/api", Incharge)
app.use("/api", Feedback)
app.use("/api", ReviewTeam)

updateInternStatus()


const INACTIVITY_LIMIT = 10 * 60 * 1000; // 5 seconds (FOR TESTING)
const SELF_URL = "https://athenura-internship.onrender.com/health"; // LOCAL TEST

cron.schedule("*/13 * * * *", async () => {
  const inactiveTime = Date.now() - lastActiveTime;

  console.log("⏱ Cron tick at", new Date().toISOString());
  console.log("Inactive for:", inactiveTime, "ms");

  if (inactiveTime > INACTIVITY_LIMIT) {
    console.log("🟢 No users active → hitting /health");

    try {
      await axios.get(SELF_URL);
    } catch (err) {
      console.error("❌ Ping failed:", err.message);
    }
  } else {
    console.log("⏸ Users active → cron skipped");
  }
});

console.log("✅ Keep-alive cron REGISTERED");

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


