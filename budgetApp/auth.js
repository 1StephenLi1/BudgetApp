var crypto = require('crypto');

/**
 * Adapted from https://ciphertrick.com/2016/01/18/salt-hash-passwords-using-nodejs-crypto/
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
exports.sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    return hash.digest('hex');
};

/**
 * Taken from https://ciphertrick.com/2016/01/18/salt-hash-passwords-using-nodejs-crypto/
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
exports.genSalt = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};