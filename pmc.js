const initialSettings = require("./settings.json");
const Discord = require('discord.js');
const fs = require('fs');
var settings = initialSettings;

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
    writeToSettings(); 
})

async function respondToMessage(prefix, message, index) { //index here is referring to index of the guild in settings
    if(!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;
    messageContent = message.content.substring(prefix.length).toLowerCase(); //assuming the prefix contains spaces
    // Non-restricted
    if(messageContent.startsWith("help")) {
        return HELPMESSAGE;
    }
    if(messageContent.startsWith("role-add ")) {

    }

    if(!message.member || !message.member.permissions.has("ADMINISTRATOR")) return "You do not have permission to use this command!";
    // Basics
    if(messageContent.startsWith("change-prefix ")) { //Beware of excess spaces! 
        messageContent = messageContent.substring(14);
        settings[index].prefix = messageContent;
        writeToSettings();
        return "Prefix successfully changed to " + messageContent;
    }
    // Roles
    if(messageContent.startsWith("new-role")) {
        // I'll make this command later
        // Usage: pmcbot new-role [emoji] [message-id] <role-name>
        if(messageContent.replace(/\s/g, '').length <= 8) return `Usage: \`${prefix}new-role emoji message-id channel-id <role-name>\`` 
        try {
            let name = messageContent.substring(messageContent.indexOf("<")+1, messageContent.indexOf(">"));
            let commandEntirety = messageContent.split(" "); // commandEntirety[0] = new-role, commandEntirety[1] = emoji, commandEntirety[2] = message-id, 3 = channel-id
            for(let i = 0; i < commandEntirety.length; i++) {
                if(commandEntirety[i] == "") {
                    commandEntirety.splice(i,1);
                    i--;
                } 
            }
            let guildRoles = await message.guild.roles.fetch();
            let role = guildRoles.find(role => role.name.toLowerCase() == name);
            // check to make sure it's not a duplicate
            if(settings[index].roles.find(role => role.messageID == commandEntirety[2] && role.emoji == commandEntirety[1]) != undefined) return `This role reaction already exists!`;
            let settingsRole = {
                "messageID": commandEntirety[2],
                "channelID": commandEntirety[3],
                "emoji": commandEntirety[1],
                "roleID": role.id,
                "label": name
            }
            settings[index].roles.push(settingsRole);
            writeToSettings();
            await addReactionsToRoleMessages();
            return "Role reaction successfully added!";
        }catch (e) {
            console.log(e)
            return "Syntax error! Make sure your command has the appropriate syntax."
        }
    }
    if(messageContent.startsWith("delete-role")) {
        // I'll make this command later
        // Usage: pmcbot delete-role [emoji] [message-id] 
        if(messageContent.replace(/\s/g, '').length <= 11) return `Usage: \`${prefix}delete-role emoji message-id\`` 
        try {
            let commandEntirety = messageContent.split(" "); // commandEntirety[0] = delete-role, commandEntirety[1] = emoji, commandEntirety[2] = message-id
            
            if(settings[index].roles.includes(role => role.messageID == commandEntirety[2] && role.emoji == commandEntirety[1])) {
                settings[index].roles.splice(settings[index].roles.indexOf(settings[index].roles.find(role => role.messageID == commandEntirety[2] && role.emoji == commandEntirety[1])),1)
            }
            else return "This role-reaction doesn't actually exist!"
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

const HELPMESSAGE = "This is PMC's Bot (still under development)! React to a role once to get the role, and twice to get rid of the role. \nUnfortunately, I'm too lazy to write out a help message."

async function readFromSettings() {
    tempSettings = await fs.readFileSync("./settings.json", 'utf-8', function(err, data) {
        if(err) throw err;
        const result = JSON.parse(data);
        return result;
    })
    settings = JSON.parse(tempSettings);
}

function writeToSettings() {
    let json = JSON.stringify(settings, null, 4);
    fs.writeFile('./settings.json', json, 'utf-8', function(err) {
        if(err) {
            console.log(err);
        } 
    })
}

async function addReactionsToRoleMessages() {
    for(let i = 0; i < settings.length; i++) {
        // each guild
        let currentGuild = await bot.guilds.fetch(settings[i].guildID);
        for(let k = 0; k < settings[i].roles.length; k++) {
            try {
                let guildChannels = await currentGuild.channels.fetch(settings[i].roles[k].channelID); // this is a map!
                if(guildChannels.type != "GUILD_TEXT") return;
                    let channelMessage = await guildChannels.messages.fetch(settings[i].roles[k].messageID);
                    // if the message exists, check if the emoji exists
                    let messageReactions = channelMessage.reactions.cache;
                    if(!messageReactions.has(settings[i].roles[k].emoji)) {
                        channelMessage.react(settings[i].roles[k].emoji)
                    }        
            } catch (e) {
                // i can't believe this.
            }
            
        }
        
    }
}

const secret = fs.readFileSync("secret.txt","utf8");
bot.login(secret);