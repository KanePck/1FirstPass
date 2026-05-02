//Keys of user database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userKeysSchema = new Schema({
    userName: { type: String, required: true },
    hashPassw: {type: String, required: false },
    wrappedDek: { type: String, required: true },
    publicKey: { type: String, required: true },
    // The new Zero-Knowledge Fields
    masterBox: {
        encryptedKey: String,
        salt: String,
        iv: String
    },
    recoveryBox: {
        encryptedKey: String,
        salt: String,
        iv: String
    },
    schemaVersion: { type: Number, default: 2 } // Version 2 = Anchor Model
});
module.exports = mongoose.model('UserKeys', userKeysSchema);
/*const userKeysSchema = new Schema({
    userName: { type: String, required: true },
    hashPassw: { type: String, required: true },
    derivedKey: {type: String, required: true},
    encPrvKey: { type: String, required: true },
    publicKey: {type: String, required: true},
    usrFilePath: { type: String, required: false },
    opSys: { type: String, required: false },
});*/
