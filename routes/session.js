//Session control
var express = require('express');
var router = express.Router();
const sessionManager = require('session-store-js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
var app = express();
// Use the environment variable if set, otherwise generate a new secret key
const jwtSecretKey = process.env.jwtSecretKey || crypto.randomBytes(64).toString('hex');

function sessLogin(userObj) {
    //const userJSON = JSON.stringify(userObj);
    const token = jwt.sign(userObj, jwtSecretKey, { expiresIn: '2h' });
    return token;
}
function sessTokenVrfy(token) {
    
        try {
            const decoded = jwt.verify(token, jwtSecretKey);
            return { decoded }; // Return the decoded object 
        } catch (err) {
            return { error: err }; // Return the error object 
        }
    
}
module.exports = { sessLogin, sessTokenVrfy };
