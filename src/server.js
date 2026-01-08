import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pitchRoute from "./routes/pitch.route.js";
import vcRoute from "./routes/vc.route.js";
import matchRoute from "./routes/match.route.js";
dotenv.config({ quiet: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/pitches", pitchRoute);
app.use("/vcs", vcRoute);
app.use("/match", matchRoute);

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
});
