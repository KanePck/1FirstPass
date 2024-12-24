'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');

router.get('/sessionInit', function (req, res) {
    console.log(req.body);
    res.send('Session initialization');
});
app.use('/', router);
module.exports = router;