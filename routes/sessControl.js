'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');

router.get('/sessControl', function (req, res) {
    console.log(req.body);
    res.send('Session control');
});
app.use('/', router);
module.exports = router;