'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/newUrl', function (req, res) {
    res.render('newUrl.pug');
    console.log(req.body);

});
router.get('/newUrl', function (req, res) {
    res.render('newUrl.pug');
});
module.exports = router;