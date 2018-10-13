const Discord = require('discord.js');
const fs = require('fs');
const DBL = require('dblapi.js');
const BLAPI = require("blapi")
const fetch = require("node-fetch");

const client = new Discord.Client({ disableEveryone: true })
const dbl = new DBL(process.env.DISCORDBOTS_ORG_TOKEN, client)

const settings = JSON.parse(fs.readFileSync('./settings.json'))
const database = require("./database.js")

const globalCode = require("require-from-url/sync")("https://gleeny.github.io/files/global-bot.js"); // includes commands that are not part of the bot concept, ex. ping, help, eval. Also includes advanced logging, BLAPI keys and more.

const i_have = "💡";
const i_have_never = "💣";

client.on('ready', async () => {
    
  updateActivity();
  setInterval(() => {
    updateActivity();
  }, 60000)
    
  BLAPI.handle(client, globalCode.blapiKeys, 1);
})

async function updateActivity() {
  let global = await database.getGlobal()
  client.user.setActivity("n!info (" + global.questionsTotal + " questions asked) [" + (client.shard.id == 0 ? "1" : client.shard.id) + "/" + client.shard.count + "]", { type: "WATCHING" })
}

client.on('message', async message => {
    let content = message.content.toLowerCase();

    if (message.author.bot) return;
    
    if (!message.guild) if (globalCode) return globalCode.command(client, settings, dbl, message); else return;
    
    if (content.startsWith("n!list")) {
      let botMsg = await message.channel.send({
        embed: {
          title: "Fetching category list...",
          color: settings.embedColor.warn
        }
      })
      
      let collections = await getCollections();
      
      botMsg.edit({
            embed: {
                title: "Category List",
                description: "To get a question from a category, simply run \`n!<category>\`\n\n- \`" + collections.join("\`\n- \`") + "\`",
                color: settings.embedColor.ok
            }
        });
    } else if (content.startsWith("n!stats")) {
        if (content == "n!stats") return message.channel.send("**Wrong usage!** Please use the following format: \`n!stats <question id>\` (Ex. n!stats FOOD#4 - You can find the question ID whenever the bot sends a NHIE-question.)")
        let args = content.replace("n!stats ", "").split(" ");
        let category = args[0].split("#")[0].toLowerCase();
        let line = parseInt(args[0].split("#")[1]);
        if (!line) return message.channel.send("**Wrong usage!** Please use the following format: \`n!stats <question id>\` (Ex. n!stats FOOD#4 - You can find the question ID whenever the bot sends a NHIE-question.)")

        let collections = await getCollections();
        if (!collections.includes(category)) return message.channel.send("**Category does not exist.** Please check \`n!list\` for a list of categories.")
      
        let language = getLanguage(message.guild.id)
      
        let collection = await getCollection(category);
        let collection_lang = await getCollection(category, language);
        let question = collection_lang[line] ? collection_lang[line] : (collection[line] + "\n[\`Help us translate!\`](https://github.com/Gleeny/Nevrevr/blob/master/collection)")

        if (!question) return message.channel.send("**Question does not exist.** Please choose a number between 0 and " + collection.length);
        
        let statistics = await getStatistic(category, line)
        
        if (statistics.haveNever + statistics.have == 0) return message.channel.send("**This question has no statistics.** This is probably because the question has never been asked in any server.");

        message.channel.send({
            embed: {
                title: "Statistics",
                description: question,
                color: settings.embedColor.ok,
                fields: [
                    {
                        name: `${i_have_never} I HAVE NEVER`,
                        value: statistics.haveNever,
                        inline: true
                    },
                    {
                        name: `${i_have} I HAVE`,
                        value: statistics.have,
                        inline: true
                    }
                ]
            }
        })
    } else if (content.startsWith("n!language")) {
        if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(":x: You don't have permission!");
        let args = content.replace("n!language ", "").split(" ");
        let languages = await getLanguages()
        if (content == "n!language") return message.channel.send({
            embed: {
                title: "Available Languages",
                description: "To set the language you want for your server, type \`n!language <language>\`\n\n- \`en (default)\`\n- \`" + languages.join("\`\n- \`") + "\`",
                color: settings.embedColor.ok
            }
        })
      
        if (!languages.includes(args[0]) && args[0] != "en") return message.channel.send("**Could not find language.** Get a list of supported languages by typing \`n!language\`.");

        if (args[0] == "en") await setLanguage(message.guild.id, ""); else await setLanguage(message.guild.id, args[0]).then(console.log).catch(console.log);
        return message.channel.send("**Language updated.** Try it out!")
    } else if (content.startsWith("n!")) {
      let collections = await getCollections() 
      if (!collections.includes(content.replace("n!", ""))) if (globalCode) return globalCode.command(client, settings, dbl, message); else return;
      
      if (content.startsWith("n!nsfw/") && !message.channel.nsfw) return message.channel.send({
        embed: {
          title: "This command is restricted to NSFW-channels only.",
            image: {
                url: "https://i.imgur.com/oe4iK5i.gif"
            },
          color: settings.embedColor.err
        }
      })
      
      let language = await getLanguage(message.guild.id);

      let collection = await getCollection(content.replace("n!", ""))
      let collection_lang = await getCollection(content.replace("n!", ""), language)
      let random = Math.floor(Math.random() * collection.length)
      while (collection[random].includes("[D]")) random = Math.floor(Math.random() * collection.length);
      
      message.channel.send({
        embed: {
          author: {
            name: message.author.tag + " (" + message.author.id + ")",
            icon_url: message.author.displayAvatarURL
          },
          description: collection_lang[random] ? collection_lang[random] : (collection[random] + "\n[\`Help us translate!\`](https://github.com/Gleeny/Nevrevr/blob/master/collection)"),
          color: settings.embedColor.ok,
          footer: {
            text: "ID: " + content.replace("n!", "").toUpperCase() + "#" + random
          }
        }
      }).then(msg => {
        addToCount();
        
        msg.react(i_have_never).then(() => { msg.react(i_have) })
        
        msg.awaitReactions((reaction, user) => !user.bot && (i_have_never.id == reaction.emoji.id || i_have.id == reaction.emoji.id), { time: 30000 }).then(async reactions => {
          
          let stats = [0, 0];
          
          reactions.forEach(reaction => {
            if (reaction.emoji.toString() == i_have_never) stats[0] += reaction.count - 1;
            else if (reaction.emoji.toString() == i_have) stats[1] += reaction.count - 1;
          })
          
          let statistics = await getStatistic(content.replace("n!", ""), random)
          statistics.haveNever += stats[0];
          statistics.have += stats[1];
          statistics.save().catch(console.log)
          
          msg.channel.send({
            embed: {
              author: {
                name: message.author.tag + " (" + message.author.id + ")",
                icon_url: message.author.avatarURL
              },
              description: collection_lang[random] ? collection_lang[random] : (collection[random] + "\n[\`Help us translate!\`](https://github.com/Gleeny/Nevrevr/blob/master/collection)"),
              color: settings.embedColor.ok,
              footer: {
                text: "ID: " + content.replace("n!", "").toUpperCase() + "#" + random
              },
              fields: [
                {
                  name: `${i_have_never} I HAVE NEVER`,
                  value: stats[0] + " (Global: " + statistics.haveNever + ")",
                  inline: true
                },
                {
                  name: `${i_have} I HAVE`,
                  value: stats[1] + " (Global: " + statistics.have + ")",
                  inline: true
                }
              ]
            }
          })
          
          msg.delete();
          
        })
      })
    }
});

