import { spawn } from "child_process";
import assert from "assert";
import { test, before, after } from "node:test";

let serverProcess: any;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

before(() => {
  return new Promise<void>((resolve, reject) => {
    console.log("Starting backend server for testing...");
    serverProcess = spawn("npx", ["tsx", "backend/server.ts"], {
      env: { ...process.env, PORT: String(PORT) },
      shell: true
    });

    let started = false;

    serverProcess.stdout.on("data", (data: any) => {
      const output = data.toString();
      console.log("[Server stdout]:", output);
      if (output.includes("[API Server] Running on port") || output.includes("Server running on port") || output.includes("Listening on port")) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data: any) => {
      console.error("[Server stderr]:", data.toString());
    });

    serverProcess.on("error", (err: any) => {
      reject(err);
    });

    // Timeout fallback: if no stdout matching port start log is caught in 7 seconds, resolve anyway
    setTimeout(() => {
      if (!started) {
        console.log("Warning: Proceeding with tests without detecting explicit server start message.");
        resolve();
      }
    }, 7000);
  });
});

after(() => {
  console.log("Stopping backend server...");
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
});

test("GET /api/health returns status ok", async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.deepStrictEqual(data, { status: "ok" });
});

test("GET /api/matches returns a list of matches", async () => {
  const res = await fetch(`${BASE_URL}/api/matches`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.matches));
  assert.ok(data.matches.length > 0);
});

test("POST /api/register and POST /api/login flow", async () => {
  const uniqueUsername = `testuser_${Date.now()}`;
  const registerPayload = {
    username: uniqueUsername,
    fullName: "Test User",
    email: "test@astrobet.com",
    bankDetails: {
      bankName: "AstroBank",
      accountNumber: "1234567890",
      holderName: "Test User"
    }
  };

  // Register
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerPayload)
  });
  assert.strictEqual(regRes.status, 200);
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true);
  assert.strictEqual(regData.user.username, uniqueUsername);
  assert.strictEqual(regData.user.balance, 500); // initial balance

  // Login
  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: uniqueUsername })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true);
  assert.strictEqual(loginData.user.id, regData.user.id);
});

test("POST /api/matches creates a new match", async () => {
  const matchPayload = {
    homeTeam: "Test Team A",
    awayTeam: "Test Team B",
    homeFlag: "🏆",
    awayFlag: "⭐",
    oddsRatio: 2.5,
    startTime: "Hoy, 22:00"
  };

  const res = await fetch(`${BASE_URL}/api/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matchPayload)
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.match.homeTeam, "Test Team A");
  assert.strictEqual(data.match.awayTeam, "Test Team B");
  assert.strictEqual(data.match.oddsRatio, 2.5);
  
  // Verify it exists in the matches list
  const listRes = await fetch(`${BASE_URL}/api/matches`);
  const listData = await listRes.json();
  const created = listData.matches.find((m: any) => m.id === data.match.id);
  assert.ok(created);
  assert.strictEqual(created.homeTeam, "Test Team A");
});
