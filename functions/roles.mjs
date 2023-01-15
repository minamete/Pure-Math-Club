const createNewRole = ( message, prefix ) => {
    if(!message.member || !message.member.permissions.has("ADMINISTRATOR")) 
        return "You do not have permission to use this command!";

    let messageContent = message.content.substring(prefix.length).toLowerCase(); //assuming the prefix contains spaces

}