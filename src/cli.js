#!/usr/bin/env node
import { submitJob, getJobStatus, cancelJob } from "./queue.js";
import { startDashboard } from "./dashboard.js";

const [_, __, cmd, ...args] = process.argv;

if (cmd === "submit") {
  const command = args.join(" ");
  submitJob(command);
} else if (cmd === "status") {
  const jobID = args[0];
  getJobStatus(jobID);
} else if (cmd === "cancel") {
  const jobID = args[0];
  cancelJob(jobID);
} else if (cmd === "dashboard") {
  startDashboard();
} else {
  console.log(
    "Usage:\n  node cli.js submit <cmd>\n  node cli.js status <jobID>\n  node cli.js cancel <jobID>\n  node cli.js dashboard"
  );
}
