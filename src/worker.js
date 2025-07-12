// worker.js
import  {redis}  from "./db/redis.js";
import { connect } from "./db/mongodb.js";
import { exec } from "child_process";

async function runWorker() {
  let db;

  try {
    db = await connect();
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.log("❌ MongoDB connection failed:", error.message);
    console.log("🔄 Running in Redis-only mode (no persistence)");
    db = null;
  }

  setInterval(async () => {
    const jobID = await redis.lpop("jobs:queue");
    if (!jobID) return;

    const jobData = await redis.hget("jobs:hash", jobID);
    const job = JSON.parse(jobData);

    // Check if job was cancelled before execution
    if (job.status === "cancelled") {
      console.log(`Job ${jobID} was cancelled, skipping execution`);
      return;
    }

    const { command } = job;
    console.log(`Executing ${jobID}: ${command}`);

    // Save to MongoDB if available
    if (db) {
      await db.insertOne({
        jobID,
        command,
        status: "running",
        startedAt: new Date(),
      });
    }

    try {
      exec(command, async (err, stdout, stderr) => {
        const result = {
          finishedAt: new Date(),
          status: err ? "failed" : "succeeded",
          output: stdout || stderr,
        };

        // Update MongoDB if available
        if (db) {
          await db.updateOne({ jobID }, { $set: result });
        }

        // Clean up Redis data after execution
        await redis.hdel("jobs:hash", jobID);
        console.log(`${jobID} done: ${result.status} - Redis data cleaned up`);
      });
    } catch (error) {
      console.log(error);
    }
  }, 1000);
}

runWorker().catch(console.error);
