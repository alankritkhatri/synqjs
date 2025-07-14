-- Check if job already exists
if redis.call("HEXISTS", KEYS[1], ARGV[1]) == 1 then
  return "exists"
end

redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
redis.call("RPUSH", KEYS[2], ARGV[1])

return "queued"       