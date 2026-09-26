import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { once } from "node:events";
import { before, after, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
let server;
let baseUrl;

before(
  async () => {
    assert.ok(
      existsSync(".next/BUILD_ID"),
      "Run pnpm build before pnpm test; these checks exercise the production app.",
    );
    const portProbe = createServer();
    portProbe.listen(0, "127.0.0.1");
    await once(portProbe, "listening");
    const port = portProbe.address().port;
    await new Promise((resolve) => portProbe.close(resolve));
    baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(
      process.execPath,
      [
        require.resolve("next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        stdio: "ignore",
        windowsHide: true,
        env: {
          ...process.env,
          NODE_ENV: "production",
          NEXT_TELEMETRY_DISABLED: "1",
        },
      },
    );
    let startError;
    server.on("error", (error) => {
      startError = error;
    });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (startError) throw startError;
      if (server.exitCode !== null)
        throw new Error("Production server exited before becoming ready.");
      try {
        const response = await fetch(`${baseUrl}/login`);
        if (response.ok) return;
      } catch {
        /* Server is starting. */
      }
      await setTimeout(200);
    }
    throw new Error("Production server did not become ready.");
  },
  { timeout: 30000 },
);

after(async () => {
  if (server && server.exitCode === null) {
    const exited = once(server, "exit");
    server.kill();
    await exited;
  }
});

test("root redirects to the workspace", async () => {
  const response = await fetch(baseUrl, { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/dashboard");
});

test("unauthenticated workspace access redirects to /login", async () => {
  const response = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.ok(response.headers.get("location")?.includes("/login"));
});

test("login page renders with baseline security headers and branding", async () => {
  const response = await fetch(`${baseUrl}/login`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-powered-by"), null);
  const html = await response.text();
  assert.match(html, /Dynamatrix Flow/);
  assert.match(html, /Sign In to Workspace/);
  assert.match(html, /Employee ID/);
  assert.doesNotMatch(html, /postgresql:\/\/|passwordHash|DATABASE_URL/);
});

test("unimplemented private routes and unknown URLs return a generic 404", async () => {
  for (const path of [
    "/unknown-path-98765",
    "/api/unknown-endpoint",
    "/not-a-page",
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, path);
    assert.match(await response.text(), /Page not found/);
  }
});
