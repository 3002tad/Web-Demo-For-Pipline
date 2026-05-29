const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const env = require("../../config/env");

function programFilesPath(...parts) {
  return path.join(process.env.ProgramFiles || "C:\\Program Files", ...parts);
}

function resolveErlangHome() {
  if (process.env.ERLANG_HOME && fs.existsSync(process.env.ERLANG_HOME)) {
    return process.env.ERLANG_HOME;
  }

  const defaultPath = programFilesPath("Erlang OTP");
  return fs.existsSync(defaultPath) ? defaultPath : "";
}

function resolveRabbitmqSbin() {
  if (process.env.RABBITMQ_SBIN && fs.existsSync(process.env.RABBITMQ_SBIN)) {
    return process.env.RABBITMQ_SBIN;
  }

  const root = programFilesPath("RabbitMQ Server");
  if (!fs.existsSync(root)) return "";

  const versions = fs.readdirSync(root)
    .filter((name) => name.startsWith("rabbitmq_server-"))
    .sort();
  const latest = versions[versions.length - 1];
  return latest ? path.join(root, latest, "sbin") : "";
}

function commandEnv() {
  const erlangHome = resolveErlangHome();
  const rabbitmqSbin = resolveRabbitmqSbin();
  return {
    ...process.env,
    ERLANG_HOME: erlangHome || process.env.ERLANG_HOME,
    PATH: [
      erlangHome ? path.join(erlangHome, "bin") : "",
      rabbitmqSbin,
      process.env.PATH
    ].filter(Boolean).join(path.delimiter)
  };
}

function runBat(fileName, args = [], timeout = 30000) {
  const rabbitmqSbin = resolveRabbitmqSbin();
  if (!rabbitmqSbin) {
    return Promise.reject(new Error("RabbitMQ sbin directory was not found"));
  }

  const filePath = path.join(rabbitmqSbin, fileName);
  return new Promise((resolve, reject) => {
    execFile("cmd.exe", ["/c", filePath, ...args], {
      env: commandEnv(),
      timeout,
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function shouldManageLocalRabbitMQ() {
  return env.rabbitmqManageLocal && process.platform === "win32";
}

async function awaitRabbitMQ() {
  await runBat("rabbitmqctl.bat", ["await_startup"], 60000);
}

async function startLocalRabbitMQ() {
  if (!shouldManageLocalRabbitMQ()) return;

  try {
    await runBat("rabbitmq-service.bat", ["start"], 30000).catch(() => null);
    await awaitRabbitMQ();
    console.log("Local RabbitMQ is running");
    return;
  } catch (serviceError) {
    console.warn(`RabbitMQ service start/await failed: ${serviceError.message}`);
  }

  await runBat("rabbitmq-server.bat", ["-detached"], 30000);
  await awaitRabbitMQ();
  console.log("Local RabbitMQ started in detached mode");
}

async function stopLocalRabbitMQ() {
  if (!shouldManageLocalRabbitMQ()) return;

  try {
    await runBat("rabbitmqctl.bat", ["stop"], 30000);
    console.log("Local RabbitMQ stopped");
  } catch (error) {
    console.warn(`Could not stop local RabbitMQ automatically: ${error.message}`);
  }
}

module.exports = { startLocalRabbitMQ, stopLocalRabbitMQ };
