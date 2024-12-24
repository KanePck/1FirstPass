//Lists of websites of user database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userWebsSchema = new Schema({
    userName: { type: String, required: true },
    webUrl: { type: Array, required: true },
    browser: { type: String, required: false },
    os: { type: String, required: false },
    cpu: { type: String, required: false },
    device: { type: String, required: false },
    engine: { type: String, required: false },
});
module.exports = mongoose.model('UserWebs', userWebsSchema);