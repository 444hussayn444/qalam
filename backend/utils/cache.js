import NodeCache from "node-cache";

// .***. Create cache instance with 10 minutes TTL .***.
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120 // Check for expired keys every 2 minutes
});

export default cache;
