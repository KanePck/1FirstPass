'use strict';
var express = require('express');
var router = express.Router();
var uaParser = require('ua-parser-js');
var app = express();
var browserUse, os, cpu, device, engine;

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/', function (req, res) {
    console.log(req.body);
    res.redirect("/signup");
});

/* GET home page. */
router.get('/', function (req, res) {
    //console.log(req.body);
    console.log('Port: ', process.env.PORT);
    const userAgent = req.headers['user-agent'];
    console.log('User-Agent:', userAgent);
    // Initialize the parser with the user agent string
    if (userAgent) {
        let parser = new uaParser();
        parser.setUA(userAgent);
        let parserResults = parser.getResult();
        browserUse = parserResults.browser; // Correctly access the browser information
        os = parserResults.os;
        cpu = parserResults.cpu;
        engine = parserResults.engine;
        device = parserResults.device;
        console.log('Browser: ', browserUse);
        console.log('OS: ', os);
        console.log('CPU; ', cpu);
        console.log('Engine: ', engine);
        console.log('Device: ', device);
        res.render('index.pug');
    } else {
        console.log('User-Agent header is missing');
        res.render('index.pug', { title: 'pwdNoMore', browser: 'Unknown' });
    }
});

module.exports = router;
