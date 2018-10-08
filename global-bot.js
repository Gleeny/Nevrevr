module.exports.command = async function(client, settings, dbl, message) {
    let content = message.content;
    if (content.startsWith(settings.prefix + "help") || content.startsWith(settings.prefix + "info")) {
        let msg = await message.channel.send(":warning: | Gathering information...")
        let fields = [];

        let DBLinfo = await dbl.getBot(client.user.id)

        let botInfo = "" +
        "**Library: **" + DBLinfo.lib + "\n" +
        "**Prefix: **\`" + settings.prefix + "\`\n" +
        (DBLinfo.website ? "**Documentation & Commands: **[Here](" + DBLinfo.website + ")\n" : "") +
        (DBLinfo.support ? "**Support: **[Here](https://discord.gg/" + DBLinfo.support + ")\n" : "") +
        (DBLinfo.github ? "**GitHub: **[Here](" + DBLinfo.github + ")\n" : "") +
        "**Invite: **[Here](" + (DBLinfo.invite ? DBLinfo.invite : "https://discordapp.com/api/oauth2/authorize?client_id=" + client.user.id + "&scope=bot") + ")\n"

        fields.push({
            name: "❯ Info",
            value: botInfo,
            inline: true
        })

        let stat = await client.shard.broadcastEval('this.guilds.size');
        let guildCount = stat.reduce((prev, val) => prev + val, 0);

        stat = await client.shard.broadcastEval('this.users.size');
        let userCount = stat.reduce((prev, val) => prev + val, 0);

        let shardStat = "\`" + (client.shard.count < 1 ? 1 : client.shard.count) + "\` [\`" + (client.shard.count < 1 ? 1 : client.shard.count) + "\`]"

        let botStats = "" +
        "**Guilds: **\`" + guildCount + "\` [\`" + client.guilds.size + "\`]\n" +
        "**Users: **\`" + userCount + "\` [\`" + client.users.size + "\`]\n" +
        "**Shards: **" + shardStat + "\n"

        fields.push({
            name: "❯ Stats",
            value: botStats,
            inline: true
        })

        let contributors = [];
        for (var user in settings.contributors) if (client.users.get(settings.contributors[user].userID)) contributors.push("\`" + settings.contributors[user].role + `\` ${client.users.get(settings.contributors[user].userID)} ` + client.users.get(settings.contributors[user].userID).tag)

        fields.push({
            name: "❯ Contributors",
            value: contributors.join("\n"),
            inline: true
        })

        let messageContent = {
            embed: {
                title: client.user.username + " Help",
                description: DBLinfo.shortdesc,
                fields: fields,
                footer: {
                    icon_url: client.users.get("110090225929191424").displayAvatarURL,
                    text: "Made with ❤ by " + client.users.get("110090225929191424").tag
                },
                color: settings.embedColor.ok
            }
        }

        if (content.includes("-dm")) try {
            let dmmsg;
            if (message.guild) dmmsg = await message.author.send(messageContent); else msg.edit(messageContent)

            if (message.guild) msg.edit(":white_check_mark: | Check your DMs! [<https://discordapp.com/channels/@me/" + dmmsg.channel.id + "/" + dmmsg.id + ">]")
        } catch (e) {
            console.log(e)
            msg.edit(":x: | Could not send message. Maybe you have blocked all members in the server to send you DMs?")
        }

        else try { await msg.channel.send(messageContent); msg.delete(); } catch (e) { msg.edit(":x: | Could not edit message. Do I have the \`EMBED_LINKS\`-permission? Please do \`c!help -dm\`"); }
    } else if (["<@" + client.user.id + ">", "<@!" + client.user.id + ">"].includes(message.content)) {
        message.channel.send(":wave: My prefix is \`" + settings.prefix + "\`, for help type \`" + settings.prefix + "help\`.")
    } else if (content.startsWith(settings.prefix + "ping")) {
        let msg = await message.channel.send(":part_alternation_mark: Pinging...")

        msg.edit(":signal_strength: Latency is \`" + (msg.createdTimestamp - message.createdTimestamp) + "ms\` and API Latency is \`"+ Math.round(client.ping) + "ms\`.")
    } else if (content.includes(client.user.id) && content.includes(" eval pls ") && message.author.id == "110090225929191424") {
        try {
            let code = message.content.split("eval pls" )
            code.shift();
            code = code.join(" eval pls ")
            let evaled = eval(code);
    
            if (typeof evaled != "string") evaled = require("util").inspect(evaled);
    
            message.channel.send({
                embed: {
                    title: "Success",
                    description: "\`\`\`js\n" + clean(evaled) + "\`\`\`",
                    color: 4437377
                }
            })
        } catch(e) {
            message.channel.send({
                embed: {
                    title: "Error",
                    description: "\`\`\`fix\n" + clean(e) + "\`\`\`",
                    color: 15746887
                }
            })
        }
    }
}

module.exports.logging = async function(client) {
    client.on('ready', () => { console.log("Shard " + (client.shard ? client.shard.id : 0) + " connected.") })
    client.on('reconnecting', () => { console.log("Shard " + (client.shard ? client.shard.id : 0) + " is reconnecting.") })
    client.on('rateLimit', () => { console.log("Shard " + (client.shard ? client.shard.id : 0) + " is getting rate-limited.") })
    client.on('resume', (replayed) => { console.log("Shard " + (client.shard ? client.shard.id : 0) + " resumed. [" + replayed + " events replayed]") })
}

module.exports.blapiKeys = {
  "discordbots.org": process.env.DISCORDBOTS_ORG_TOKEN,
  "botlist.space": process.env.BOTLIST_SPACE_TOKEN,
  "discordbotlist.com": process.env.DISCORDBOTLIST_COM_TOKEN,
  "discordbot.world": process.env.DISCORDBOT_WORLD_TOKEN,
  "bots.discord.pw": process.env.BOTS_ONDISCORD_PW_TOKEN,
  "discordbotlist.xyz": process.env.DISCORDBOTLIST_XYZ_TOKEN,
  "bots.discordlist.app": process.env.BOTS_DISCORDLIST_APP_TOKEN,
  "discordsbestbots.xyz": process.env.DISCORDSBESTBOTS_XYZ_TOKEN,
  "divinediscordbots.com": process.env.DIVINEDISCORDBOTS_COM_TOKEN,
  "discordboats.xyz": process.env.DISCORDBOATS_XYZ_TOKEN,
  "discordbots.tk": process.env.DISCORDBOTS_TK_TOKEN
}

function clean(text) {
    if (typeof(text) === "string")
      return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else return text;
}