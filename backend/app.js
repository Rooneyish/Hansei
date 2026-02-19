require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Test route 
app.get("/test", (req, res) => {
  res.send("Server is live!");
});

// Authentication routes (Login/Register)
app.use("/api/auth", require("./routes/authRoutes"));

// User routes (Profile/Streaks/Journal)
app.use("/api", require("./routes/userRoutes"));

// Chat Bot routes (Chat)
app.use("/api", require("./routes/chatRoutes"));

// History routes (Chat History, Activity History)
app.use("/api", require("./routes/historyRoutes"))


app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
