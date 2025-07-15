import { redis } from "./db/redis.js";

export async function startDashboard() {
  console.clear();
  console.log("📊 Synq Dashboard - Press Ctrl+C to exit\n");
  
  const refreshDashboard = async () => {
    process.stdout.write("\x1b[H\x1b[2J");

    const queueLength = await redis.llen("jobs:queue");
    const hashSize = await redis.hlen("jobs:hash");
    const queueJobs =
      queueLength > 0 ? await redis.lrange("jobs:queue", 0, 9) : [];
    
    const allJobIds = hashSize > 0 ? await redis.hkeys("jobs:hash") : [];
    const jobStatuses = { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 };
    const runningJobs = [];
    
    for (const jobId of allJobIds) {
      const jobData = await redis.hget("jobs:hash", jobId);
      const job = JSON.parse(jobData);
      
      if (job.status === "succeeded") jobStatuses.completed++;
      else if (job.status === "failed") jobStatuses.failed++;
      else if (job.status === "cancelled") jobStatuses.cancelled++;
      else if (job.status === "running") {
        jobStatuses.running++;
        runningJobs.push({ id: jobId, ...job });
      } else {
        jobStatuses.pending++;
      }
    }
    
    const now = new Date();
    
    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log("│                   📊 SYNQ DASHBOARD                      │");
    console.log("├──────────────────────────────────────────────────────────┤");
    console.log(`│ Updated: ${now.toLocaleTimeString().padEnd(43)} │`);
    console.log("├──────────────────────────────────────────────────────────┤");
    console.log("│ QUEUE STATISTICS                                         │");
    console.log("├──────────────────────────────────────────────────────────┤");
    console.log(`│ 📋 Pending:   ${jobStatuses.pending.toString().padEnd(6)} │ 🟡 Running:  ${jobStatuses.running.toString().padEnd(6)} │`);
    console.log(`│ ✅ Completed: ${jobStatuses.completed.toString().padEnd(6)} │ ❌ Failed:   ${jobStatuses.failed.toString().padEnd(6)} │`);
    console.log(`│ 🚫 Cancelled: ${jobStatuses.cancelled.toString().padEnd(6)} │ 📊 Total:    ${hashSize.toString().padEnd(6)} │`);
    console.log("├──────────────────────────────────────────────────────────┤");
    
    if (runningJobs.length > 0) {
      console.log("│ 🔄 CURRENTLY RUNNING                                     │");
      console.log("├──────────────────────────────────────────────────────────┤");
      for (const job of runningJobs.slice(0, 3)) {
        const shortId = job.id.slice(-8);
        const cmd = job.command.length > 35 ? job.command.slice(0, 35) + "..." : job.command;
        const startTime = new Date(job.startedAt * 1000).toLocaleTimeString();
        console.log(`│ ${shortId} │ ${cmd.padEnd(38)} │`);
        console.log(`│          │ Started: ${startTime.padEnd(27)} │`);
      }
      console.log("├──────────────────────────────────────────────────────────┤");
    }
    
    console.log("│ 📋 PENDING QUEUE (Next 8)                               │");
    console.log("├──────────────────────────────────────────────────────────┤");
    
    if (queueJobs.length === 0) {
      console.log("│ No pending jobs in queue                                 │");
    } else {
      for (const jobId of queueJobs.slice(0, 8)) {
        const jobData = await redis.hget("jobs:hash", jobId);
        const job = JSON.parse(jobData);
        const shortId = jobId.slice(-8);
        const cmd = job.command.length > 35 ? job.command.slice(0, 35) + "..." : job.command;
        const createdTime = new Date(job.createdAt).toLocaleTimeString();
        console.log(`│ ${shortId} │ ${cmd.padEnd(38)} │`);
        console.log(`│          │ Created: ${createdTime.padEnd(27)} │`);
      }
    }
    
    console.log("└──────────────────────────────────────────────────────────┘");
    console.log("\n🔄 Auto-refresh: 2s | 📊 Dashboard | ⌨️  Ctrl+C to exit");
  };
  
  await refreshDashboard();
  const interval = setInterval(refreshDashboard, 2000);
  
  process.on("SIGINT", () => {
    clearInterval(interval);
    redis.disconnect();
    console.log("\n👋 Dashboard closed");
    process.exit(0);
  });
} 