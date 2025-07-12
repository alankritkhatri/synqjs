import { submitJob } from "../src/queue.js";
import { redis } from "../src/db/redis.js";

// Simple load test
async function runLoadTest() {
  console.log("🚀 Starting load test...");

  // Clean up first
  await redis.del("jobs:queue");
  await redis.del("jobs:hash");

  const startTime = Date.now();
  const jobCount = 50;

  // Submit jobs concurrently
  const jobs = Array.from({ length: jobCount }, (_, i) =>
    submitJob(`echo "Load test job ${i}"`)
  );

  await Promise.all(jobs);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Verify results
  const queueLength = await redis.llen("jobs:queue");
  const hashSize = await redis.hlen("jobs:hash");

  console.log(`✅ Load test completed in ${duration}ms`);
  console.log(`📊 Jobs submitted: ${jobCount}`);
  console.log(`📊 Queue length: ${queueLength}`);
  console.log(`📊 Hash size: ${hashSize}`);

  // Test concurrent processing
  console.log("🔄 Testing concurrent job processing...");

  const processingResults = [];
  for (let i = 0; i < 5; i++) {
    processingResults.push(redis.lpop("jobs:queue"));
  }

  const processed = await Promise.all(processingResults);
  const actualJobs = processed.filter((job) => job !== null);

  console.log(`✅ Processed ${actualJobs.length} jobs concurrently`);

  // Clean up
  await redis.del("jobs:queue");
  await redis.del("jobs:hash");
  await redis.disconnect();

  console.log("🎉 Load test completed successfully!");
}

// Run the test if this file is executed directly
if (process.argv[1].includes("load-test.js")) {
  runLoadTest().catch(console.error);
}

export { runLoadTest };
