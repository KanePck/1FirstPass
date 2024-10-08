'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/validLogin', function (req, res) {
    console.log(req.body);

});
router.get('/validLogin', function (req, res) {
    res.render('validLogin.pug');
});
module.exports = router;