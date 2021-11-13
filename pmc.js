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

    await addReactionsToRoleMessages(bot);
});

bot.on('messageCreate', async function (message) {
    let currentGuild = message.guildId;
    if(currentGuild == null) return;

    // Find the guild in settings
    for (let i = 0; i < settings.length; i++) {
        if(settings[i].guildID == currentGuild) {
            let response = respondToMessage(settings[i].prefix, message, i);
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

function respondToMessage(prefix, message, index) { //index here is referring to index of the guild in settings
    if(!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;
    messageContent = message.content.substring(prefix.length).toLowerCase(); //assuming the prefix contains spaces
    // Non-restricted
    if(messageContent.startsWith("help")) {
        return HELPMESSAGE;
    }

    if(!message.member || !message.member.permissions.has("ADMINISTRATOR")) return "Error: you are not allowed to use this command!";
    // Basics
    if(messageContent.startsWith("change-prefix ")) { //Beware of excess spaces! 
        messageContent = messageContent.substring(14);
        settings[index].prefix = messageContent;
        writeToSettings();
    }
    // Roles
    if(messageContent.startsWith("update-roles")) {
        // I'll make this command later
        // Intended to input things into the setting.json file
    }
}

bot.on('messageReactionAdd', async (messageReaction, user) => {
    if(messageReaction.message.partial) await messageReaction.message.fetch();
    if(messageReaction.partial) await messageReaction.fetch();

    // Find message in the settings; if it's not there, then return
    let messageGuildID = messageReaction.message.guildId
    if(!settings.find(guild => guild.guildID == messageGuildID)) return; //if the message guild isn't in settings
    let index = settings.indexOf(settings.find(guild => guild.guildID == messageGuildID));
    if(!(!(settings[index].roles.find(role => role.messageID == messageReaction.message.id)))) { // I'm sorry
        let roleIndex = settings[index].roles.indexOf(settings[index].roles.find(role => role.messageID == messageReaction.message.id));
        if(messageReaction.emoji.name == settings[index].roles[roleIndex].emoji) {
            let server = await bot.guilds.fetch(messageGuildID);
            let member = await server.members.fetch(user);
            let role = await messageReaction.message.guild.roles.fetch(settings[index].roles[roleIndex].roleID);
            if(!member.roles.cache.has(role.id)) {
                member.roles.add(role.id);
            }
        }
    }

    return; // if the message isn't in the settings
})

const HELPMESSAGE = "This is PMC's Bot (still under development)! Unfortunately, I'm too lazy to write out a help message."

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

async function addReactionsToRoleMessages(bot) {
    for(let i = 0; i < settings.length; i++) {
        // each guild
        let currentGuild = await bot.guilds.fetch(settings[i].guildID);
        for(let k = 0; k < settings[i].roles.length; k++) {
            let guildChannels = await currentGuild.channels.fetch(); // this is a map!
            guildChannels.forEach(async (channel) => {
                if(channel.type != "GUILD_TEXT") return;
                try {
                    let channelMessage = await channel.messages.fetch(settings[i].roles[k].messageID);
                    // if the message exists, check if the emoji exists
                    let messageReactions = channelMessage.reactions.cache;
                    if(!messageReactions.has(settings[i].roles[k].emoji)) {
                        channelMessage.react(settings[i].roles[k].emoji)
                    }
                } catch(e) {
                    //i can't believe this. i'm using a try/catch block to check if the message exists. this is the lowest point of my life
                    //the errors here will be of the message not being found in the channel, or the message id being invalid. thus we don't care if there's actually an error
                }
                
            })
        }
        
    }
}

const secret = fs.readFileSync("secret.txt","utf8");
bot.login(secret);