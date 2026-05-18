const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const inputDir = path.join(rootDir, "Input");
const assetsDir = path.join(rootDir, "assets");
const dataDir = path.join(rootDir, "data");
const outputDir = path.join(rootDir, "output");
const eventLogFile = path.join(outputDir, "tracking-events.jsonl");
const port = Number(process.env.PORT || 3000);

fs.mkdirSync(outputDir, { recursive: true });

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, function (error, content) {
    if (error) {
      send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, content, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
  });
}

function serveStaticFrom(res, baseDir, requestPath, prefix) {
  const relativePath = decodeURIComponent(requestPath.slice(prefix.length));
  const filePath = path.resolve(baseDir, relativePath);

  if (!filePath.startsWith(baseDir + path.sep)) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  serveFile(res, filePath);
}

function readRequestBody(req, callback) {
  let body = "";

  req.on("data", function (chunk) {
    body += chunk;

    if (body.length > 1024 * 1024) {
      req.destroy();
    }
  });

  req.on("end", function () {
    callback(body);
  });
}

function saveTrackingEvent(req, res) {
  readRequestBody(req, function (body) {
    let event;

    try {
      event = JSON.parse(body || "{}");
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        "Content-Type": "application/json; charset=utf-8"
      });
      return;
    }

    const record = {
      receivedAt: new Date().toISOString(),
      ip: req.socket.remoteAddress,
      userAgent: req.headers["user-agent"] || null,
      event
    };

    fs.appendFile(eventLogFile, JSON.stringify(record) + "\n", function (error) {
      if (error) {
        send(res, 500, JSON.stringify({ ok: false, error: "Cannot write event" }), {
          "Content-Type": "application/json; charset=utf-8"
        });
        return;
      }

      send(res, 204, "");
    });
  });
}

const server = http.createServer(function (req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/track") {
    saveTrackingEvent(req, res);
    return;
  }

  if (req.method !== "GET") {
    send(res, 405, "Method not allowed", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    serveFile(res, path.join(rootDir, "index.html"));
    return;
  }

  if (url.pathname === "/input/tracking.js") {
    serveFile(res, path.join(inputDir, "tracking.js"));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    serveStaticFrom(res, assetsDir, url.pathname, "/assets/");
    return;
  }

  if (url.pathname.startsWith("/data/")) {
    serveStaticFrom(res, dataDir, url.pathname, "/data/");
    return;
  }

  send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
});

server.listen(port, function () {
  console.log(`MarketHub is running at http://localhost:${port}`);
  console.log(`Events will be saved to ${eventLogFile}`);
});
