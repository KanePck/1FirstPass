//urls of user's websites database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userDbSchema = new Schema({
    userName: { type: String, required: true },
    hashPassw: { type: String, required: true },
    derivedKey: {type: String, required: true},
    encPrvKey: { type: String, required: true },
    publicKey: {type: String, required: true},
    usrFilePath: { type: String, required: false },
    opSys: { type: String, required: false },
});
module.exports = mongoose.model('db', userDbSchema);