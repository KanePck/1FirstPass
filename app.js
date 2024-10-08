'use strict';
var debug = require('debug')('my express app');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('dotenv').config();
const ffin = require('ffi-napi');
const ref = require('ref-napi');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
//const { Buffer } = require('buffer');//Node.js
const uaParser = require('ua-parser-js');
var app = express();

var routes = require('./routes/index');
var signup = require('./routes/signup');
var err = require('./routes/error');
var photoCap = require('./routes/photoCap');
var ffi = require('./routes/ffi');
var saveImage = require('./routes/saveImage');
var sup = require('./routes/sup');
var login = require('./routes/login');
var saveFaceLn = require('./routes/saveFaceLn');
var supPassw = require('./routes/supPassw');
var mpassHdlr = require('./routes/mpassHdlr');
var logPasswHdlr = require('./routes/logPasswHdlr');
var webAccess = require('./routes/webAccess');
//var data = require('./routes/data');
var delWebRec = require('./routes/delWebRec');
var userNameGen = require('./routes/userNameGen');
var genWebPw = require('./routes/genWebPw');
var genWebUn = require('./routes/genWebUn');
var resultPassw = require('./routes/resultPassw');
var oldUrl = require('./routes/oldUrl');
var newUrl = require('./routes/newUrl');
var validLogin = require('./routes/validLogin');
var getWebPwd = require('./routes/getWebPwd');
var label = 1; //label of each user photo used in /saveImage
var count = 1; // no of times user do face login used in /ffi
var passwCount = 0; // no of times user do password login used in /logPasswHdlr
var urlObj;
//var indexedDbId = 1; //unique id for browser indexed db key
//var webLoginJSON = { 'url':'', 'WebUserName': '', 'WebPassword': '' };
//var document = new Document();
const { body, validationResult } = require("express-validator");
const { isLength } = require('validator');
const { isEmail } = require('validator');
const asyncHandler = require("express-async-handler");
const { checkSchema, matchedData } = require('./node_modules/express-validator/src/index');
const Users = require('./routes/dbModels/Users');
const UserKeys = require('./routes/dbModels/UserKeys');
const UserWebs = require('./routes/dbModels/UserWebs');
const fs = require('fs');
const uName = require('./routes/uName');
const data = require('./routes/data');

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
        //Users define at line 39
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
app.use('/saveFaceLn', saveFaceLn);
app.use('/ffi', ffi);
app.use('/supPassw', supPassw);
app.use('/mpassHdlr', mpassHdlr);
app.use('/logPasswHdlr', logPasswHdlr);
app.use('/webAccess', webAccess);
//app.use('/data', data);
app.use('/delWebRec', delWebRec);
app.use('/userNameGen', userNameGen);
app.use('/genWebPw', genWebPw);
app.use('/genWebUn', genWebUn);
app.use('/resultPassw', resultPassw);
app.use('/oldUrl', oldUrl);
app.use('/newUrl', newUrl);
app.use('/validLogin', validLogin);
app.use('/getWebPwd', getWebPwd);
app.get('/', function (req, res) {
    console.log(req.body);
   
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
                await Users.deleteMany({ userName: /Kane/ })
                .then(() => {
                    console.log('Kane record deleted successfully');
                })
                .catch(error => {
                    console.error('Error deleting Kane record:', error);
                    // Handle error, e.g., retry, log, or notify
                });
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
                    const promise2 = userCreate(req.body);//To create user credentials database
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
                    res.redirect('/supPassw');
                }
            }
            handleReq(req);

        }

    },
    
);
app.get('/photoCap', function (req, res) {
    res.render('photoCap.pug', { title: 'User to take self photo' })

});   
app.get('/supPassw', function (req, res) {
    res.render('masterPass.pug', { title: 'User to provide master password' })
});

