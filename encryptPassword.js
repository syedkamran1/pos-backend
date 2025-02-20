const bcrypt = require('bcrypt');

const password = 'password123';  // Password you want to hash
const saltRounds = 10;  // The cost factor for hashing

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Hashed Password:', hash);
  }
});
 