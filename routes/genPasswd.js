const crypto = require('crypto');

function genPasswd(length, capLet, num, spec) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
    const capChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numChar = '0123456789';
    const specChar = '!@#$%^&*()_-+=';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        const index = bytes[i] % charset.length;
        password += charset[index];
    }
    return password;
}

module.exports = genPasswd;
