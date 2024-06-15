//urls of user's websites database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const urlsSchema = new Schema({
    userName: { type: String, required: true },
    url: { type: String, required: true },
    passwd: { type: String, required: true },
});
module.exports = mongoose.model('Urls', urlsSchema);