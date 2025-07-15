// worker.js
import  {redis}  from "./db/redis.js";
import { connect } from "./db/mongodb.js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

async function runWorker() {
  let db;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  try {
    db = await connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("MongoDB connection failed:", error.message);
    console.log("Running in Redis-only mode (no persistence)");
    db = null;
  }

  const startJobsLuaScript = fs.readFileSync(
    path.join(__dirname, "jobs_lua_scripts", "process-jobs.lua"),
    "utf8"
  );

  redis.defineCommand("processJobs", {
    numberOfKeys: 2,
    lua: startJobsLuaScript,
  });

  setInterval(async () => {
    const result = await redis.processJobs("jobs:hash", "jobs:queue");

    if (!result) {
      return;
    }

    const parsed = JSON.parse(result);

    if (parsed.error) {
      return;
    }

    const { jobID, command } = parsed;
    console.log(`Processing job ${jobID}: ${command}`);

    if (db) {
      await db.insertOne({
        jobID,
        command,
        status: "running",
      });
    }

    try {
      exec(command, async (err, stdout, stderr) => {
        const jobResult = {
          finishedAt: new Date(),
          status: err ? "failed" : "succeeded",
          output: stdout || stderr,
        };

        // Update Redis with the completed job
        await redis.hset(
          "jobs:hash",
          jobID,
          JSON.stringify({
            command,
            createdAt: new Date(),
            status: jobResult.status,
            finishedAt: jobResult.finishedAt,
            output: jobResult.output,
          })
        );

        if (db) {
          await db.updateOne({ jobID }, { $set: jobResult });
        }

        console.log(jobID, "completed");
      });
    } catch (error) {
      console.log(error);
    }
  }, 1000);
}

runWorker().catch(console.error);
