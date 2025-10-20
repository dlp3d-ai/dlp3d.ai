// server.js
const { createServer } = require("https");
const { readFileSync } = require("fs");
const next = require("next");

const port = 443;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync("./ssl/key.pem"),
  cert: readFileSync("./ssl/cert.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Ready`);
  });
});