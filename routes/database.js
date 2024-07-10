/* const mysql = require('mysql2');

// First database connection
const db1 = mysql.createConnection({
    host: process.env.DB_HOST1,
    user: process.env.DB_USER1,
    password: process.env.DB_PASS1,
    database: process.env.DB_NAME1
});

// Connect to the first database
db1.connect((err) => {
    if (err) {
        console.error('Error connecting to the first database:', err);
        return;
    }
    console.log('Connected to the first database');
});


module.exports = { db1 }; */