const jwt = require('jsonwebtoken');
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzIsInJvbGVfaWQiOjIsImlhdCI6MTczMjY0OTIyOCwiZXhwIjoxNzMyNjUyODI4fQ.rn-xm23BC-NWZsHYITwMOS7nWH4ZDyzTC9arhMG2kIQ"
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