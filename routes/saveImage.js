'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/saveImage', function (req, res) {
    console.log(`Saving image of ${req.body.name}`);
    
});
module.exports = router;