app.post('/saveImage', (req, res) => {
    const dataUrl = req.body.image;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, ''); // Remove the data URL prefix
    const name = uName.getUsername();
    var phoNo = req.body.Number;
    //var label = req.body.Label;
    const absolutePath = path.join(__dirname, 'public', 'images', 'idenPhoto', `${name}${phoNo}.png`);
    const csvPath = path.join(__dirname, 'public', 'images', 'csv', `${name}.txt`);
    fs.writeFile(absolutePath, base64Data, 'base64', (err) => { // Replace 'path/to/save/' with the actual path
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving the image');
        }
        console.log(`Image ${phoNo} saved successfully`);
        fs.appendFile(csvPath, `${absolutePath}; ${label}\n`, (err) => { //To create label and write a csv file for each user with 'path/image.png ; label'
            if (err) {
                console.error(err);
                return res.status(500).send('Error writing csv file');
            }
        });
        if (phoNo == 3) {
            label += 1;
            res.redirect('/sup');
        } 
        
    });
});
app.get('/sup', function (req, res) {
    res.render('sup.pug');
});
app.post('/login', function (req, res) { //Called from index.pug
    const name = req.body.username;
    const faceReq = req.body.faceOption;
    let faceDb = false;
    let face = false;
    if (faceReq === 'yes') {
        face = true;
    }
    connectDb();
    async function checkName() {
        const query = Users.findOne({ userName: `${name}` });
        const doc = await query.exec();
        if (doc && doc.userName === name) { //To check if name exists
            //do something
            console.log(`${doc.userName}=${name}`);
            faceDb = doc.facePhoto;
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
            uName.setUsername(req.body.username);
            if (face&&faceDb) {
                res.render('photoLog.pug');
            } else {
                res.render('passwLog.pug', {username: name });
            }
            
        } else {
            res.send('User name not exists.')
            console.log('Name not exist');
        }
    }
    checkReq();
});
app.post('/saveFaceLn', (req, res) => { //Called from scripts/capPhoto2.js
    const dataUrl = req.body.image;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, ''); // Remove the data URL prefix
    const name = uName.getUsername();
    var phoNo = req.body.Number;
    //var label = req.body.Label;
    const absolutePath = path.join(__dirname, 'public', 'images', 'loginPhoto', `${name}.png`);
    
    fs.writeFile(absolutePath, base64Data, 'base64', (err) => { // Replace 'path/to/save/' with the actual path
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving the image');
        }
        console.log(`Image ${phoNo} saved successfully`);
        // Send a JSON response indicating success
        res.json({ message: `Image ${phoNo} saved successfully` });
    });
});
app.post('/mpassHdlr', function (req, res) {
    const { pbkdf2, generateKeyPairSync } = require('crypto');
    const { Buffer } = require('buffer');
    //import Vault from 'vault-storage/vault';
    const passw1 = req.body.password;
    const passw2 = req.body.cPassw;
    const regExp = /[A - Za - z0 - 9]/;
    const specReg = /[^a - zA - Z0 - 9\s]/;
    let facePh = false;
    let faceObj = { face: facePh };
    var encryptPrvKey, pubKey;
    if (req.body.option == 'photo') {
        facePh = true;
    }

    if (passw1 != passw2) {
        return res.render('mpassErr.pug');
    }
    // Regular expression for capital letters
    const capitalRegExp = /[A-Z]/;

    // Regular expression for numbers
    const numberRegExp = /[0-9]/;

    // Regular expression for special characters (consider adjusting based on your needs)
    const specialCharRegExp = /[!@#$%^&*()_+\-=\[\]{};':"/?.<>|,\\]/;

    // Combined check for all requirements (logical AND)
    const strongPasswordRegExp = new RegExp('^(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+\-=\[\]{};:\'"?/?.<>|,\\]).{8,}$');

    if (!capitalRegExp.test(passw1) || !numberRegExp.test(passw1) || !specialCharRegExp.test(passw1) || passw1.length < 8) {
        return res.render('passwNotStrong.pug');
    }
    console.log('passwork check complete');
    const usName = uName.getUsername();
    console.log('getUsername done.');
    //To get option of face photo
    updDbFace();
    var salt, hashPassw;
    var drvKey = Buffer.alloc(64);
    const promise1 = genHashDkey(passw1)
        .then(() => {
            console.log('Password hash and derived key generated.');
        })
        .catch((error) => {
            console.error('genHashDkey error: ', error);
        });
    const promise2 = 22;
    Promise.all([promise1, promise2])
        .then(() => {
            const { publicKey, privateKey, } = generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                    cipher: 'aes-256-cbc',
                    passphrase: drvKey,
                },
            });
            encryptPrvKey = privateKey;
            //pubKey = publicKey;
            const promise3=userKeysCreate(usName, hashPassw, drvKey, encryptPrvKey, publicKey);//To store User keys data in db
            //const userStorage = new Vault('user-storage');
            //userStorage.setItem('publicKey', pubKey);
            Promise.all([promise1, promise3])
                .then(() => {
                    console.log('Promise.all (1+3) done');
                    if (facePh) {
                        res.redirect('/photoCap');
                    }
                    res.render('supSuccess.pug');
                })
            
        })
        .catch((error) => {
            console.error('promise.all error: ', error);
        });
    
    //Some Functions
    async function updDbFace() {
        try {
            console.log('updDbFace is in.');
            const filter = { userName: usName };
            const update = { facePhoto: facePh };
            const doc = await Users.findOneAndUpdate(filter, update, { new: true });
            console.log('doc: ', doc.userName, ' ', doc.facePhoto);
            /*if (res.acknowledged) {
                console.log('Update face photo status done.');
            }*/
            console.log(passw1, passw2, facePh);
        } catch (error) {
            if (error.name === 'MongoError') {
                console.error('Database Error:', error.message);
            } else {
                console.error('Unexpected Error:', error.message || error);
            }
            //console.error('Error updDbf:', error);
        }

    }
    async function genHashDkey(password) {
        console.log('genHashDkey is in');
        const saltRound = 10;
        salt = await bcrypt.genSalt(saltRound);
        console.log('salt:', salt);
        hashPassw = await bcrypt.hash(password, salt);
        console.log('salt: ', salt, 'hash: ', hashPassw);
        await pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
            if (err) throw err;
            console.log('Derived Key: ', derivedKey.toString('hex'));
            drvKey = derivedKey;
            //genKeyPair(derivedKey);
        });
        return hashPassw;
    }

    async function userKeysCreate(usName, hashPw, dKey, enPrvKy, pubKey) {
        try {
            //UserDb define at line 40
            const u0 = new UserKeys({ userName: usName, hashPassw: hashPw, derivedKey: dKey, encPrvKey: enPrvKy, publicKey: pubKey });
            await u0.save();
            console.log(`User: ${usName} and encrypted keys added to UserDb`);

        } catch (err) {
            console.log(err);
        }

    }
});
app.post('/logPasswHdlr', function (req, res) { //Called from passwLog.pug
    var name = uName.getUsername();
    var hashP;
    passwCount += 1;
    var remCount = 3 - passwCount;
    const passw = req.body.password;
    const promise1 = findHashPassw(name);
    const promise2 = 22;
    let usrObj = { 'username': name, 'remAttempt': remCount }; //JSON syntax
    Promise.all([promise1, promise2])
        .then(() => {
            bcrypt.compare(passw, hashP, function (err, result) {
                if (result == true) {
                    res.render('validLogin.pug', {usrObj});
                } else {
                    if (passwCount < 3) {
                        //console.log('remaing count: ', remCount, 'name: ', name);
                        res.render('rePasswLog.pug', { usrObj});
                    } else {
                        res.render('fail3logPw.pug');
                    }
                }
            }); 
            
        })
        .catch ((error) => {
            console.error('promise.all error: ', error);
        });
    async function findHashPassw(name) {
        try {
            const query = UserDb.where({ userName: name });
            const user = await query.findOne();
            hashP = user.hashPassw;
            
        } catch (err) {
            console.log(err);
        }
    }
        
});
app.post('/webAccess', function (req, res) { //Called from validLogin.pug
    var url;
    var oldNew = req.body.oldNew;
    if (oldNew == 'new') {
        url = req.body.newUrl;
        urlObj = { url: url };//urlObj is global var
        let webUn = '';
        let webPw = '';
        data.setDataObj(url, webUn, webPw);
        //indexedDbId += 1;
        res.render('newUrl.pug', {urlObj});
        
    } else if (oldNew == 'old') {
        res.render('oldUrl.pug');
        
    } else {
        // Handle other cases or provide an appropriate response
        res.status(400).json({ error: 'Invalid value for oldNew' });
    }
    
})
/*app.get('/data', function (req, res) {
    //res.json(urlObj);
    res.redirect(urlObj.url);
}) */
app.get('/delWebRec', function (req, res) {
    res.render('delWebRec.pug', {urlObj});
})
app.get('/userNameGen', function (req, res) {
    res.render('unGen.pug');
})
app.post('/genWebPw', function (req, res) {
    const webUserName = req.body.user;
    const length = req.body.length;
    var lowCase = true;
    var upCase = true;
    var num = true;
    var spec = true;
    if (req.body.lowCase === 'no') {
        lowCase = false;
    }
    if (req.body.upCase === 'no') {
        upCase = false;
    }
    if (req.body.numChar === 'no') {
        num = false;
    }
    if (req.body.specChar === 'no') {
        spec = false;
    }
    var password = generator.generate({
        length: length,
        lowercase: lowCase,
        uppercase: upCase,
        numbers: num,
        symbols: spec

    })
    let obj = data.getDataObj();
    if (urlObj.url === obj.url) { //urlObj is global variable and assigned value in /webAccess
        data.setDataObj(obj.url, webUserName, password);
    } else {
        data.setDataObj(urlObj.url, webUserName, password);//urlObj.url value is set in app.pot(/webAccess) 
    }
    let pwObj = data.getDataObj();
    updUsWebDb(pwObj);
    console.log('url: ', pwObj.url, ', user name:', webUserName, ', password: ', password);
    // Display the password and to store login credentials
    res.render('resultPassw.pug', { pwObj });
    //function to update UserWebs DB model
    async function updUsWebDb(obj) {
        try {
            //UserDb define at line 40
            const u0 = new UserWebs({ userName: usName, hashPassw: hashPw, derivedKey: dKey, encPrvKey: enPrvKy, publicKey: pubKey });
            await u0.save();
            console.log(`User: ${usName} and encrypted keys added to UserDb`);

        } catch (err) {
            console.log(err);
        }

    }
 })
