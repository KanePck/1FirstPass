'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/genUserN', function (req, res) {
    console.log(req.body);
});
router.get('/genUserN', function (req, res) {
    res.send('To generate random user name');
});

module.exports = router;