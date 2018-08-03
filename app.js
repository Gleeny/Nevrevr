const Discord = require('discord.js');
const fs = require('fs');
const DBL = require('dblapi.js');
const Listcord = require('listcord');

const client = new Discord.Client({ disableEveryone: true })
// const dbl = new DBL(require('./_TOKEN.js').DBL_TOKEN, client)
// const listcord = new Listcord.Client(require('./_TOKEN.js').LISTCORD_TOKEN)

const nsfw = [ 'dirty' ]

client.on('ready', () => {
    console.log("Ready!")

    client.user.setActivity("n!info (" + fs.readFileSync('./_questions.txt') + " questions asked) [" + (client.shard.id == 0 ? "1" : client.shard.id) + "/" + client.shard.count + "]", { type: "WATCHING" })
    
    setInterval(() => {
        client.user.setActivity("n!info (" + fs.readFileSync('./_questions.txt') + " questions asked) [" + (client.shard.id == 0 ? "1" : client.shard.id) + "/" + client.shard.count + "]", { type: "WATCHING" })
    }, 60000)

    // postStats(client)
    // setInterval(() => { postStats(client) }, 900000)
})

async function postStats(client) {
    dbl.postStats(client.guilds.size, client.shard.id, client.shard.count).then().catch(console.log);
    const counts = await client.shard.broadcastEval('this.guilds.size')
    listcord.postStats(client.user.id, counts.reduce((prev, val) => prev + val, 0), client.shard.count).then().catch(console.log);
}

client.on('message', async message => {
    let content = message.content;

    if (message.author.bot) return;
    
    if (!message.guild) return message.channel.send(":x: This bot can only be used in guilds. If you want to read more, please go to our Discordbots.org-page: https://discordbots.org/bot/475041313515896873") // dms

    if (content.startsWith("n!info") || content.startsWith("n!help")) {
        return message.channel.send("**Please go to our Discordbots.org-page to read more about the bot: **https://discordbots.org/bot/475041313515896873")
    } else if (content.startsWith("n!") && fs.existsSync('./_collection/' + content.replace("n!", "") + '.txt')) {
        if (nsfw.includes(content.replace("n!", "").toLowerCase()) && !message.channel.nsfw) return message.channel.send({
            embed: {
                title: "This command is restricted to NSFW-channels only.",
                image: {
                    url: "https://i.imgur.com/oe4iK5i.gif"
                },
                color: message.guild.me.displayColor
            }
        })

        let collection = fs.readFileSync('./_collection/' + content.replace("n!", "") + '.txt', 'utf8').split('\r\n') // for some reason, it has \r as well as \n
        let random = Math.floor(Math.random() * collection.length)
        let statistics = JSON.parse(fs.readFileSync('./_statistics.json', 'utf8'));
        if (!statistics[content.replace("n!", "")]) { statistics[content.replace("n!", "")] = {}; }
        if (!statistics[content.replace("n!", "")][random]) { statistics[content.replace("n!", "")][random] = [0, 0]; fs.writeFileSync('./_statistics.json', JSON.stringify(statistics, null, 4), 'utf8') }

        message.channel.send({
            embed: {
                author: {
                    name: message.author.tag + " (" + message.author.id + ")",
                    icon_url: message.author.avatarURL
                },
                description: collection[random],
                color: message.guild.me.displayColor,
                footer: {
                    text: "ID: " + content.replace("n!", "").toUpperCase() + "#" + random
                }
            }
        }).then(msg => {
            fs.writeFileSync('./_questions.txt', parseInt(fs.readFileSync('./_questions.txt')) + 1) // log it, so we can use it in the rich presence

            let i_have_never = client.guilds.get('471770945800110093').emojis.find("name", "i_have_never");
            let i_have = client.guilds.get('471770945800110093').emojis.find("name", "i_have")

            msg.react(i_have_never).then(() => { msg.react(i_have) })

            msg.awaitReactions((reaction, user) => !user.bot && (i_have_never.id == reaction.emoji.id || i_have.id == reaction.emoji.id), { time: 30000 }).then(reactions => {

                let stats = [0, 0];
                reactions.forEach(reaction => {
                    if (reaction._emoji.id == i_have_never.id) {
                        stats[0] += reaction.count - 1;
                    } else if (reaction._emoji.id == i_have.id) {
                        stats[1] += reaction.count - 1;
                    }
                })

                // to gather new information from the statistics-file, we make fs give us it again.
                let statistics = JSON.parse(fs.readFileSync('./_statistics.json', 'utf8'));
                let ratio = statistics[content.replace("n!", "")][random];
                ratio[0] += stats[0];
                ratio[1] += stats[1];
                fs.writeFileSync('./_statistics.json', JSON.stringify(statistics, null, 4), 'utf8') // since it saves in real time, no data will be lost.

                msg.clearReactions();

                msg.edit({
                    embed: {
                        author: {
                            name: message.author.tag + " (" + message.author.id + ")",
                            icon_url: message.author.avatarURL
                        },
                        description: collection[random],
                        color: message.guild.me.displayColor,
                        footer: {
                            text: "ID: " + content.replace("n!", "").toUpperCase() + "#" + random
                        },
                        fields: [
                            {
                                name: `${i_have_never} I HAVE NEVER`,
                                value: stats[0] + " (Global: " + ratio[0] + ")",
                                inline: true
                            },
                            {
                                name: `${i_have} I HAVE`,
                                value: stats[1] + " (Global: " + ratio[1] + ")",
                                inline: true
                            }
                        ]
                    }
                })

            })
        })
    }
});

client.login(require("./_TOKEN.js").TOKEN)