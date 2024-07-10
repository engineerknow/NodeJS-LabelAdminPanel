const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// MySQL Connection
const dB = mysql.createConnection({
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const db2 = mysql.createConnection({
    host: process.env.DB_HOST1,
    user: process.env.DB_USER1,
    password: process.env.DB_PASS1,
    database: process.env.DB_NAME1
});

dB.connect((error) => {
    if (error) {
        console.log(error)
    }
    else {
        console.log("MYSQL Connected!")
    }
})

db2.connect((err) => {
    if (err) {
        console.error('Error connecting to the second database:', err);
        return;
    }
    console.log('Connected to the second database');
});

exports.register = (req, res) => {
    console.log(req.body);
    const { email, username, password, repassword } = req.body;
    if (password !== repassword) {
        console.log('password not match');
        return res.render('register', {
            message: 'Passwords do not match!'
        });
    }

    if (password == repassword) {
        dB.query('SELECT username FROM tblLogin WHERE username = ?', [username], async (error, results) => {
            if (error) {
                console.log(error);
            }

            if (results.length > 0) {
                return res.render('register', {
                    message: 'That username is already in use'
                })

            }


            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);

            dB.query('INSERT INTO tblLogin SET ?', { Username: username, Password: hashedPassword, Email: email }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(results);
                    return res.render('register', {
                        message: 'User registered!'
                    });
                }
            });
        })
    }

}

exports.login = (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).render('login', {
            message: 'Please provide an username and password!'
        })
    }

    /*  dB.query('SELECT * FROM tblLogin WHERE Username = ?', [username], async (error, results) => {
         
         if(!(await bcrypt.compare(password, results[0].Password))){ 
             res.status(401).render('login', {
                 message: 'Username or Password is incorrect!'
             })
         }
         else{ 
             const dbUsername = results[0].Username; // Kullanıcın şifresini hashle!
 
             const token = jwt.sign({dbUsername}, process.env.JWTSECRETKEY);
  
             res.cookie('jwt', token, {maxAge: 20000, httpOnly:true});
             res.status(200).redirect("/");
         }
     }); */
    dB.query('SELECT * FROM tblLogin WHERE Username = ?', [username], async (error, results) => {
        if (error) {
            // Handle the database error
            return res.status(500).render('login', {
                message: 'An error occurred while processing your request. Please try again later.'
            });
        }

        // Check if the user exists
        if (results.length === 0) {
            return res.status(401).render('login', {
                message: 'Username or Password is incorrect!'
            });
        }

        // Check if the password matches
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).render('login', {
                message: 'Username or Password is incorrect!'
            });
        }

        // If the password matches, generate a token and set a cookie
        const dbUsername = user.Username;
        const token = jwt.sign({ dbUsername }, process.env.JWTSECRETKEY, { expiresIn: '1h' });

        res.cookie('jwt', token, { maxAge: 20000, httpOnly: true });
        return res.status(200).redirect("/");
    });

}
/* 
exports.orders = (req, res) => {
    db2.query('SELECT * FROM crmgameorders limit 50', (error, results) => {
        if (error) {
            return res.status(500).send('Database query error: ' + error.message);
        }
        res.render('order', { orders: results });
    });
}; */
exports.ordersapi = (req, res) => {
    const draw = req.query.draw;
    const start = parseInt(req.query.start);
    const length = parseInt(req.query.length);
    const search = req.query.search.value;

    let whereClause = '';
    if (search) {
        whereClause = `WHERE id LIKE '%${search}%' OR customerName LIKE '%${search}%' OR poinOrder LIKE '%${search}%'`;
    }

    const queryCount = `SELECT COUNT(*) AS total FROM crmgameorders ${whereClause}`;
    db2.query(queryCount, (err, countData) => {
        if (err) {
            return res.status(500).send('Database query error: ' + err.message);
        }
        const recordsTotal = countData[0].total;
        const recordsFiltered = recordsTotal;

        const queryData = `SELECT * FROM crmgameorders ${whereClause} order by id desc LIMIT ${start}, ${length} `;
        db2.query(queryData, (err, data) => {
            if (err) {
                return res.status(500).send('Database query error: ' + err.message);
            }
            res.json({
                draw: draw,
                recordsTotal: recordsTotal,
                recordsFiltered: recordsFiltered,
                data: data
            });
        });
    });
};