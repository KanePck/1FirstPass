'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/dashBoard', function (req, res) {
    res.render('dashBoard.pug');
    console.log(req.body);

});
router.get('/dashBoard', function (req, res) {
    res.render('dashBoard.pug');
});
module.exports = router;