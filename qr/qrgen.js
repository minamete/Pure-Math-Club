require('dotenv').config() // just for testing; make sure to move .env into root directory
const crypto = require('crypto')
const mysql = require('mysql2')

// "this is so insane and overengineered" - evan
var encrypt = (key, text) => {
    var secret = crypto.randomBytes(16)
    var iv = crypto.randomBytes(16)
    var cipher = crypto.createCipheriv('aes-128-cbc', secret, iv)

    var message = {
        text: text,
        secret: crypto.publicEncrypt(key, Buffer.from(secret)),
        iv: crypto.publicEncrypt(key, Buffer.from(iv))
    }
    
    let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted
}

var createItem = () => {
    // Create the str and encrypt it
    var str = crypto.randomBytes(16).toString('hex')
    var encrypted = encrypt(process.env.PUBLIC_KEY, str)

    // Add the encrypted str to the database
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: process.env.MYSQL_PASSWORD,
    })

    connection.connect((err) => {if (err) throw err; console.log('connected')})

    // Create the QR code from the original string
}

createItem()