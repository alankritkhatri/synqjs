-- KEYS[1]: jobs hash
-- KEYS[2]: jobs queue
-- ARGV[1]: job_id
-- ARGV[2]: cancelledAt

if redis.call("HEXISTS", KEYS[1], ARGV[1]) == 0 then
  return "not_found"
end

local jobData = redis.call("HGET", KEYS[1], ARGV[1])
local job = cjson.decode(jobData)

redis.call("LREM", KEYS[2], 0, ARGV[1])
job.status = "cancelled"
job.cancelledAt = ARGV[2]

redis.call("HSET", KEYS[1], ARGV[1], cjson.encode(job))
return "cancelled" 