'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/supPassw', function (req, res) {
    console.log(req.body);
    
});
router.get('/supPassw', function (req, res) {
    res.render('masterPass.pug', { title: 'User to provide master password' });
});

module.exports = router;