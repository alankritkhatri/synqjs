import express from "express";
import cors from "cors";
import helmet from "helmet";
import { runWorker } from "../worker.js";

const app = express();
const PORT = process.env.WORKER_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Worker status
let workerStatus = {
  isRunning: false,
  startedAt: null,
  processedJobs: 0
};


// Start worker
app.post("/api/worker/start", async (req, res) => {
  if (workerStatus.isRunning) {
    return res.status(400).json({ error: "Worker is already running" });
  }

  try {
    workerStatus.isRunning = true;
    workerStatus.startedAt = new Date();
    
    // Start the worker in the background
    runWorker();
    
    res.json({ 
      message: "Worker started successfully", 
      status: workerStatus 
    });
  } catch (error) {
    workerStatus.isRunning = false;
    res.status(500).json({ 
      error: "Failed to start worker", 
      message: error.message 
    });
  }
});

// Stop worker (graceful shutdown)
app.post("/api/worker/stop", (req, res) => {
  if (!workerStatus.isRunning) {
    return res.status(400).json({ error: "Worker is not running" });
  }

  workerStatus.isRunning = false;
  res.json({ message: "Worker stop requested", status: workerStatus });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!", 
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  workerStatus.isRunning = false;
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  workerStatus.isRunning = false;
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🔧 Synq Worker API Server running on http://localhost:${PORT}`);
});

export default app;
