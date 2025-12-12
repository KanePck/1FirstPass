'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/otpSubmit', function (req, res) {
    console.log(req.body);

});
router.get('/otpSubmit', function (req, res) {
    res.render('otpSubmit.pug');
});
module.exports = router;