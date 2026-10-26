#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const root = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const args = new Set(process.argv.slice(2));

function usage() {
  console.log(`SkillBridge setup

Uso:
  node setup.mjs                 Instala dependencias, configura envs e prepara MySQL
  node setup.mjs --no-install    Pula npm install
  node setup.mjs --help          Exibe esta ajuda

Requisitos: Node.js 20.19+ ou 22.12+, npm e um servidor MySQL acessivel.`);
}

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1); }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function envLine(name, value) {
  return `${name}=${JSON.stringify(String(value))}`;
}

function askFactory() {
  const readline = createInterface({ input: stdin, output: stdout });
  return {
    async ask(label, defaultValue = "") {
      const suffix = defaultValue ? ` [${defaultValue}]` : "";
      const answer = (await readline.question(`${label}${suffix}: `)).trim();
      return answer || defaultValue;
    },
    async confirm(label, defaultValue = true) {
      const suffix = defaultValue ? " [S/n]" : " [s/N]";
      const answer = (await readline.question(`${label}${suffix}: `)).trim().toLowerCase();
      if (!answer) return defaultValue;
      return ["s", "sim", "y", "yes"].includes(answer);
    },
    close() { readline.close(); },
  };
}

function runNpmInstall(cwd) {
  console.log(`\nInstalando dependencias em ${cwd === root ? "." : cwd.slice(root.length + 1)}...`);
  const command = isWindows ? "cmd.exe" : npmCommand;
  const installArgs = ["install", "--no-audit", "--no-fund"];
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", `npm ${installArgs.join(" ")}`]
    : installArgs;
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`npm install falhou em ${cwd}.`);
}

function readExistingEnv(path) {
  return existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
}

async function configureBackendEnv(asker) {
  const path = join(root, "backend", ".env");
  const existing = readExistingEnv(path);
  const writeConfig = !existsSync(path) || await asker.confirm("backend/.env ja existe. Deseja substitui-lo?", false);
  if (!writeConfig) {
    console.log("Usando as configuracoes existentes em backend/.env.");
    return {
      DB_HOST: existing.DB_HOST || "localhost",
      DB_PORT: existing.DB_PORT || "3306",
      DB_USER: existing.DB_USER || "root",
      DB_PASSWORD: existing.DB_PASSWORD || "",
      DB_NAME: existing.DB_NAME || "skillbridge",
      PORT: existing.PORT || "3000",
      JWT_SECRET: existing.JWT_SECRET || randomBytes(48).toString("base64url"),
    };
  }

  const config = {
    DB_HOST: await asker.ask("Host MySQL", existing.DB_HOST || "localhost"),
    DB_PORT: await asker.ask("Porta MySQL", existing.DB_PORT || "3306"),
    DB_USER: await asker.ask("Usuario MySQL", existing.DB_USER || "root"),
    DB_PASSWORD: await asker.ask("Senha MySQL", existing.DB_PASSWORD || ""),
    DB_NAME: await asker.ask("Nome do banco SkillBridge", existing.DB_NAME || "skillbridge"),
    PORT: await asker.ask("Porta da API NestJS", existing.PORT || "3000"),
    JWT_SECRET: randomBytes(48).toString("base64url"),
  };
  if (!/^\d+$/.test(config.DB_PORT) || !/^\d+$/.test(config.PORT)) {
    throw new Error("As portas do MySQL e da API precisam ser numeros inteiros.");
  }
  if (!/^[A-Za-z0-9_]+$/.test(config.DB_NAME)) {
    throw new Error("O nome do banco pode conter apenas letras, numeros e underscore.");
  }

  writeFileSync(path, `${Object.entries(config).map(([key, value]) => envLine(key, value)).join("\n")}\n`, { mode: 0o600 });
  console.log("Arquivo backend/.env criado. JWT_SECRET foi gerado automaticamente.");
  return config;
}

function normalizeApiUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("A URL da API precisa ser uma URL http(s) valida."); }
  if (!["http:", "https:"].includes(url.protocol) || url.search || url.hash) {
    throw new Error("Use uma URL http(s) sem query string ou fragmento.");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/api`.replace(/\/api\/api$/, "/api");
  return url.toString().replace(/\/$/, "");
}

async function configureFrontendEnv(asker, backendPort) {
  const path = join(root, "frontend", ".env.local");
  const existing = readExistingEnv(path);
  const writeConfig = !existsSync(path) || await asker.confirm("frontend/.env.local ja existe. Deseja substitui-lo?", false);
  if (!writeConfig) {
    console.log("Usando as configuracoes existentes em frontend/.env.local.");
    return existing.VITE_API_URL || "http://localhost:3000/api";
  }

  const defaultUrl = existing.VITE_API_URL || `http://localhost:${backendPort}/api`;
  const apiUrl = normalizeApiUrl(await asker.ask("URL base da API NestJS (deve terminar em /api)", defaultUrl));
  writeFileSync(path, `${envLine("VITE_API_URL", apiUrl)}\n`, { mode: 0o600 });
  console.log("Arquivo frontend/.env.local criado.");
  return apiUrl;
}

async function createDatabaseAndApplySchema(config) {
  if (!/^[A-Za-z0-9_]+$/.test(config.DB_NAME)) {
    throw new Error("DB_NAME pode conter apenas letras, numeros e underscore.");
  }
  if (!/^\d+$/.test(config.DB_PORT)) throw new Error("DB_PORT precisa ser um numero inteiro.");
  const requireFromBackend = createRequire(join(root, "backend", "package.json"));
  const { createConnection } = requireFromBackend("mysql2/promise");
  const schema = readFileSync(join(root, "skillbridge.sql"), "utf8");
  if (/drop\s+database/i.test(schema)) throw new Error("O schema ainda contem DROP DATABASE; setup cancelado por seguranca.");

  console.log(`\nConectando ao MySQL em ${config.DB_HOST}:${config.DB_PORT}...`);
  const connection = await createConnection({
    host: config.DB_HOST,
    port: Number(config.DB_PORT),
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    connectTimeout: 15_000,
    multipleStatements: true,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.changeUser({ database: config.DB_NAME });
    await connection.query(schema);
    console.log(`Schema aplicado sem apagar dados existentes em ${config.DB_NAME}.`);

    console.log(`Schema aplicado sem apagar dados existentes em ${config.DB_NAME}.`);
  } finally {
    await connection.end();
  }
}

async function main() {
  if (args.has("--help") || args.has("-h")) {
    usage();
    return;
  }

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const nodeMinor = Number(process.versions.node.split(".")[1]);
  if (nodeMajor < 20 || nodeMajor === 21 || (nodeMajor === 20 && nodeMinor < 19) || (nodeMajor === 22 && nodeMinor < 12)) {
    throw new Error("Este projeto requer Node.js 20.19+ ou 22.12+.");
  }

  const asker = askFactory();
  try {
    if (!args.has("--no-install")) {
      runNpmInstall(join(root, "backend"));
      runNpmInstall(join(root, "frontend"));
    }

    const backendConfig = await configureBackendEnv(asker);
    const apiUrl = await configureFrontendEnv(asker, backendConfig.PORT);
    console.log(`Frontend configurado para consumir ${apiUrl}.`);
    await createDatabaseAndApplySchema(backendConfig);
    console.log("\nSetup concluido. Inicie tudo com `node run.mjs`.");
  } finally {
    asker.close();
  }
}

main().catch((error) => {
  console.error(`\nSetup interrompido: ${error.message}`);
  process.exitCode = 1;
});
