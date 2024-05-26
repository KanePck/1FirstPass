// uName.js (handles user info and exports the username)
let username = ''; // This would be set dynamically based on user info

function setUsername(newUsername) {
    username = newUsername;
}

function getUsername() {
    return username;
}

module.exports = { setUsername, getUsername };