// env-test.js
require('dotenv').config({ path: '.env.local' });
console.log('JWT_SECRET:', process.env.JWT_SECRET);