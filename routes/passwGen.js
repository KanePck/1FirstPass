'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/passwGen',function(req, res) {
    console.log(req.body);

});
router.get('/passwGen', function (req, res) {
    res.render('pwGen.pug');
});
module.exports = router;