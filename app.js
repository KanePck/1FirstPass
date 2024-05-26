'use strict';
var debug = require('debug')('my express app');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('dotenv').config();
var app = express();

var routes = require('./routes/index');
//var users = require('./routes/users');
var signup = require('./routes/signup');
var err = require('./routes/error');
var photoCap = require('./routes/photoCap');
var ffi = require('./routes/ffi');
var saveImage = require('./routes/saveImage');
var sup = require('./routes/sup');
var login = require('./routes/login');

//var document = new Document();
const { body, validationResult } = require("express-validator");
const { isLength } = require('validator');
const { isEmail } = require('validator');
const asyncHandler = require("express-async-handler");
const { checkSchema, matchedData } = require('./node_modules/express-validator/src/index');
const Users = require('./routes/dbModels/Users');
const fs = require('fs');
const uName = require('./routes/uName');
//const Urls = require('./routes/Urls');

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
async function connectDb() {
    try {
        await mongoose.connect(process.env.mongodbUri);
        console.log('MongoDB connected');
    }   catch (err) {
        console.log(err);
    }
}
async function userCreate(body) {
    try {
        const date = new Date();
        const u0 = new Users({ userName: body.username, email: body.email, mPhone: body.phone, dateJoin: date });
        await u0.save();
        console.log(`User: ${body.username} added to DB`);
        
    }   catch (err) {
        console.log(err);
    }
    
}
async function closeDB() {
    await mongoose.connection.close();
    console.log('Mongodb closed successfully');
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' })); // To handle large payloads

app.use('/', routes);
app.use('/signup', signup);
//app.use('/users', users);
app.use('/error', err);
app.use('/photoCap', photoCap);
app.use('/saveImage', saveImage);
app.use('/sup', sup);
app.use('/login', login);
app.get('/', function (req, res) {
    res.render('index.pug');
});
app.post('/', function (req, res) {
    console.log(req.body);
    res.redirect("/signup");
});
app.get('/signup', function (req, res) {
    console.log(req.body);
    
});
app.post('/signup', checkSchema({
    username: {
        isLength: { options: { min: 4 } },
        trim: true,
        escape: true,
    },
    email: {
        isEmail: {
            errorMessage: 'Must be a valid email address.'
        },
    },
    phone: {
        isMobilePhone: {
            options: ['any', { strictmode: true }]
        },
    }
}),
    (req, res) => {
        const errors = validationResult(req);
        //const form = document.querySelector("#signUp");
        if (!errors.isEmpty()) {
            console.log('Failed validation:', errors.array());
            //console.log(data);
            res.render('err.pug', {
                title: "Errors message",
                errors: errors.array(),

            });

        } else {
            // Data from form is valid.
            //res.render('sup.pug');
            console.log(req.body);
            const promise1 = connectDb(); //see line 31
            async function checkDuplicate(body) {
                const query = Users.findOne({ userName: `${body.username}` });
                const doc = await query.exec();
                if (doc && doc.userName === body.username) { //To check if name duplicate
                    //do something
                    console.log(`${doc.userName}=${body.username}`);
                    return true;
                } else {
                    return false;
                }
            }
            async function deleteRec() {
                await Users.deleteMany({ userName: /Kane/ });
                console.log("all Kane* records deleted");
            }
            async function handleReq(req) {
                await deleteRec(); // To delete some db records
                var dup = await checkDuplicate(req.body);
                if (dup === true) {
                    console.log(`${req.body.username} is duplicate name.`);
                    Promise.allSettled([promise1])
                        .then(results => {
                            // results is an array containing the resolved values of each promise
                            console.log('All operations completed:', results);

                            // Now it's safe to close the connection

                        })
                        .catch(error => {
                            // If any of the promises reject, this catch block will execute
                            console.error('An error occurred:', error);
                        });
                    //await closeDB(); // Now it's safe to close the connection
                    //console.log('Connection to db closed successfully.');
                    res.render('err.pug');
                } else {
                    // Using Promise.all to execute all async operations and wait for them to complete
                    const promise2 = userCreate(req.body);
                    const promises = [promise1, promise2];
                    Promise.allSettled(promises)
                        .then(results => {
                            // results is an array containing the resolved values of each promise
                            console.log('All operations completed:', results);

                        })
                        .catch(error => {
                            // If any of the promises reject, this catch block will execute
                            console.error('An error occurred:', error);
                        });
                    //await closeDB(); // Now it's safe to close the connection
                    //console.log('Connection to db closed successfully.');
                    //body: JSON.stringify(body.username);
                    uName.setUsername(req.body.username);
                    res.redirect('/photoCap');
                }
            }
            handleReq(req);

        }

    },
    
);
app.get('/photoCap', function (req, res) {
    res.render('photoCap.pug', { title: 'User to take self photo' })

});   

app.post('/saveImage', (req, res) => {
    const dataUrl = req.body.image;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, ''); // Remove the data URL prefix
    const name = uName.getUsername();
    var phoNo = req.body.Number;
    const absolutePath = path.join(__dirname, 'public', 'images', `${name}${phoNo}.png`);
    fs.writeFile(absolutePath, base64Data, 'base64', (err) => { // Replace 'path/to/save/' with the actual path
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving the image');
        }
        console.log(`Image ${phoNo} saved successfully`);
        if (phoNo == 3) {
            res.redirect('/sup');
        } 
        
    });
});
app.get('/sup', function (req, res) {
    res.render('sup.pug');
});
app.post('/login', function (req, res) {
    const name = req.body.username;
    connectDb();
    async function checkName() {
        const query = Users.findOne({ userName: `${name}` });
        const doc = await query.exec();
        if (doc && doc.userName === name) { //To check if name duplicate
            //do something
            console.log(`${doc.userName}=${name}`);
            return true;
        } else {
            return false;
        }
    }
    async function checkReq() {
        var nameValid = await checkName();
        if (nameValid) {
            //go to take photo
            console.log('Name exists');
            res.render('photoLog.pug');
        } else {
            console.log('Name not exist');
        }
    }
    checkReq();
});
app.post('/ffi', function (req, res) {
    var name = body.username;
    var mail = body.email;
    console.log(req.body);
    // Define the types for your function return and argument types
    const myFunction = ffi.pwdNmLib('C:\Users\k_pic\source\repo\pwdNmLib\x64\Debug\pwdNmLib.dll', {
        "regis": ['void', ['std::string', 'std::string']],
        "coutMessHdlr": ['void', ['std::string']],
        "logFace": ['void', ['std::string']]

    });

    // Call the function
    const result = myFunction.regis(name, mail);

    //res.render('sup.pug');
});
app.get('/error', function (req, res) {
    console.log(req.body);
    res.render('err.pug', { title: '' });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
