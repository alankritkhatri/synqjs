import fs from "fs";
import path from "path";
import {redis} from "./db/redis.js";
import {connect} from "./db/mongodb.js";

const luaScript = fs.readFileSync(path.join(process.cwd(), "src/jobs_lua_scripts/add-job.lua"), "utf8");
const cancelLuaScript = fs.readFileSync(path.join(process.cwd(), "src/jobs_lua_scripts/cancel-job.lua"), "utf8");

redis.defineCommand("enqueueJob", {
  numberOfKeys: 2,
  lua: luaScript,
});

redis.defineCommand("cancelJob", {
  numberOfKeys: 1,
  lua: cancelLuaScript,
});


export async function submitJob(command) {
try {
    const jobID = `job-${Date.now()}`;
    const payload = JSON.stringify({ command, createdAt: new Date() });

    const result = await redis.enqueueJob(
      "jobs:hash",
      "jobs:queue",
      jobID,
      payload
    );
    console.log(`Job Submitted: ${jobID} - Status: ${result}`);
} catch (error) {
  console.log(error)
}
}

export async function cancelJob(jobID) {
  try {
    const result = await redis.cancelJob("jobs:hash", jobID, new Date().toISOString());
    console.log(`Job ${jobID} cancellation: ${result}`);
    return result;
  } catch (error) {
    console.log(error);
    return "error";
  }
}

export async function getJobStatus(jobID) {
  const db = await connect();
  const job = await db.findOne({ jobID });
  console.log(job || "No such job");
} 