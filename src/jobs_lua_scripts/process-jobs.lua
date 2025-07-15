-- KEYS[1]: jobs hash
-- KEYS[2]: jobs queue

local jobID = redis.call("LINDEX", KEYS[2], 0)

if not jobID then
  return cjson.encode({error = "no job found"})
end

local jobData = redis.call("HGET", KEYS[1], jobID)
if not jobData then
  return cjson.encode({error = "job not found"})
end

local job = cjson.decode(jobData)

if job.status == "running" then
  return cjson.encode({error = "job already running"})
end

if job.status ~= "pending" then
    return cjson.encode({error = "job not runnable"})
end

redis.call("LPOP", KEYS[2])
job.status = "running"
job.startedAt = redis.call("TIME")[1]
redis.call("HSET", KEYS[1], jobID, cjson.encode(job))
return cjson.encode({jobID = jobID, command = job.command})