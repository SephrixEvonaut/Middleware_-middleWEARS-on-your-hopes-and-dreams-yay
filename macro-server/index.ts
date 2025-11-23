import express from "express";
import routes from "./routes";

const app = express();
const PORT = process.env.MACRO_PORT || 5001;

app.use(express.json());

// API routes
app.use(routes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "macro-sequencer" });
});

app.listen(PORT, () => {
  console.log(`🎮 Macro Sequencer API running on port ${PORT}`);
});
