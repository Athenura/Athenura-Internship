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



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


