const Discord = require('discord.js');
const fs = require('fs');
const DBL = require('dblapi.js');
const Listcord = require('listcord');

const client = new Discord.Client({ disableEveryone: true })
const dbl = new DBL(require('./_TOKEN.js').DBL_TOKEN, client)
const listcord = new Listcord.Client(require('./_TOKEN.js').LISTCORD_TOKEN)

let i_have_never, i_have;

client.on('ready', () => {
    console.log("Ready!")

    client.user.setActivity("n!info (" + fs.readFileSync('./_questions.txt') + " questions asked) [" + (client.shard.id == 0 ? "1" : client.shard.id) + "/" + client.shard.count + "]", { type: "WATCHING" })
    
    setInterval(() => {
        client.user.setActivity("n!info (" + fs.readFileSync('./_questions.txt') + " questions asked) [" + (client.shard.id == 0 ? "1" : client.shard.id) + "/" + client.shard.count + "]", { type: "WATCHING" })
    }, 60000)

    postStats(client)
    setInterval(() => { postStats(client) }, 900000)

    i_have_never = client.guilds.get('471770945800110093').emojis.find("name", "i_have_never");
    i_have = client.guilds.get('471770945800110093').emojis.find("name", "i_have")
})

async function postStats(client) {
    dbl.postStats(client.guilds.size, client.shard.id, client.shard.count).then().catch(console.log);
    const counts = await client.shard.broadcastEval('this.guilds.size')
    listcord.postStats(client.user.id, counts.reduce((prev, val) => prev + val, 0), client.shard.count).then().catch(console.log);
}

