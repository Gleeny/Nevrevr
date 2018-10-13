const Discord = require('discord.js')
const globalCode = require("require-from-url/sync")("https://gleeny.github.io/files/global-bot.js"); // includes commands that are not part of the bot concept, ex. ping, help, eval. Also includes advanced logging, BLAPI keys and more.

const manager = new Discord.ShardingManager('./app.js', { totalShards: "auto", respawn: true, token: process.env.DISCORD_TOKEN })

manager.spawn();
manager.on('launch', shard => console.log("Shard " + shard.id + " starting."));

globalCode.pingPong();