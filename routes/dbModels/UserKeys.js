//Keys of user database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userKeysSchema = new Schema({
    userName: { type: String, required: true },
    hashPassw: { type: String, required: true },
    derivedKey: {type: String, required: true},
    encPrvKey: { type: String, required: true },
    publicKey: {type: String, required: true},
    usrFilePath: { type: String, required: false },
    opSys: { type: String, required: false },
});
module.exports = mongoose.model('db', userKeysSchema);