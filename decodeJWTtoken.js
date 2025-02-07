const jwt = require('jsonwebtoken');
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZV9pZCI6MSwiaWF0IjoxNzM4OTQ2NTEyLCJleHAiOjE3Mzg5NTAxMTJ9.8rI33PWc653meGzs8AsMq7HVfWU9A-cammZWgIH_0pg"
// Decode without verifying the signature
const decoded = jwt.decode(token);
console.log('Decoded Token:', decoded);

// Verify the token to ensure it's authentic
try {
    const verified = jwt.verify(token, "7d9acc7c8dea8e64434a4fce9f2ab34e387075a711eba680cb04b107c80db82d");
    console.log('Verified Token:', verified);
} catch (err) {
    console.error('Token verification failed:', err.message);
}