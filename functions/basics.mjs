const changePrefix = (prefix, settings, writeToSettings) => {
    messageContent = message.content.substring(prefix.length).toLowerCase(); //assuming the prefix contains spaces
    messageContent = messageContent.substring(14);
    settings[index].prefix = messageContent;
    writeToSettings();
    return "Prefix successfully changed to " + messageContent;
}