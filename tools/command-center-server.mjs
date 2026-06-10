import http from "node:http";
import { spawn, exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const port = 3030;

// Helper to run shell commands synchronously (for git status checks)
function runCommandSync(cmd, cwd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) {
        resolve({ error: err.message, output: "" });
      } else {
        resolve({ error: null, output: stdout.trim() });
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // Endpoint: GET /api/status
  if (pathname === "/api/status" && req.method === "GET") {
    try {
      const gitBranch = await runCommandSync("git branch --show-current", rootDir);
      const gitDirty = await runCommandSync("git status --porcelain", rootDir);
      
      const pkgPath = path.join(rootDir, "package.json");
      let scripts = [];
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        scripts = Object.keys(pkg.scripts || {});
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "online",
        branch: gitBranch.output || "unknown",
        isDirty: gitDirty.output.length > 0,
        scripts: scripts
      }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Endpoint: GET /api/run?script=...
  if (pathname === "/api/run" && req.method === "GET") {
    const scriptName = reqUrl.searchParams.get("script");

    if (!scriptName) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing script query parameter." }));
      return;
    }

    // Security check: Validate script exists in package.json to avoid remote command injection
    const pkgPath = path.join(rootDir, "package.json");
    let isValid = false;
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      isValid = Object.keys(pkg.scripts || {}).includes(scriptName);
    }

    if (!isValid) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Script '${scriptName}' is not defined in package.json.` }));
      return;
    }

    // Set Server-Sent Events headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    console.log(`[Command Server] Running npm run ${scriptName}`);
    
    // Spawn script execution (note: we use shell:true on Mac to handle npm resolution easily)
    const proc = spawn("npm", ["run", scriptName], { 
      cwd: rootDir,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" } // preserve color outputs
    });

    proc.stdout.on("data", (data) => {
      res.write(`data: ${JSON.stringify({ type: "stdout", text: data.toString() })}\n\n`);
    });

    proc.stderr.on("data", (data) => {
      res.write(`data: ${JSON.stringify({ type: "stderr", text: data.toString() })}\n\n`);
    });

    proc.on("close", (code) => {
      console.log(`[Command Server] Script ${scriptName} exited with code ${code}`);
      res.write(`data: ${JSON.stringify({ type: "exit", code: code })}\n\n`);
      res.end();
    });

    req.on("close", () => {
      // If client terminates connection, kill the child process
      console.log(`[Command Server] Connection closed by client, terminating process.`);
      proc.kill("SIGTERM");
    });
    return;
  }

  // Endpoint: GET /api/lessons
  if (pathname === "/api/lessons" && req.method === "GET") {
    try {
      const lessonsDir = path.join(rootDir, "lessons");
      const list = [];
      if (fs.existsSync(lessonsDir)) {
        const dirs = fs.readdirSync(lessonsDir);
        for (const dir of dirs) {
          const configPath = path.join(lessonsDir, dir, "config.json");
          if (fs.existsSync(configPath)) {
            try {
              const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
              list.push({ id: dir, title: cfg.title || dir });
            } catch (e) {
              list.push({ id: dir, title: dir });
            }
          }
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ lessons: list }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Endpoint: GET /api/logs
  if (pathname === "/api/logs" && req.method === "GET") {
    try {
      const logsDir = path.join(rootDir, ".qa-logs");
      let files = [];
      if (fs.existsSync(logsDir)) {
        files = fs.readdirSync(logsDir)
          .filter(f => f.endsWith(".log"))
          .map(f => {
            const stat = fs.statSync(path.join(logsDir, f));
            return { name: f, time: stat.mtimeMs, size: stat.size };
          })
          .sort((a, b) => b.time - a.time);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ logs: files }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Endpoint: GET /api/view-log?file=...
  if (pathname === "/api/view-log" && req.method === "GET") {
    const fileName = reqUrl.searchParams.get("file");
    if (!fileName || !fileName.endsWith(".log") || fileName.includes("/") || fileName.includes("\\")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid log filename." }));
      return;
    }

    try {
      const filePath = path.join(rootDir, ".qa-logs", fileName);
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, "utf8");
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(text);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Log file not found." }));
      }
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Fallback 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found." }));
});

server.listen(port, () => {
  console.log(`========================================================`);
  console.log(`EduWonderLab local Command Server running at:`);
  console.log(`👉 http://localhost:${port}`);
  console.log(`========================================================`);
});
