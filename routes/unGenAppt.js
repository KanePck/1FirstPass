'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/unGenAppt', function (req, res) {
    console.log(req.body);

});
router.get('/unGenAppt', function (req, res) {
    res.render('unGenAppt.pug');
});
module.exports = router;