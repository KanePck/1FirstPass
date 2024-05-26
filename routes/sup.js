'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/sup', function (req, res) {
    console.log(req.body);
    //res.redirect('/signUpCheck');
});
router.get('/sup', function (req, res) {
    res.render('sup.pug');
});

module.exports = router;