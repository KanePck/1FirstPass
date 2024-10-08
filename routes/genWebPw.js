'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/genWebPw', function (req, res) {
    console.log(req.body);
});
router.get('/genWebPw', function (req, res) {
    res.send('To generate random password');
});

module.exports = router;