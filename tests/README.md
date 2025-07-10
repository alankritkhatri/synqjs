# Race Condition Tests

**Super simple** and **super short** tests to verify the job queue system handles concurrent operations correctly.

## Test Files

### 1. `simple-race-test.js`
**Simple Node.js tests** - No frameworks, just pure Node.js testing with real Redis.

**Tests:**
- ✅ Concurrent job submissions (10 jobs)
- ✅ Rapid job submissions (50 jobs)
- ✅ Atomic job processing
- ✅ Job cancellation handling
- ✅ Redis connection verification
- ✅ High concurrency (100 jobs)

### 2. `load-test.js`
**Load testing** - Stress test with performance metrics.

**Features:**
- 🚀 100+ concurrent job submissions
- 📊 Performance timing
- 🔄 Concurrent processing verification
- 🧹 Automatic cleanup

## Running Tests

```bash
# Run race condition tests
npm test

# Run load test
npm run test:load
```

## Prerequisites

- Redis server running on localhost:6379
- Node.js with ES modules support

## Key Race Conditions Tested

1. **Job Submission Race** - Multiple clients submitting jobs simultaneously
2. **Worker Competition** - Multiple workers trying to process the same job
3. **Cancellation Race** - Job cancelled while being processed
4. **High Concurrency** - 100+ concurrent operations
5. **Atomic Processing** - Ensuring jobs are processed exactly once

## Test Strategy

- **Pure Node.js** - No test frameworks, just simple assertions
- **Real Redis** - Tests actual system behavior
- **Performance Metrics** - Timing and throughput measurement
- **Automatic Cleanup** - Tests clean up after themselves

All tests are **super simple**, **super short**, and **reliable**. 