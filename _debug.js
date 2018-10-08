module.exports.load = async function(client) {
    const isSharded = client.shard != null ? true : false;

    async function getGlobalStatsNumber(variable) {
        if (!isSharded) return null;
        let stat = await client.shard.broadcastEval('this.' + variable)
        return stat.reduce((prev, val) => prev + val, 0)
    }

    client.on('message', async message => {
        if (message.author.id == '110090225929191424') {
            if (message.content.includes(client.user.id)) {
                if (message.content.includes("debug pls")) {
                    let embed = {};
                    embed.title = client.user.tag + " Debug";
                    embed.description = ":warning: :warning: :warning: **CLASSIFIED INFORMATION** :warning: :warning: :warning:";
                    embed.color = message.guild.me.displayColor ? message.guild.me.displayColor : 3553599;
                    embed.fields = [];

                    embed.fields.push({
                        name: ":globe_with_meridians: Global",
                        value: "```asciidoc\n" +
                        "Guilds :: " + (isSharded ? await getGlobalStatsNumber('guilds.size') : client.guilds.size) + "\n" +
                        "Users  :: " + (isSharded ? await getGlobalStatsNumber('users.size') : client.users.size) + "\n```",
                        inline: false
                    })

                    if (isSharded) embed.fields.push({
                        name: ":diamond_shape_with_a_dot_inside: This Shard (" + client.shard.id + ")",
                        value: "```asciidoc\n" +
                        "Guilds :: " + client.guilds.size + "\n" +
                        "Users  :: " + client.users.size + "\n```",
                        inline: false
                    })

                    message.channel.send({
                        embed: embed
                    })
                }
            }
        }
    })
}