const Discord = require('discord.js')
const manager = new Discord.ShardingManager('./app.js', { totalShards: "auto", respawn: true, token: require("./_TOKEN.js").TOKEN })

manager.spawn();
manager.on('launch', shard => console.log("Shard " + shard.id + " launching..."));