async function addToCount() {
  let global = await database.getGlobal()
  global.questionsTotal = global.questionsTotal + 1;
  global.save().catch(console.log);
}

async function getCollections() {
  return new Promise(async function(resolve, reject) {
    let list = [];
    async function checkPath(path = "") {
      await fetch("https://api.github.com/repos/Gleeny/Nevrevr/contents/collection/en" + (path != "" ? "/" + path.substring(0, path.length - 1) : "") + process.env.GITHUB_ACCESS_URI).then(res => res.json()).then(async data => {
        for (var i in data) if (data[i].name.endsWith(".txt")) list.push(path + data[i].name.replace(".txt", "")); else if (data[i].type == "dir") await checkPath(path + data[i].name + "/");
      })
    }
    
    await checkPath().catch(reject);
    resolve(list);
  });
}

async function getCollection(collection, language = "en") {
  return new Promise(function(resolve, reject) {
    fetch("https://raw.githubusercontent.com/Gleeny/Nevrevr/master/collection/" + language + "/" + collection + ".txt").then(res => res.text()).then(text => resolve(text.split("\n"))).catch(reject);
  });
}

async function getLanguage(guildid) {
  let guild = await database.getGuild(guildid);
  return guild.language || "en";
}

async function getLanguages() {
  return new Promise(async function(resolve, reject) {
    let languages = [];
    fetch("https://api.github.com/repos/Gleeny/Nevrevr/contents/collection" + process.env.GITHUB_ACCESS_URI).then(res => res.json()).then(async data => {
      for (var i in data) if (data[i].type == "dir" && data[i].name != "en") languages.push(data[i].name);
      resolve(languages)
    }).catch(reject);
  });
}

async function setLanguage(guildid, language) {
  return new Promise(async function(resolve, reject) {
    let guild = await database.getGuild(guildid)
    guild.language = language;
    guild.save().then(resolve).catch(reject);
  })
}

async function getStatistic(category, id) {
  return await database.getStatistic(category, id)
}

client.login(process.env.DISCORD_TOKEN)

globalCode.logging(client)