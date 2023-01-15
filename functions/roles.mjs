// Usage: pmcbot new-role [emoji] [message-id] <role-name>

const createNewRole = async ( bot, message, prefix, settings, writeToSettings ) => {
    let messageContent = message.content.substring(prefix.length).toLowerCase(); //assuming the prefix contains spaces
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
    writeToSettings(settings);
    await addReactionsToRoleMessages(settings, bot);
    return "Role reaction successfully added!";
}

const deleteRole = (settings, messageContent, writeToSettings) => {
    let commandEntirety = messageContent.split(" "); 
    // commandEntirety[0] = delete-role, commandEntirety[1] = emoji, commandEntirety[2] = message-id

    if(settings[index].roles.includes(role => role.messageID == commandEntirety[2] && role.emoji == commandEntirety[1])) {
        settings[index].roles.splice(settings[index].roles.indexOf(settings[index].roles.find(role => role.messageID == commandEntirety[2] && role.emoji == commandEntirety[1])),1)
        writeToSettings(settings)
        return "Role reaction deleted successfully."
    }
    else return "This role-reaction doesn't actually exist!"
}

async function addReactionsToRoleMessages(settings, bot) {
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

export {
    createNewRole,
    deleteRole
}