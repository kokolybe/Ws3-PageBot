const
axios = require('axios'),
express = require('express'),
cron = require('node-cron'),
os = require('os'),
fs = require('fs'),
api = require('./ws3/api'),
app = express(),
VERIFY_TOKEN = 'ws3',
PASSWORD_ADMIN = process.env.pass || 'ws3',
PAGE_ACCESS_TOKEN = api.PAGE_ACCESS_TOKEN,
PORT = process.env.PORT || 3000

app.use(express.json());
app.use(express.static(__dirname + "/site"));
app.set("json spaces", 4);

[
["/", "index.html"]
].forEach(route => app.get(route[0], (req, res) => res.sendFile(__dirname + "/site/" + route[1])));

function getUptime() {
  const time = process.uptime();
  const hours = Math.floor(time / (60 * 60));
  const minutes = Math.floor((time % (60 * 60)) / 60);
  return `${hours} hours, ${minutes} minutes`;
}

app.get("/json", (req, res) => {
  return res.status(200).json({
    commands: api.commands,
    prefix: api.prefix,
    uptime: getUptime(),
    server: {
      cpu: os.cpus(),
      memory: `${os.freemem()+" MB"} available of ${os.totalmem()+" MB"}`
    }
  });
});

app.get("/restart", async (req, res) => {
  const {
    pass
  } = req.query;
  try {
  if (!pass)
  throw new Error("No password input.");
  else if (pass !== PASSWORD_ADMIN)
  throw new Error("Wrong password!");
  res.json({ status: "Restarting..."});
  process.exit(1);
  } catch(error) {
    res.json({
      error: error.message || error
    });
  }
});

app.get('/webhook', async (req, res) => {
  const mode = req.query["hub.mode"],
  token = req.query["hub.verify_token"],
  challenge = req.query["hub.challenge"];
  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Successfully verified the webhook");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("403_FORBIDDEN");
    }
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    body.entry.forEach(async entry => entry.messaging.forEach(async event => require('./ws3/listenMessage')(event, PAGE_ACCESS_TOKEN)));
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.status(404).send("404_NOTFOUND");
  }
});
