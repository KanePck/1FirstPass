'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/webAccess', function (req, res) {
    console.log(req.body);

});
router.get('/webAccess', function (req, res) {
    res.send('Handling login password');
});
module.exports = router;