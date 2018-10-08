const Discord = require('discord.js')
const fs = require("fs");

const manager = new Discord.ShardingManager('./app.js', { totalShards: "auto", respawn: true, token: process.env.DISCORD_TOKEN })

manager.spawn();
manager.on('launch', shard => console.log("Shard " + shard.id + " starting."));

require("./ping-pong.js").load()