'use strict';
var express = require('express');
var router = express.Router();
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
    res.render('index.pug', { title: 'pwdNoMore' });
});

module.exports = router;
