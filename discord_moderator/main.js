
const perspective = require('./perspective.js');
const discord = require('./discord.js');

const evaluatorApi = {
  analyzeText: (message) => perspective.analyzeText(message),
};

discord.init(evaluatorApi);
