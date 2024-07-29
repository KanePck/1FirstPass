'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/mpassHdlr', function (req, res) {
    console.log(req.body);

});
router.get('/mpassHdlr', function (req, res) {
    res.send('Handling master password');
});

module.exports = router;