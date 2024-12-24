'use strict';
var express = require('express');
var router = express.Router();
var app = express();
 
app.set('view engine', 'pug');
app.set('views', './views');
app.post('/', function (req, res) {
    console.log(req.body);
    res.redirect("/signup");
});

/* GET home page. */
router.get('/', function (req, res) {
    console.log(req.body);
    console.log('Port: ', process.env.PORT);
    res.redirect('/sessionInit');
});
router.get('/aboutUs', (req, res) => {
    res.render('aboutUs.pug');
});
router.get('/contactUs', (req, res) => {
    res.render('contactUs.pug');
});
router.get('/tnc', (req, res) => {
    res.render('tnc.pug');
});
router.get('/privPo', (req, res) => {
    res.render('privPo.pug');
});
module.exports = router;
