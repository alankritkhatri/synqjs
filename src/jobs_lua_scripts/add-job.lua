-- KEYS[1]: jobs hash
-- KEYS[2]: jobs queue
-- ARGV[1]: job_id
-- ARGV[2]: job_data

if redis.call("HEXISTS", KEYS[1], ARGV[1]) == 1 then
  return "exists"
end

redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
redis.call("RPUSH", KEYS[2], ARGV[1])

return "queued"       