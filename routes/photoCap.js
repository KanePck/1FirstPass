'use strict';
var express = require('express');
var router = express.Router();
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.post('/photoCap', function (req, res) {
    console.log(req.body);
    //res.redirect('/signUpCheck');
});
router.get('/photoCap', function (req, res) {
    res.render('photoCap.pug', {title:'User to take self photo'});
});
app.route('/photoCap')
    .get((req, res, next) => {
        res.render('photoCap.pug', { title: 'User to take self photo' })
        next()
    })
    .post((req, res, next) => {
        console.log('To do camera function')
        next()
    })

module.exports = router;