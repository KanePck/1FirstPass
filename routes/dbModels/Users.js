//users database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
    userName: { type: String, required: true, maxLength: 10 },
    email: { type: String, required: true, maxLength: 30 },
    mPhone: { type: Number, required: true, maxLength: 20 },
    dateJoin: {type: Date},
});
module.exports = mongoose.model("Users", usersSchema);