'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/error', function (req, res) {
    console.log(req.body);
    res.send("Error!");
});
router.get('/error', function (req, res) {
    res.render('err.pug');
});
app.get('/error', function (req, res) {
    res.render('err.pug');
    console.log(req.body);
});
module.exports = router;