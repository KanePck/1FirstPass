'use strict';
var express = require('express');
var router = express.Router();
var app = express();
const ffin = require('ffi-napi');
const ref = require('ref-napi');
const { body } = require('../node_modules/express-validator/src/index');
app.set('view engine', 'pug');
app.set('views', './views');
app.get('/ffi', function (req, res) {
    console.log(req.body);
    //var name = req.body.username;
    // Define the types for your function return and argument types
    /*var myFunction = ffin.Library('C:\\Users\\k_pic\\source\\repo\\ExpressPwdNoMore\\x64\\Debug\\pwdNmLib.dll', {
        "genPwd": ['void', ['int', 'bool', 'bool', 'bool']],
        "coutMessHdlr": ['void', ['string']],
        "logFace": ['bool', ['string']]

    });

    /* Call the function
    const result = myFunction.logFace(name);*/

});
router.get('/ffi', function (req, res) {
    res.send('Signing up in process');
});

module.exports = router;