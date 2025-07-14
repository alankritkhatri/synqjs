#!/usr/bin/env node
import { submitJob, getJobStatus, cancelJob } from "./queue.js";
const [_, __, cmd, ...args] = process.argv;
console.log(process.argv);
if (cmd === "submit") {
  const command = args.join(" ");
  console.log(args, command);
  submitJob(command);
} else if (cmd === "status") {
  const jobID = args[0];
  getJobStatus(jobID);
} else if (cmd === "cancel") {
  const jobID = args[0];
  cancelJob(jobID);
} else {
  console.log(
    "Usage:\n  node cli.js submit <cmd>\n  node cli.js status <jobID>\n  node cli.js cancel <jobID>"
  );
}
