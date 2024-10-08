'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/oldUrl', function (req, res) {
    res.render('oldUrl.pug');
    console.log(req.body);

});
router.get('/oldUrl', function (req, res) {
    res.render('oldUrl.pug');
});
module.exports = router;