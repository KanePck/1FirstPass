'use strict';
var express = require('express');
var router = express.Router();
var app = express();
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const { body } = require('../node_modules/express-validator/src/index');
var name = FormData.username;
var mail = FormData.email;
app.set('view engine', 'pug');
app.set('views', './views');
app.post('/ffi', function (req, res) {
    console.log(req.body);
    // Define the types for your function return and argument types
    const myFunction = ffi.pwdNmLib('C:\Users\k_pic\source\repo\pwdNmLib\x64\Debug\pwdNmLib.dll', {
        "regis": ['void', ['std::string', 'std::string']],
        "coutMessHdlr": ['void', ['std::string']],
        "logFace": ['void', ['std::string']]

    });

    // Call the function
    const result = myFunction.regis(name, mail);

});
router.get('/ffi', function (req, res) {
    res.send('Signing up in process');
});

module.exports = router;