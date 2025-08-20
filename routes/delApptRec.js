'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/delApptRec', function (req, res) {
    console.log(req.body);

});
router.get('/delApptRec', function (req, res) {
    res.render('delApptRec.pug');
});
module.exports = router;