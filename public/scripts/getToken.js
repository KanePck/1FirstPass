//Called from usernameGen.pug
var token = sessionStorage.getItem('authToken');
console.log('token: ', token);
document.addEventListener('DOMContentLoaded', function () {
    //const token = sessionStorage.getItem('authToken');
    if (sessionStorage.getItem('authToken')) {
        document.getElementById('authToken').value = sessionStorage.getItem('authToken');
        console.log('token: ', sessionStorage.getItem('authToken'));
    } else {
        console.log('Error!, cannot read token from browser.');
    }
    const newUrl = document.getElementById('newUrl').value;
    const pattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (pattern.test(newUrl)) {
        localStorage.setItem('newUrl', newUrl);
    } else {
        localStorage.setItem('newApp', newUrl);
    }
});