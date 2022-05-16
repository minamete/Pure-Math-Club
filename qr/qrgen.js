require('dotenv').config() // just for testing; make sure to move .env into root directory
const crypto = require('crypto')

// "this is so insane and overengineered" - evan
var encrypt = (key, text) => {
    var secret = crypto.randomBytes(32)
    var iv = crypto.randomBytes(16)
    var cipher = crypto.createCipheriv('aes-256-cbc', secret, iv)

    var message = {
        text: text,
        secret: crypto.publicEncrypt(key, Buffer.from(secret)),
        iv: crypto.publicEncrypt(key, Buffer.from(iv))
    }
    
    let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    console.log(encrypted)
}

encrypt(process.env.PUBLIC_KEY, "hello")