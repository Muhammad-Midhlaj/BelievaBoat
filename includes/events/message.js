const Discord = require('discord.js');
const Promise = require('bluebird');

module.exports = (async function(client, helpers) {
    const exports = {};

    const db = client.db;
    const Guild = db.model('Guild');

    client.on(`message`, async message => {
        client.helpers.log(`event`, `${message.id} → message received`);
        if (message.author.bot) {
            // Message author was a bot.
            client.helpers.log(`event`, `${message.id} → message author was a bot`);
            return;
        }

        if (message.channel.type === `dm`) {
            // At the moment do not respond to DM messages
            return;
        }

        let content = message.content.split(` `);
        let command = content.shift();
        let dbGuild = await Guild.get(message.guild.id);
        let prefix = (dbGuild.settings.prefix || ``).trim().length > 0 ? dbGuild.settings.prefix : client.config.defaultPrefix;

        if (command.startsWith(prefix)) {
            let arg = content.join(` `);
            command = command.slice(prefix.length);

            // checks if message contains a command and runs it
            let commandfile = client.commands.find(c => c.meta.name === command || c.meta.aliases.includes(command));
            if (commandfile && dbGuild.can(message.member).run(commandfile).in(message.channel)) {
                message.dbGuild = dbGuild;
                let sentMessage = await commandfile.run(client, message, arg).catch(async error => {
                    let embed = client.helpers.generateErrorEmbed(client, message.member.user, error);
                    return await message.channel.send({ embed });
                });

                if (sentMessage) {
                    await client.addDeleteWatchForMessage(commandfile.meta.name, message, sentMessage);
                }
            }
        }
    });

    return exports;
});
