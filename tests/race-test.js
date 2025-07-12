import { submitJob, cancelJob } from '../src/queue.js';
import { redis } from '../src/db/redis.js';

// Simple test runners
let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  console.log(`\n🧪 Test ${testCount}: ${name}`);

  return fn()
    .then(() => {
      passCount++;
      console.log(`✅ PASS`);
    })
    .catch((error) => {
      console.log(`❌ FAIL: ${error.message}`);
    });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Clean up function
async function cleanup() {
  try {
    await redis.del("jobs:queue");
    await redis.del("jobs:hash");
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Tests
async function runTests() {
  console.log("🚀 Starting Queue System Tests\n");

  // Test 1: Basic job submission
  await test("Job submission should work correctly", async () => {
    await cleanup();

    await submitJob('echo "test job"');

    const queueLength = await redis.llen("jobs:queue");
    const hashSize = await redis.hlen("jobs:hash");

    assert(queueLength === 1, `Expected 1 job in queue, got ${queueLength}`);
    assert(hashSize === 1, `Expected 1 job in hash, got ${hashSize}`);
    console.log(`   ✅ Job submitted successfully`);
  });

  // Test 2: Concurrent job submission
  await test("Concurrent job submission should work", async () => {
    await cleanup();

    const jobs = Array.from({ length: 10 }, (_, i) =>
      submitJob(`echo "concurrent job ${i}"`)
    );

    await Promise.all(jobs);

    const queueLength = await redis.llen("jobs:queue");
    const hashSize = await redis.hlen("jobs:hash");

    assert(queueLength === 10, `Expected 10 jobs in queue, got ${queueLength}`);
    assert(hashSize === 10, `Expected 10 jobs in hash, got ${hashSize}`);
    console.log(`   ✅ All ${queueLength} jobs submitted successfully`);
  });

  // Test 3: Atomic job processing
  await test("Job processing should be atomic", async () => {
    await cleanup();

    await submitJob('echo "atomic test"');

    // Two workers try to get the same job
    const worker1 = redis.lpop("jobs:queue");
    const worker2 = redis.lpop("jobs:queue");

    const [job1, job2] = await Promise.all([worker1, worker2]);

    // Only one should get the job
    const jobsReceived = [job1, job2].filter((job) => job !== null);
    assert(jobsReceived.length === 1, `Expected 1 job, got ${jobsReceived.length}`);
    console.log(`   ✅ Atomic processing works: Only 1 worker got the job`);
  });

  // Test 4: Job cancellation
  await test("Job cancellation should work", async () => {
    await cleanup();

    await submitJob('echo "cancel test"');

    const jobId = await redis.lindex("jobs:queue", 0);
    assert(jobId, "Job should be in queue");

    const result = await cancelJob(jobId);
    assert(result === "cancelled", `Expected 'cancelled', got '${result}'`);

    const jobData = await redis.hget("jobs:hash", jobId);
    const job = JSON.parse(jobData);
    assert(job.status === "cancelled", "Job should be marked as cancelled");
    console.log(`   ✅ Job cancellation works correctly`);
  });

  // Test 5: Redis connection
  await test("Redis connection should be healthy", async () => {
    const pong = await redis.ping();
    assert(pong === "PONG", "Redis should respond with PONG");
    console.log(`   ✅ Redis connection healthy`);
  });

  // Final cleanup
  await cleanup();
  await redis.disconnect();

  // Results
  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${passCount}/${testCount}`);
  console.log(`❌ Failed: ${testCount - passCount}/${testCount}`);

  if (passCount === testCount) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n❌ ${testCount - passCount} test(s) failed`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 