app.post('/genWebUn', function (req, res) {
    var webUserName = '';
    if (req.body.self) {
        webUserName = req.body.self;
    } else {
        const length = req.body.length;
        var lowCase = true;
        var upCase = true;
        var num = true;
        var spec = true;
        if (req.body.lowCase === 'no') {
            lowCase = false;
        }
        if (req.body.upCase === 'no') {
            upCase = false;
        }
        if (req.body.numChar === 'no') {
            num = false;
        }
        if (req.body.specChar === 'no') {
            spec = false;
        }
        webUserName = generator.generate({
            length: length,
            lowercase: lowCase,
            uppercase: upCase,
            numbers: num,
            symbols: spec

        })
    }
    
    let obj = data.getDataObj();
    if (urlObj.url === obj.url) {
        data.setDataObj(obj.url, webUserName, obj.pwd);
    } else {
        data.setDataObj(urlObj.url, webUserName, obj.pwd);
    }
    
    let unObj = data.getDataObj();
    //webLoginJSON = unObj.stringify();
    console.log('User Name: ', webUserName, 'url: ', unObj.url);
    res.render('pwGen.pug', { unObj });//Next go to generating password page

})
app.get('/oldUrl', function (req, res) {
    res.render('oldUrl.pug');
})
app.get('/newUrl', function (req, res) {
    res.render('newUrl.pug');
})
app.get('/validLogin', function (req, res) {
    res.render('validLogin.pug');
})
app.post('/getWebPwd', function (req, res) {
    var web = req.body.url;
    let webObj = { url: web };
    res.render('getWebPwd.pug', { webObj });
})
app.get('/ffi', function (req, res) { //Called from scripts/capPhoto2.js
    var name = uName.getUsername();
    var faceOk = false;
    console.log(`login name: ${name}`);
    var voi=ref.types.void;
    var int = ref.types.int;
    var bool = ref.types.bool;
    var string = ref.types.CString;
    const dllPath = path.join(__dirname, 'x64', 'Debug', 'pwdNmLib.dll');//'C:\\Users\\k_pic\\source\\repo\\ExpressPwdNoMore\\x64\\Debug\\pwdNmLib.dll';
    console.log(dllPath);
    // Define the types for your function return and argument types
    var myFunction = ffin.Library(dllPath, { //'C:\Users\k_pic\source\repo\ExpressPwdNoMore\x64\Release\pwdNmLib.dll'
        "genPwd": [string, [int, bool, bool, bool]],
        "coutMessHdlr": [string,[]],
        "logFace": [bool, [string]]

    });

    try {
        faceOk = myFunction.logFace(`${name}`);
        console.log('catch blog executed');
    } catch(error) {
        console.error('Error calling logFace:', error.message);
    }
    if (!faceOk) {
        console.log('Face login fails.');
        //const message = myFunction.coutMessHdlr();
        //console.log(message);
        var rem = 3 - count; //count is global var with initial value = 1
        let remObj = { "Count": count, "Remain": rem };//JSON syntax
              
        console.log(`This is your photo no: ${count} for face login.`);
        count += 1;
        if (rem == 0) {
            count = 1;
            res.render('fail3Login.pug');
        } else {
            res.render('rePhotoLog.pug', {remObj});
        }
    } else {
        console.log(` faceOk: ${faceOk}.`, 'Face login is completed and successful.');
        res.render('validLogin.pug');
        
    }
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
