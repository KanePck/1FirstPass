'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/delWebRec', function (req, res) {
    console.log(req.body);

});
router.get('/delWebRec', function (req, res) {
    res.render('delWebRec.pug');
});
module.exports = router;