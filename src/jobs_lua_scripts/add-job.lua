
if redis.call("HEXISTS", KEYS[1], ARGV[1]) == 1 then
  return "exists"
end

redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
redis.call("RPUSH", KEYS[2], ARGV[1])

if ARGV[3] then
  redis.call("EXPIRE", KEYS[1], ARGV[3])
end

return "queued"