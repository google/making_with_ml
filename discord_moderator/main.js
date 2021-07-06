
const Discord = require('discord.js');
const perspective = require('./perspective.js');
const chatBot = require('./chat_bot.js');

const evaluatorApi = {
  analyzeText: (message) => perspective.analyzeText(message),
};

const client = new Discord.Client();

chatBot.methods.init(evaluatorApi, client);
