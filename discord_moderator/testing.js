const perspective = require('./perspective.js');

perspective.analyzeText('I hate you').then((score) => {
  console.log('Aca vienen los scores');
  console.log(score);
}).catch((error) => {
  console.error(error.errors);
});
