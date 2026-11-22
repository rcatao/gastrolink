import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function readB64(relative) {
  const direct = join(root, relative);
  if (existsSync(direct)) return readFileSync(direct, "utf8");
  let joined = "";
  for (const suffix of [".aa", ".ab", ".ac"]) {
    const part = direct + suffix;
    if (existsSync(part)) joined += readFileSync(part, "utf8");
  }
  return joined;
}

const jobs = [
  ["assets/images/caseira.jpg.b64", "public/images/caseira.jpg"],
  ["assets/images/burger.jpg.b64", "public/images/burger.jpg"],
  ["assets/images/pizza.jpg.b64", "public/images/pizza.jpg"],
  ["assets/images/cafe.jpg.b64", "public/images/cafe.jpg"],
  ["assets/images/japones.jpg.b64", "public/images/japones.jpg"],
  ["assets/images/sala.jpg.b64", "public/images/sala.jpg"],
  ["assets/og.jpg.b64", "public/og.jpg"],
];

for (const [source, target] of jobs) {
  const payload = readB64(source).replace(/\s+/g, "");
  if (!payload) continue;
  const to = join(root, target);
  if (existsSync(to)) {
    const current = readFileSync(to);
    if (current.length > 2 && current[0] === 0xff && current[1] === 0xd8) continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, Buffer.from(payload, "base64"));
}
