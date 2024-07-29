'use strict';
var express = require('express');
var router = express.Router();
var uaParser = require('ua-parser-js');
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/', function (req, res) {
    console.log(req.body);
    res.redirect("/signup");
});

/* GET home page. */
router.get('/', function (req, res) {
    console.log('Port: ', process.env.PORT);
    const userAgent = req.headers['user-agent'];
    console.log('User-Agent:', userAgent);
    let parser = new uaParser('userAgent');
    let parserResults = parser.getResult();
    console.log(parserResults);
    res.render('index.pug', { title: 'pwdNoMore' });
});

module.exports = router;
