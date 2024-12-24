'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/postLogin', function (req, res) {
    res.render('postLogin.pug');
    console.log(req.body);

});
router.get('/postLogin', function (req, res) {
    res.render('postLogin.pug');
});
module.exports = router;