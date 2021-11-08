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

bot.on('ready', () => {
    console.log("Bonjour");
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
        // I'll make this less shitty later

    }
}

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

const secret = fs.readFileSync("secret.txt","utf8");
bot.login(secret);