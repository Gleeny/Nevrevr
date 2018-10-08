module.exports.load = () => {
  const http = require('http');
  const express = require('express');
  const app = express();
  app.get("/", (request, response) => {
    response.sendStatus(200);
    console.log("[ping received]")
  });
  app.listen(process.env.PORT);
  setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
  }, 280000);
}

// This service is also getting pinged using UptimeRobot.