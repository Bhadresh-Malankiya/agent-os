import http from "node:http";
import pg from "pg";
try {
  if (process.argv[2] === "web") {
    const origin = new URL(process.env.APP_ORIGIN);
    await new Promise((resolve, reject) => {
      const req = http.get(
        "http://127.0.0.1:3100/api/health",
        { headers: { Host: origin.host }, timeout: 4000 },
        (res) => {
          res.resume();
          res.statusCode === 200
            ? resolve()
            : reject(new Error("Web is unhealthy"));
        },
      );
      req.on("timeout", () => req.destroy(new Error("Health timeout")));
      req.on("error", reject);
    });
  } else {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    try {
      const r = await pool.query(
        "SELECT heartbeat>now()-interval '30 seconds' healthy FROM worker_health WHERE id=true",
      );
      if (!r.rows[0]?.healthy) throw new Error("Worker heartbeat is stale");
    } finally {
      await pool.end();
    }
  }
} catch {
  console.error("Health check failed");
  process.exitCode = 1;
}
