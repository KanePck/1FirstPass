//Called from index.pug
'use strict';
var express = require('express');
var router = express.Router();
var app = express();
//var signUpCheck = require('../public/javascripts/supCheck');

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/signup', function (req, res) {
    console.log(req.body);
    //res.redirect('/signUpCheck');
});
router.get('/signup', function (req, res) {
    res.send('Signing up in process');
});

module.exports = router;