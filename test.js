console.log('---- html test: ');

const xss = require('.');

console.log('---- begin.')
console.log(xss.clean('<div class="heelo cl2"> hello khalid </div>'))
console.log('---- end.')