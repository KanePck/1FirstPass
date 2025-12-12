'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/mfa', function (req, res) {
    console.log(req.body);

});
router.get('/mfa', function (req, res) {
    res.render('mfa.pug');
});
module.exports = router;