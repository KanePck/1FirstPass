'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.get('/resultPassw', function (req, res) {
    console.log(req.body);

});
router.get('/resultPassw', function (req, res) {
    res.render('resultPassw.pug');
});
module.exports = router;