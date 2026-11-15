import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || new URL(testUrl).pathname !== "/clinic_test")
  throw new Error(
    "TEST_DATABASE_URL must target a dedicated database named clinic_test; this suite deletes its data.",
  );
const env = { ...process.env, DATABASE_URL: testUrl, NODE_ENV: "test" };
for (const args of [
  ["prisma", "migrate", "deploy"],
  [
    "vitest",
    "run",
    "tests/integration",
    "--maxWorkers=1",
    "--no-file-parallelism",
  ],
]) {
  const result = spawnSync("npx", args, {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
