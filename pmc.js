// This file will have mostly listeners in it.
const initialSettings = require("./settings.json");
const Discord = require('discord.js');
const fs = require('fs');
var settings = initialSettings;

const CONSTANTS = require("./utils/constants.mjs")
const fssettings = require("./utils/fssettings.mjs")

const basics = require("./functions/basics.mjs")
const roles = require("./functions/roles.mjs")

// Make sure the intents are working!
const bot = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MESSAGES, 
                  Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ['MESSAGE','CHANNEL','REACTION', 'GUILD_MEMBER','USER']
})

bot.on('ready', async () => {
    // If there aren't any emoji reactions under the role messages, add them
    await addReactionsToRoleMessages();
});

bot.on('messageCreate', async function (message) {
    let currentGuild = message.guildId;
    if(currentGuild == null) return;

    // Find the guild in settings
    for (let i = 0; i < settings.length; i++) {
        if(settings[i].guildID == currentGuild) {
            let response = await respondToMessage(settings[i].prefix, message, i);
            return response ? message.channel.send(response) : null; 
        }
    }
    
    // If the guild can't be found, create it
    settings.push({
        "guildID": currentGuild,
        "prefix": "pmcbot ",
        "roles": [
            {
                "messageID": "test",
                "emoji": "a",
                "roleID": "test"
            }
        ]
    })
    fssettings.writeToSettings(settings); 
})

async function respondToMessage(prefix, message, index) { //index here is referring to index of the guild in settings
    if(!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;
    messageContent = message.content.substring(prefix.length).toLowerCase(); //assuming the prefix contains spaces
    // Non-restricted
    if(messageContent.startsWith("help")) {
        return CONSTANTS.HELPMESSAGE;
    }

    if(!message.member || !message.member.permissions.has("ADMINISTRATOR")) return "You do not have permission to use this command!";
    // Basics
    if(messageContent.startsWith("change-prefix ")) { //Beware of excess spaces! 
        return basics.changePrefix(message, prefix, settings, fssettings.writeToSettings)
    }
    // Roles
    if(messageContent.startsWith("new-role")) {
        // I'll make this command later
        // Usage: pmcbot new-role [emoji] [message-id] <role-name>
        if(messageContent.replace(/\s/g, '').length <= 8) return `Usage: \`${prefix}new-role emoji message-id channel-id <role-name>\`` 
        try {
            return roles.createNewRole(bot, message, prefix, settings, fssettings.writeToSettings)
        }catch (e) {
            console.log(e)
            return "Syntax error! Make sure your command has the appropriate syntax."
        }
    }
    if(messageContent.startsWith("delete-role")) {
        // Usage: pmcbot delete-role [emoji] [message-id] 
        if(messageContent.replace(/\s/g, '').length <= 11) return `Usage: \`${prefix}delete-role emoji message-id\`` 
        try {
            return roles.deleteRole(settings, messageContent, fssettings.writeToSettings)
        }catch (e) {
            return "Syntax error! Make sure your command has the appropriate syntax."
        }
    }
}

bot.on('messageReactionAdd', async (messageReaction, user) => {
    if(messageReaction.message.partial) await messageReaction.message.fetch();
    if(messageReaction.partial) await messageReaction.fetch();
    if(user.bot) return;
    // Find message in the settings; if it's not there, then return
    let messageGuildID = messageReaction.message.guildId
    if(!settings.find(guild => guild.guildID == messageGuildID)) return; //if the message guild isn't in settings
    let index = settings.indexOf(settings.find(guild => guild.guildID == messageGuildID));
    let roleArray = settings[index].roles.filter(role => role.messageID == messageReaction.message.id);

    for(let i = 0; i < roleArray.length; i++) {
        if(messageReaction.emoji.name == roleArray[i].emoji) {
            let server = await bot.guilds.fetch(messageGuildID);
            let member = await server.members.fetch(user);
            let role = await messageReaction.message.guild.roles.fetch(roleArray[i].roleID);
            if(!member.roles.cache.has(role.id)) {
                member.roles.add(role.id);
                messageReaction.users.remove(user);
            } else {
                member.roles.remove(role.id);
                messageReaction.users.remove(user);
            }
        }
    }
    return; // if the message isn't in the settings
})

const secret = fs.readFileSync("secret.txt","utf8");
bot.login(secret);