'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/getWebPwd', function (req, res) {
    console.log(req.body);
});
router.get('/getWebPwd', function (req, res) {
    res.send('To retrieve the password');
});

module.exports = router;