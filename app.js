'use strict';
require('dotenv').config();
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var uaParser = require('ua-parser-js');

const ffin = require('ffi-napi');
const ref = require('ref-napi');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const session = require('express-session');
const crypto = require('crypto');
const mongoDBStore = require('connect-mongodb-session')(session);
const https = require('https');
const http = require('http');
const fs = require('fs');
const helmet = require('helmet');
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
var appAccess = require('./routes/appAccess');
//var data = require('./routes/data');
var delWebRec = require('./routes/delWebRec');
var userNameGen = require('./routes/userNameGen');
var delApptRec = require('./routes/delApptRec');
var unGenAppt = require('./routes/unGenAppt');
var genWebPw = require('./routes/genWebPw');
var genWebUn = require('./routes/genWebUn');
var resultPassw = require('./routes/resultPassw');
var oldUrl = require('./routes/oldUrl');
var newUrl = require('./routes/newUrl');
var newAppt = require('./routes/newAppt');
var validLogin = require('./routes/validLogin');
var getWebPwd = require('./routes/getWebPwd');
var sessionInit = require('./routes/sessionInit');
var postLogin = require('./routes/postLogin');
var label = 1; //label of each user photo used in /saveImage
var count = 1; // no of times user do face login used in /ffi
var passwCount = 0; // no of times user do password login used in /logPasswHdlr
var urlObj, appleObj, sessMgr, apptObj;
//var uri = process.env.mongodbUri;
//var webLoginJSON = { 'url':'', 'WebUserName': '', 'WebPassword': '' };
//var document = new Document();
const { body, validationResult } = require("express-validator");
const { isLength } = require('validator');
const { isEmail } = require('validator');
const { checkSchema, matchedData } = require('./node_modules/express-validator/src/index');
const Users = require('./routes/dbModels/Users');
const UserKeys = require('./routes/dbModels/UserKeys');
const UserWebs = require('./routes/dbModels/UserWebs');
const uName = require('./routes/uName');
const data = require('./routes/data');
const sess = require('./routes/session');
//console.log('Environment Variables:', process.env);

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
async function connectDb() {
    try {
        await mongoose.connect(process.env.mongodbUri);//define in .env file in ExpressPwdNoMore folder
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
//generate a random nonce for inline script tags for contentSecurityPolicy
app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    console.log('nonce: ', nonce);
    res.locals.nonce = nonce;
    next();
});
//Implement Content Security Policy
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'",
            (req, res) => `'nonce-${res.locals.nonce}'`,
            "https://cdn.jsdelivr.net",
            "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'", "https://www.google-analytics.com"]
    }
}));
//Implement Strict-Transport-Security
app.use(helmet.strictTransportSecurity({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
}));
//Implement Referrer-Policy
app.use(helmet.referrerPolicy({
    policy: "no-referrer"
}));
//Sets "X-Content-Type-Options: nosniff"
//Do not use app.use(helmet()) as it will make all contentSecurityPolicy to be defaults regardless of custom directives
app.use(helmet.xContentTypeOptions());
//To create a session using app.use((session))
//secretKey in window environment variables under advance setting/user variables (not .env file)
const secretKey = process.env.secretKey || crypto.randomBytes(64).toString('hex');
var uri = process.env.mongodbUri;
connectDb();
var store = new mongoDBStore({
    uri: uri,
    collection: 'mySession'
});
store.on('error', function (error) {
    console.log(error);
});
app.use(session({ //initialize session
    genid: function (req) {
        return crypto.randomUUID() // use UUIDs for session IDs
    },
    secret: secretKey,
    cookie: { //1 week, secure for https only, Lax allows some cross-site GETs (e.g. links)
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
    },
    store: store,
    resave: true, // required: force lightweight session keep alive (touch)
    saveUninitialized: true, //  recommended false: only save session when data exists

})) //End of creation of app.use((session))
app.use('/', routes);
app.use('/signup', signup);
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
app.use('/appAccess', appAccess);
//app.use('/data', data);
app.use('/delWebRec', delWebRec);
app.use('/userNameGen', userNameGen);
app.use('/delApptRec', delApptRec);
app.use('/genWebPw', genWebPw);
app.use('/genWebUn', genWebUn);
app.use('/resultPassw', resultPassw);
app.use('/oldUrl', oldUrl);
app.use('/newUrl', newUrl);
app.use('/newAppt', newAppt);
app.use('/validLogin', validLogin);
app.use('/getWebPwd', getWebPwd);
app.use('/sessionInit', sessionInit);
app.use('/postLogin', postLogin);
app.use('/unGenAppt', unGenAppt);
//To set up https environment which needed for localhost
const PORT = process.env.PORT || 1337;
const hostname = process.env.HOSTNAME || 'localhost';
const isHttps = process.env.HTTPS === 'true';
if (isHttps) {
    const sslKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
    const sslCert = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
    const options = {
        key: sslKey,
        cert: sslCert
    };

    https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Server running on hostname ${hostname}, port ${PORT}`);
    });
} else {
    http.createServer(app).listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
    });
} //end of https set up
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});
app.get('/', function (req, res) {
    console.log(req.body);
});
app.post('/', function (req, res) {
    console.log(req.body);
    res.redirect("/signup");
});
app.get('/sessionInit', function (req, res) {
    console.log('inside middleware');
    var userUUID;
    if (req.session) {
        const sessId = req.sessionID;
        req.session.timestamp = new Date().toISOString();
        req.session.login = false;
        const sessObj = { sessionId: req.sessionID, timestamp: req.session.timestamp, login: req.session.login };
        console.log('sessId: ', sessObj.sessionId, ', times: ', req.session.timestamp);
        //To create persistent user unique id to check if returning user
        if (!req.cookies.userUUID) {
            userUUID = crypto.randomUUID();
            res.cookie('userUUID', userUUID, { maxAge: 1000 * 60 * 60 * 24 * 365, httpOnly: true }); // 1 year
            req.session.newVisitor = true;
            console.log('New user, setting UUID:', userUUID);
        } else {
            console.log('Returning user, UUID:', req.cookies.userUUID);
            userUUID = req.cookies.userUUID;
            req.session.newVisitor = false;
        }
        const uuidObj = { uuid: userUUID };
        res.render('index.pug', { sessObj, uuidObj });
    } else {
        res.status(400).send('No active session');
    }

});
app.get('/postLogin', (req, res) => {
    res.render('postLogin.pug');
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
                //await deleteRec(); // To delete some db records
                var dup = await checkDuplicate(req.body);
                if (dup === true) {
                    console.log(`${req.body.username} is duplicate name.`);
                    /*Promise.allSettled([promise1])
                        .then(results => {
                            // results is an array containing the resolved values of each promise
                            console.log('All operations completed:', results);

                            // Now it's safe to close the connection

                        })
                        .catch(error => {
                            // If any of the promises reject, this catch block will execute
                            console.error('An error occurred:', error);
                        });*/
                    //await closeDB(); // Now it's safe to close the connection
                    //console.log('Connection to db closed successfully.');
                    const message = 'User name duplicate, please input new user name.';
                    res.render('err.pug', {message});
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
                    const usrName = req.body.username;
                    uName.setUsername(usrName);
                    res.render('masterPass.pug', {username: usrName});
                }
            }
            handleReq(req);

        }

    },
    
);

app.post('/saveImage', (req, res) => {
    const dataUrl = req.body.Image;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, ''); // Remove the data URL prefix
    const name = req.body.User;
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
            res.render('supSuccess.pug');
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
    console.log('faceR: ', faceReq);
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
            console.log('faceIn: ', face, ' faceDB: ', faceDb);
            if (face&&faceDb) {
                res.render('photoLog.pug', { username: name });
            } else {
                res.render('passwLog.pug', { username: name, nonce: res.locals.nonce });
            }
            
        } else {
            const message = 'User name not exists.';
            res.render('err.pug', { message });
            console.log('Name not exist');
        }
    }
    checkReq();
});
app.post('/saveFaceLn', (req, res) => { //Called from scripts/capPhoto2.js
    const dataUrl = req.body.Image;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, ''); // Remove the data URL prefix
    const name = req.body.User;
    var phoNo = req.body.Number;
    //var label = req.body.Label;
    const absolutePath = path.join(__dirname, 'public', 'images', 'loginPhoto', `${name}.png`);
    
    fs.writeFile(absolutePath, base64Data, 'base64', (err) => { // Replace 'path/to/save/' with the actual path
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving the image');
        }
        console.log(`Image ${phoNo} saved successfully`);
        const responseData = {
            usrName: name,
        }
        // Send a JSON response indicating success
        res.json(responseData);
    });
});
app.post('/mpassHdlr', function (req, res) {
    const { pbkdf2, generateKeyPairSync } = require('crypto');
    const { Buffer } = require('buffer');
    //import Vault from 'vault-storage/vault';
    const passw1 = req.body.password;
    const passw2 = req.body.cPassw;
    const usName = req.body.usrName;
    console.log('getUsername done.');
    const regExp = /[A - Za - z0 - 9]/;
    const specReg = /[^a - zA - Z0 - 9\s]/;
    let facePh = false;
    let faceObj = { face: facePh };
    var encryptPrvKey, pubKey;
    if (req.body.option == 'photo') {
        facePh = true;
    }

    if (passw1 != passw2) {
        return res.render('mpassErr.pug', {username: usName});
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
        return res.render('passwNotStrong.pug', {username: usName});
    }
    console.log('passwork check complete');
    
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
                        res.render('photoCap.pug', { username: usName });
                        return;
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
    const name = req.body.username;
    const sessId = req.body.sessionId;
    console.log('name: ', name, ', session id: ', sessId);
    var hashP, authTok, usrData, userAgent;
    passwCount += 1;
    var remCount = 3 - passwCount;
    const passw = req.body.loginPassword;
    const promise1 = findHashPassw(name);
    const promise2 = 22;
    let usrObj = { 'username': name, 'remAttempt': remCount }; //JSON syntax
    var usrId, browser, os, cpu;
    Promise.all([promise1, promise2]) //promise.all-1
        .then(() => {
            bcrypt.compare(passw, hashP, function (err, result) {
                if (result == true) {
                    const promise3 = findUsrId(name);//this function obtain usrId
                    const promise4 = 44; // getUsrAgent(name) not needed here
                    Promise.all([promise3, promise4]) //promise.all-2
                        .then(() => {
                            usrData = { 'id': usrId, 'username': name };
                            authTok = sess.sessLogin(usrData);//see session.js-authTok life is 12 hours
                            console.log('logPasswHdlr Token: ', authTok);
                            req.session.usrId = usrId;
                            req.session.usrName = name;
                            req.session.authToken = authTok;
                            req.session.login = true;
                            //userAgent={'Browser': browser, 'OS': os, 'CPU': cpu};
                            res.render('validLogin.pug', { authTok, usrData, nonce: res.locals.nonce });
                        })
                        .catch((error) => {
                            console.error('promise.all-2 error: ', error);
                        });
                } else {
                    if (passwCount < 3) {
                        //console.log('remaing count: ', remCount, 'name: ', name);
                        res.render('rePasswLog.pug', { usrObj, nonce: res.locals.nonce });
                    } else {
                        res.render('fail3logPw.pug');
                    }
                }
            }); 
            
        })
        .catch ((error) => {
            console.error('promise.all-1 error: ', error);
        });
    async function findHashPassw(name) {
        try {
            const query = UserKeys.where({ userName: name });
            const user = await query.findOne();
            hashP = user.hashPassw;
            
        } catch (err) {
            console.log(err);
        }
    }
    async function findUsrId(name) {
        const query = Users.findOne({ userName: `${name}` });
        const doc = await query.exec();
        usrId = doc.id;
        console.log('id: ', usrId);
        
    }
    async function getUsrAgent(name) { //to find user-agent info
        try {
            const query = UserWebs.findOne({ userName: name });
            const doc = await query.exec();
            if (doc) { //To check if name exists
                browser = doc.browser;
                os = doc.os;
                cpu = doc.cpu;
                console.log('browser: ', browser, ' os: ', os, ' cpu: ', cpu);

            } else {
                console.log(`New user so cannot get user-agent of ${name}`);
                browser = 'None because you are new user.';
                os = 'None.';
                cpu = 'None.';
            }

        } catch (err) {
            console.log(err);
        }

    }    
});
app.post('/webAccess', function (req, res) { //Called from validLogin.pug
    var url;
    var apple = 'no';
    //To obtain userAgent - browser, os, cpu, etc
    const userAgent = req.headers['user-agent'];
    //var browserUse, os, cpu, device, engine;
    // Initialize the parser with the user agent string
    if (userAgent) {
        let parser = new uaParser();
        parser.setUA(userAgent);
        let result = parser.getResult();
        if (result.device.vendor === "Apple" ||
            /iPhone|iPad|Mac/.test(result.device.model) ||
            result.os.name === "Mac OS") {
            apple = 'yes';
        } 

    } else {
        console.log('User-Agent header is missing');
    }
    console.log('Apple: ', apple)
    var appleObj = { 'isApple': apple };
    console.log('appleObj before render: ', appleObj.isApple);
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
        res.render('oldUrl.pug', { appleObj });
        
    } else {
        // Handle other cases or provide an appropriate response
        res.status(400).json({ error: 'Invalid value for oldNew' });
    }
    function isAppleDevice() {
        const parser = new UAParser();
        const result = parser.getResult();
        return result.device.vendor === "Apple" || /iPhone|iPad|Mac/.test(result.device.model) || result.os.name === "Mac OS";
    }
})
app.post('/appAccess', function (req, res) { //Called from validLogin.pug
    var appt;
    var apple = 'no';
    //To obtain userAgent - browser, os, cpu, etc
    const userAgent = req.headers['user-agent'];
    //var browserUse, os, cpu, device, engine;
    // Initialize the parser with the user agent string
    if (userAgent) {
        let parser = new uaParser();
        parser.setUA(userAgent);
        let result = parser.getResult();
        if (result.device.vendor === "Apple" ||
            /iPhone|iPad|Mac/.test(result.device.model) ||
            result.os.name === "Mac OS") {
            apple = 'yes';
        }

    } else {
        console.log('User-Agent header is missing');
    }
    console.log('Apple: ', apple)
    var appleObj = { 'isApple': apple };
    console.log('appleObj before render: ', appleObj.isApple);
    var oldNew = req.body.oldNew;
    if (oldNew == 'new') {
        appt = req.body.newApp;
        apptObj = { appt: appt };//apptObj is global var
        let apptUn = '';
        let apptPw = '';
        data.setDataObj(appt, apptUn, apptPw);
        //indexedDbId += 1;
        res.render('newAppt.pug', { apptObj });

    } else if (oldNew == 'old') {
        res.render('oldAppt.pug', { appleObj });

    } else {
        // Handle other cases or provide an appropriate response
        res.status(400).json({ error: 'Invalid value for oldNew' });
    }
    function isAppleDevice() {
        const parser = new UAParser();
        const result = parser.getResult();
        return result.device.vendor === "Apple" || /iPhone|iPad|Mac/.test(result.device.model) || result.os.name === "Mac OS";
    }
})
app.get('/delWebRec', function (req, res) {
    res.render('delWebRec.pug', {urlObj});
})
app.get('/userNameGen', function (req, res) {
    res.render('unGen.pug', { nonce: res.locals.nonce });
})
app.get('/delApptRec', function (req, res) {
    res.render('delApptRec.pug', { apptObj });
})
app.get('/unGenAppt', function (req, res) {
    res.render('unGenAppt.pug', { nonce: res.locals.nonce });
})
app.post('/genWebPw', function (req, res) {
    console.log('reqBody: ', req.body, 'reqSelf: ', req.body.self);
    const webUserName = req.body.webUserName;
    const length = req.body.length;
    const newUrl = req.body.url;
    const usrName = req.body.usrName;
    console.log('usrName: ', usrName);
    var lowCase = true;
    var upCase = true;
    var num = true;
    var spec = true;
    var urlArr = [];
    var password = '';
    if (req.body.self) {
        password = req.body.self;
    } else {
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
        password = generator.generate({
            length: length,
            lowercase: lowCase,
            uppercase: upCase,
            numbers: num,
            symbols: spec

        })
    }
    let pwObj = { url: newUrl, webUn: webUserName, webPw: password };
    const authTok = req.body.token;
    const message = 'Your authorization to proceed fails, please login again.';
    var result = sess.sessTokenVrfy(authTok);
    if (result.decoded) {
        console.log('Token is valid:', result.decoded); // Proceed with using the decoded user data 
        console.log('url: ', pwObj.url, ', webUserName:', webUserName, ', password: ', password);
        // Display the password and to store login credentials
        res.render('resultPassw.pug', { pwObj, nonce: res.locals.nonce });
    } else if (result.error) {
        if (result.error.name === 'TokenExpiredError') {
            console.log('Token has expired');
            //alert('Your authorization to proceed fails, please login again.');
            res.render('err.pug', { message });
        } else if (result.error.name === 'JsonWebTokenError') {
            console.log('Token is invalid');
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', { message });
        } else {
            console.log('Token verification error:', result.error.message);
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', {message});
        }
    }
    /*
    //To obtain userAgent - browser, os, cpu, etc
    const userAgent = req.headers['user-agent'];
    var browserUse, os, cpu, device, engine;
    // Initialize the parser with the user agent string
    if (userAgent) {
        let parser = new uaParser();
        parser.setUA(userAgent);
        let parserResults = parser.getResult();
        browserUse = parserResults.browser; // Correctly access the browser information
        os = parserResults.os;
        cpu = parserResults.cpu;
        engine = parserResults.engine;
        device = parserResults.device;
    } else {
        console.log('User-Agent header is missing');
    }
    
    //let firstWeb = 'yes';
    //updUsWebDb(pwObj); //not used because asynch function not in time with res.render()
    /*const promise1 = updUsWebDb(pwObj);
    const promise2 = 22;
    Promise.all([promise1, promise2])
        .then(() => {
            console.log('url: ', pwObj.url, ', webUserName:', webUserName, ', password: ', password);
            // Display the password and to store login credentials
            res.render('resultPassw.pug', { pwObj, firstWeb });
        });
        .catch ((error) => {
            console.error('promise.all-1 error: ', error);
            res.render('resultPassw.pug', { pwObj, firstWeb });
        });*/
    //function to update UserWebs DB model
    /*async function updUsWebDb(obj) { //to modify to find usrName and add new url if found, else add new usrName and url
        try {
            const query = UserWebs.findOne({ userName: usrName });
            const doc = await query.exec();
            if (doc) { //To check if name exists
                doc.webUrl.push(obj.url);
                await doc.save();
                console.log('New url: ', obj.url, ' added for user: ', usrName);
                firstWeb = 'no';
            } else {
                urlArr.push(obj.url);
                //UserWebs define above
                const u0 = new UserWebs({ userName: usrName, webUrl: urlArr, browser: browserUse.name, os: os.name, cpu: cpu.architecture, device: device.vendor, engine: engine.name });
                await u0.save();
                console.log(`User: ${usrName} and new url added to UserWebs DB`);
                //return 'yes';
            }
        
        } catch (err) {
            console.log(err);
            //return 'yes';
        }
        if (firstWeb==='yes') {
            console.log('First web in genWebPw is True.');
        } else {
            console.log('First web in genWebPw is False.');
    }
    }*/
})
app.post('/genApptPw', function (req, res) {
    console.log('reqBody: ', req.body, 'reqSelf: ', req.body.self);
    const apptUserName = req.body.apptUserName;
    const length = req.body.length;
    const newAppt = req.body.appt;
    const usrName = req.body.usrName;
    console.log('usrName: ', usrName);
    var lowCase = true;
    var upCase = true;
    var num = true;
    var spec = true;
    var urlArr = [];
    var password = '';
    if (req.body.self) {
        password = req.body.self;
    } else {
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
        password = generator.generate({
            length: length,
            lowercase: lowCase,
            uppercase: upCase,
            numbers: num,
            symbols: spec

        })
    }
    let pwObj = { appt: newAppt, apptUn: apptUserName, apptPw: password };
    const authTok = req.body.token;
    const message = 'Your authorization to proceed fails, please login again.';
    var result = sess.sessTokenVrfy(authTok);
    if (result.decoded) {
        console.log('Token is valid:', result.decoded); // Proceed with using the decoded user data 
        console.log('app: ', pwObj.appt, ', appUserName:', apptUserName, ', password: ', password);
        // Display the password and to store login credentials
        res.render('resultPwAppt.pug', { pwObj, nonce: res.locals.nonce });
    } else if (result.error) {
        if (result.error.name === 'TokenExpiredError') {
            console.log('Token has expired');
            //alert('Your authorization to proceed fails, please login again.');
            res.render('err.pug', { message });
        } else if (result.error.name === 'JsonWebTokenError') {
            console.log('Token is invalid');
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', { message });
        } else {
            console.log('Token verification error:', result.error.message);
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', { message });
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
    const newUrl = req.body.newUrl;
    /*let obj = data.getDataObj();
    if (urlObj.url === obj.url) { //urlObj is global variable and assigned value in /webAccess 
        data.setDataObj(obj.url, webUserName, obj.pwd);
    } else {
        data.setDataObj(urlObj.url, webUserName, obj.pwd);
    }*/
    const authTok = req.body.token;
    console.log('Token: ', authTok);
    var result = sess.sessTokenVrfy(authTok);
    const message = 'Your authorization to proceed fails, please login again.';
    let unObj = { url: newUrl, webUn: webUserName };
    if (result.decoded) {
        console.log('Token is valid:', result.decoded); // Proceed with using the decoded user data 
        console.log('User Name: ', webUserName, ', url: ', unObj.url, ', authToken: ', authTok);
        res.render('pwGen.pug', { unObj, nonce: res.locals.nonce });//Next go to generating password page

    } else if (result.error) {
        if (result.error.name === 'TokenExpiredError')
        {
            console.log('Token has expired');
            //alert('Your authorization to proceed fails, please login again.');
            res.render('err.pug', {message});
        } else if (result.error.name === 'JsonWebTokenError') {
            console.log('Token is invalid');
            console.log('User Name: ', webUserName, ', url: ', unObj.url, ', authToken: ', authTok);
            res.render('err.pug', {message});
        } else {
            console.log('Token verification error:', result.error.message);
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', {message});
        }
    }
    //let unObj = {url: newUrl, webUn: webUserName};
    //webLoginJSON = unObj.stringify();
    //console.log('User Name: ', webUserName, 'url: ', unObj.url);
    //res.render('pwGen.pug', { unObj });//Next go to generating password page

})
app.post('/genApptUn', function (req, res) {
    var apptUserName = '';
    if (req.body.self) {
        apptUserName = req.body.self;
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
        apptUserName = generator.generate({
            length: length,
            lowercase: lowCase,
            uppercase: upCase,
            numbers: num,
            symbols: spec

        })
    }
    const newAppt = req.body.newAppt;
    /*let obj = data.getDataObj();
    if (urlObj.url === obj.url) { //urlObj is global variable and assigned value in /webAccess 
        data.setDataObj(obj.url, webUserName, obj.pwd);
    } else {
        data.setDataObj(urlObj.url, webUserName, obj.pwd);
    }*/
    const authTok = req.body.token;
    console.log('Token: ', authTok);
    var result = sess.sessTokenVrfy(authTok);
    const message = 'Your authorization to proceed fails, please login again.';
    let unObj = { appt: newAppt, apptUn: apptUserName };
    if (result.decoded) {
        console.log('Token is valid:', result.decoded); // Proceed with using the decoded user data 
        console.log('User Name: ', apptUserName, ', App: ', unObj.appt, ', authToken: ', authTok);
        res.render('pwGenAppt.pug', { unObj, nonce: res.locals.nonce });//Next go to generating password page

    } else if (result.error) {
        if (result.error.name === 'TokenExpiredError') {
            console.log('Token has expired');
            //alert('Your authorization to proceed fails, please login again.');
            res.render('err.pug', { message });
        } else if (result.error.name === 'JsonWebTokenError') {
            console.log('Token is invalid');
            console.log('User Name: ', apptUserName, ', App: ', unObj.appt, ', authToken: ', authTok);
            res.render('err.pug', { message });
        } else {
            console.log('Token verification error:', result.error.message);
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', { message });
        }
    }
    //let unObj = {url: newUrl, webUn: webUserName};
    //webLoginJSON = unObj.stringify();
    //console.log('User Name: ', webUserName, 'url: ', unObj.url);
    //res.render('pwGen.pug', { unObj });//Next go to generating password page

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
    const authTok = req.body.token;
    var result = sess.sessTokenVrfy(authTok);
    const message = 'Your authorization to proceed fails, please login again.';
    if (result.decoded) {
        console.log('Token is valid:', result.decoded); // Proceed with using the decoded user data 
    } else if (result.error) {
        if (result.error.name === 'TokenExpiredError') {
            console.log('Token has expired');
            //alert('Your authorization to proceed fails, please login again.');
            res.render('err.pug', {message});
        } else if (result.error.name === 'JsonWebTokenError') {
            console.log('Token is invalid');
            //alert('Your authorization to proceed fails, please relogin.');
            res.render('err.pug', {message});
        } else {
            console.log('Token verification error:', result.error.message);
            //alert('Your authorization to proceed fails, please relogin.');
            res.rener('err.pug', {message});
        }
    }
    let webObj = { url: web };
    res.render('getWebPwd.pug', { webObj, nonce: res.locals.nonce });
})
app.get('/ffi', function (req, res) { //Called from scripts/capPhoto2.js
    var usrData, authTok, usrId, userAgent, browser, os, cpu;
    const queryParam = req.query;
    var name = queryParam.usrName;
    var faceOk = false;
    console.log(`login name: ${name}`);
    //var voi=ref.types.void;
    var int = ref.types.int;
    var bool = ref.types.bool;
    var string = ref.types.CString;
    const dllPath = path.join(__dirname, 'x64', 'Release', 'pwdNmLib.dll');//'C:\\Users\\k_pic\\source\\repo\\1FirstPass\\x64\\Release\\pwdNmLib.dll';
    console.log(dllPath);
    if (fs.existsSync(dllPath)) {
        console.log('DLL path exists: ', dllPath);
    } else {
        console.log('DLL path does not exist: ', dllPath);
    }
    // Define the types for your function return and argument types
    var myFunction = ffin.Library(dllPath, { //'C:\Users\k_pic\source\repo\1FirstPass\x64\Release\pwdNmLib.dll'
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
            res.render('rePhotoLog.pug', { remObj, username: name});
        }
    } else {
        console.log(` faceOk: ${faceOk}.`, 'Face login is completed and successful.');
        const promise3 = findUsrId(name);//this function obtain usrId
        const promise4 = getUsrAgent(name)//
        Promise.all([promise3, promise4]) //promise.all-2
            .then(() => {
                usrData = { 'id': usrId, 'username': name };
                authTok = sess.sessLogin(usrData);//authTok life is 2 hours
                req.session.usrId = usrId;
                req.session.usrName = name;
                req.session.authToken = authTok;
                req.session.login = true;
                userAgent = { 'Browser': browser, 'OS': os, 'CPU': cpu };
                res.render('validLogin.pug', { authTok, usrData, userAgent })
            })
    }
    async function findUsrId(name) {
            const query = Users.findOne({ userName: `${name}` });
            const doc = await query.exec();
            usrId = doc.id;
            //console.log('id: ', usrId);
    }
    async function getUsrAgent(name) { //to find user-agent info
            try {
                const query = UserWebs.findOne({ userName: name });
                const doc = await query.exec();
                if (doc) { //To check if name exists
                    browser = doc.browser;
                    os = doc.os;
                    cpu = doc.cpu;
                    console.log('browser: ', browser, ' os: ', os, ' cpu: ', cpu);

                } else {
                    console.log(`Cannot get user-agent of ${name}`);
                }

            } catch (err) {
                console.log(err);
            }

    }
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

/*app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});*/
