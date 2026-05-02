//Lists of websites of user database model 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userWebsSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Must be a MongoDB ID
        ref: 'User',                           // Points to the User model
        required: [true, "A vault entry must belong to a user"] // Validation
    },
    userName: { type: String, required: true },
    webUrl: { type: String, required: true },
    webUserName: { type: String, required: true },
    encryptedWebPw: { type: String, required: true },
    wrappedDek: { type: String, required: true },
    iv: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Create an index on userId for lightning-fast lookups
userWebsSchema.index({ userId: 1 });

module.exports = mongoose.model('UserWebs', userWebsSchema);