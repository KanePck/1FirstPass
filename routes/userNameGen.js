'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/userNameGen', function (req, res) {
    console.log(req.body);

});
router.get('/userNameGen', function (req, res) {
    res.render('unGen.pug');
});
module.exports = router;