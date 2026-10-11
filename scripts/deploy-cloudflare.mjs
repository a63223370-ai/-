import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(readFileSync(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"));
const database = config.d1_databases?.find((item) => item.binding === "DB");
if (!database || database.database_id === "00000000-0000-4000-8000-000000000000") {
  throw new Error("Create a D1 database and set CLOUDFLARE_D1_ID in build variables, then rebuild.");
}
const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const schema = readFileSync(new URL("../drizzle/0000_marvelous_leopardon.sql", import.meta.url), "utf8")
  .replace("CREATE TABLE `invitations`", "CREATE TABLE IF NOT EXISTS `invitations`");
// Initialize a new database without deleting records on subsequent deployments.
for (const args of [
  ["d1", "execute", "DB", "--remote", "--config", "dist/server/wrangler.json", "--command", schema],
  ["deploy", "--config", "dist/server/wrangler.json"],
]) {
  const result = spawnSync(process.execPath, [wrangler, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
