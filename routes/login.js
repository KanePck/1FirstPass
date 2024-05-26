'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/login', function (req, res) {
    console.log(req.body);
    //res.redirect('/signUpCheck');
});
router.get('/login', function (req, res) {
    res.send('Log in process');
});

module.exports = router;