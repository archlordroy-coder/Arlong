const bcrypt = require('bcryptjs');

const password = 'MboaAdmin2024!';
const hash = bcrypt.hashSync(password, 10);

console.log('Hash pour MboaAdmin2024!:');
console.log(hash);
