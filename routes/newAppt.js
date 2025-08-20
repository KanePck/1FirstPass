'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/newAppt', function (req, res) {
    res.render('newAppt.pug');
    console.log(req.body);

});
router.get('/newAppt', function (req, res) {
    res.render('newAppt.pug');
});
module.exports = router;