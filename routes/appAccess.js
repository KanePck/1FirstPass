'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/appAccess', function (req, res) {
    console.log(req.body);

});
router.get('/appAccess', function (req, res) {
    res.send('Handling app login password');
});
module.exports = router;