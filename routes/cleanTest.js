'use strict';
var debug = require('debug')('my express app');
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const mongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
var router = express.Router();
var uaParser = require('ua-parser-js');
var debug = require('debug')('my express app');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('dotenv').config();
const ffin = require('ffi-napi');
const ref = require('ref-napi');
const bcrypt = require('bcrypt');
const generator = require('generate-password');
const { body, validationResult } = require("express-validator");
const { isLength } = require('validator');
const { isEmail } = require('validator');
//const { checkSchema, matchedData } = require('./node_modules/express-validator/src/index');
const app = express();
const secretKey = process.env.secretKey || crypto.randomBytes(64).toString('hex');
app.use((req, res, next) => {
    console.log('Basic Middleware Check1');
    next();
});
mongoose.set("strictQuery", false);
var sid, store;
var uri = process.env.mongodbUri;//define in .env file in ExpressPwdNoMore folder
async function connectDb() {
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (err) {
        console.log(err);
    }
}
async function sessInit() {
    await connectDb();
    // Initialize client.
    store = new mongoDBStore({
        uri: uri,
        collection: 'mySession'
    });

    // Catch errors
    store.on('error', function (error) {
        console.log(error);
    });
    console.log('store not error');
}
    app.use(session({ //initialize session
        genid: function (req) {
            return crypto.randomUUID() // use UUIDs for session IDs
        },
        secret: secretKey,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
        },
        store: store,
        resave: true, // required: force lightweight session keep alive (touch)
        saveUninitialized: true, // recommended false: only save session when data exists

    }))
    console.log('session passed');

app.use((req, res, next) => {
    console.log('Basic Middleware Check2');
    next();
});
app.get('/', (req, res) => {
    sessInit();
    res.send('Hello, world!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
