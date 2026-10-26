#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const nodeCommand = process.execPath;
const nestCommand = join(root, "backend", "node_modules", "@nestjs", "cli", "bin", "nest.js");
const viteCommand = join(root, "frontend", "node_modules", "vite", "bin", "vite.js");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Inicia o NestJS e o Vite em paralelo. Execute `node setup.mjs` primeiro.");
  process.exit(0);
}

const requiredPaths = [
  nestCommand,
  viteCommand,
];
const missing = requiredPaths.filter((path) => !existsSync(path));
if (missing.length) {
  console.error("Dependencias ausentes. Execute `node setup.mjs` na raiz do projeto primeiro.");
  process.exit(1);
}

const services = [
  {
    name: "NestJS",
    command: nodeCommand,
    args: [nestCommand, "start", "--watch"],
    cwd: join(root, "backend"),
  },
  {
    name: "Vite",
    command: nodeCommand,
    args: [viteCommand, "--host", "0.0.0.0"],
    cwd: join(root, "frontend"),
  },
];
const children = [];
let stopping = false;

function stopChildren(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    if (isWindows) {
      spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      try {
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    }
  }
}

for (const service of services) {
  console.log(`Iniciando ${service.name}...`);
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: "inherit",
    detached: !isWindows,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(`Falha ao iniciar ${service.name}: ${error.message}`);
    process.exitCode = 1;
    stopChildren();
  });
  child.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(`${service.name} encerrou (${signal || `codigo ${code}`}); encerrando o outro servico.`);
    process.exitCode = code || 1;
    stopChildren();
  });
}

process.on("SIGINT", () => {
  console.log("\nEncerrando NestJS e Vite...");
  stopChildren("SIGINT");
});
process.on("SIGTERM", () => stopChildren("SIGTERM"));
