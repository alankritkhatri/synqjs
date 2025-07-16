
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  submitJob,
  getJobStatus,
  cancelJob,
} from "../queue.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Get queue statistics
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Failed to get queue statistics",
        message: error.message,
      });
  }
});

// CRUD Operations for Jobs

// CREATE - Submit a new job
app.post("/api/jobs", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }
    const result = await submitJob(command);
    res.status(201).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to submit job", message: error.message });
  }
});

// READ - Get specific job by ID
app.get("/api/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ jobID: jobId, ...job });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get job", message: error.message });
  }
});

// UPDATE - Cancel a job
app.patch("/api/jobs/:jobId/cancel", async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await cancelJob(jobId);

    if (result === "not_found") {
      return res.status(404).json({ error: "Job not found" });
    }

    if (result === "cancelled") {
      res.json({
        message: "Job cancelled successfully",
        jobId,
        status: "cancelled",
      });
    } else {
      res.status(400).json({ error: "Failed to cancel job", result });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to cancel job", message: error.message });
  }
});

// DELETE - Remove a job (conceptually - we'll mark it as deleted)
app.delete("/api/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    // First check if job exists
    const job = await getJobStatus(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // For safety, only allow deletion of completed, failed, or cancelled jobs
    if (!["succeeded", "failed", "cancelled"].includes(job.status)) {
      return res.status(400).json({
        error: "Cannot delete job",
        message: "Only completed, failed, or cancelled jobs can be deleted",
      });
    }

    // Cancel the job first if it's not already in a final state
    await cancelJob(jobId);
    res.json({ message: "Job deleted successfully", jobId });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete job", message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Something went wrong!", message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Synq API Server running on http://localhost:${PORT}`);
});

export default app;