client.on('message', async message => {
    let content = message.content.toLowerCase();

    if (message.author.bot) return;
    
    if (!message.guild) return message.channel.send(":x: This bot can only be used in guilds. If you want to read more, please go to our Discordbots.org-page: https://discordbots.org/bot/475041313515896873") // dms

    if (content.startsWith("n!info") || content.startsWith("n!help")) {
        return message.channel.send("**Please go to our Discordbots.org-page to read more about the bot: **https://discordbots.org/bot/475041313515896873" + "\n(DiscordBots hasn't accepted my bot yet, please visit the GitHub-page instead: <https://github.com/Gleeny/Nevrevr>)")
    } else if (content.startsWith("n!list")) {
        let list = [];
        async function getContent(dir, x = "") {
            fs.readdirSync(dir).forEach(async file => {
                if (file.endsWith(".txt")) list.push(x + file.replace(".txt", "")); else await getContent(dir + "/" + file, file + "/");
            })
        }

        await getContent('./_collection/_en');

        return message.channel.send({
            embed: {
                title: "Category List",
                description: "To get a question from a category, simply run \`n!<category>\`\n\n- \`" + list.join("\`\n- \`") + "\`",
                color: message.guild.me.displayColor ? message.guild.me.displayColor : 3553599
            }
        })
    } else if (content.startsWith("n!") && fs.existsSync('./_collection/_en/' + content.replace("n!", "") + '.txt')) {
        if (content.startsWith("n!nsfw/") && !message.channel.nsfw) return message.channel.send({
            embed: {
                title: "This command is restricted to NSFW-channels only.",
                image: {
                    url: "https://i.imgur.com/oe4iK5i.gif"
                },
                color: message.guild.me.displayColor ? message.guild.me.displayColor : 3553599
            }
        })

        let collection = fs.readFileSync('./_collection/_en/' + content.replace("n!", "") + '.txt', 'utf8').split('\r\n') // for some reason, it has \r as well as \n
        let collection_lang = fs.readFileSync('./_collection/' + getLanguage(message.guild.id) + '/' + content.replace("n!", "") + '.txt', 'utf8').split('\r\n')
        let random = Math.floor(Math.random() * collection.length)
        while (collection[random].includes("[D]")) random = Math.floor(Math.random() * collection.length);
        let statistics = JSON.parse(fs.readFileSync('./_statistics.json', 'utf8'));
        if (!statistics[content.replace("n!", "")]) { statistics[content.replace("n!", "")] = {}; }
        if (!statistics[content.replace("n!", "")][random]) { statistics[content.replace("n!", "")][random] = [0, 0]; fs.writeFileSync('./_statistics.json', JSON.stringify(statistics, null, 4), 'utf8') }

        message.channel.send({
            embed: {
                author: {
                    name: message.author.tag + " (" + message.author.id + ")",
                    icon_url: message.author.avatarURL
                },
                description: collection_lang[random] ? collection_lang[random] : (collection[random] + "\n(Not translated :/)"),
                color: message.guild.me.displayColor ? message.guild.me.displayColor : 3553599,
                footer: {
                    text: "ID: " + content.replace("n!", "").toUpperCase() + "#" + random
                }
            }
        }).then(msg => {
            fs.writeFileSync('./_questions.txt', parseInt(fs.readFileSync('./_questions.txt')) + 1) // log it, so we can use it in the rich presence

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

                msg.channel.send({
                    embed: {
                        author: {
                            name: message.author.tag + " (" + message.author.id + ")",
                            icon_url: message.author.avatarURL
                        },
                        description: collection_lang[random] ? collection_lang[random] : (collection[random] + "\n(Not translated :/)"),
                        color: message.guild.me.displayColor ? message.guild.me.displayColor : 3553599,
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

                msg.delete();

            })
        })
    } else if (content.startsWith("n!stats")) {
        if (content == "n!stats") return message.channel.send("**Wrong usage!** Please use the following format: \`n!stats <question id>\` (Ex. n!stats FOOD#4 - You can find the question ID whenever the bot sends a NHIE-question.)")
        let args = content.replace("n!stats ", "").split(" ");
        let category = args[0].split("#")[0].toLowerCase();
        let line = parseInt(args[0].split("#")[1]);
        if (!line) return message.channel.send("**Wrong usage!** Please use the following format: \`n!stats <question id>\` (Ex. n!stats FOOD#4 - You can find the question ID whenever the bot sends a NHIE-question.)")
        
        let statistics = JSON.parse(fs.readFileSync('./_statistics.json', 'utf8'));
        if (!statistics[category]) { statistics[category] = {}; }

        if (!fs.existsSync('./_collection/_en/' + category + '.txt')) return message.channel.send("**Category does not exist.** Please check \`n!list\` for a list of categories.")

        let collection = fs.readFileSync('./_collection/_en/' + category + '.txt', 'utf8').split('\r\n'); 
        let collection_lang = fs.readFileSync('./_collection/' + getLanguage(message.guild.id) + '/' + content.replace("n!", "") + '.txt', 'utf8').split('\r\n')
        let question = collection_lang[line] ? collection_lang[line] : (collection[line] + "\n(Not translated :/)")

        if (!question) return message.channel.send("**Question does not exist.** Please choose a number between 0 and " + collection.length);

        let ratio = statistics[category][line];
        if (!ratio) return message.channel.send("**This question has no statistics.** This is probably because the question has never been asked in any server.");

        message.channel.send({
            embed: {
                title: "Statistics",
                description: question,
                color: message.guild.me.displayColor ? message.guild.me.displayColor : 3553599,
                fields: [
                    {
                        name: `${i_have_never} I HAVE NEVER`,
                        value: ratio[0],
                        inline: true
                    },
                    {
                        name: `${i_have} I HAVE`,
                        value: ratio[1],
                        inline: true
                    }
                ]
            }
        })
    } else if (content.startsWith("n!language")) {
        if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(":x: You don't have permission!");
        let args = content.replace("n!language ", "").split(" ");
        let languages = fs.readdirSync('./_collection/').filter(m => !m.startsWith("_"))
        if (content == "n!language") return message.channel.send({
            embed: {
                title: "Available Languages",
                description: "To set the language you want for your server, type \`n!language <language>\`\n\n- \`en (default)\`\n- \`" + languages.join("\`\n- \`") + "\`",
                color: message.guild.me.displayColor ? message.guild.me.displayColor : 3553599
            }
        })

        console.log(languages)
        console.log(args)
        if (!languages.includes(args[0]) && args[0] != "en") return message.channel.send("**Could not find language.** Get a list of supported languages by typing \`n!language\`. If you want to translate your language, head on over to the support server!");

        if (args[0] == "en") setLanguage(message.guild.id, ""); else setLanguage(message.guild.id, args[0]);
        return message.channel.send("**Language updated.** Try it out!")
    }
});

function setLanguage(guildid, language) {
    let file = JSON.parse(fs.readFileSync('./_guilds.json'))
    if (!file[guildid]) file[guildid] = {}

    file[guildid].language = language;

    fs.writeFileSync('./_guilds.json', JSON.stringify(file))
}

function getLanguage(guildid) {
    let file = JSON.parse(fs.readFileSync('./_guilds.json'))
    if (!file[guildid]) file[guildid] = {}
    if (!file[guildid].language) file[guildid].language = "";

    return file[guildid].language != "" ? file[guildid].language : "_en";
}

client.login(require("./_TOKEN.js").TOKEN)