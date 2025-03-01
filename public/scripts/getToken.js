//To obtain authorized token of a user
var token = localStorage.getItem('authToken');
console.log('token: ', token);
document.addEventListener('DOMContentLoaded', function () {
    //const token = localStorage.getItem('authToken');
    if (localStorage.getItem('authToken')) {
        document.getElementById('authToken').value = localStorage.getItem('authToken');
        console.log('token: ', localStorage.getItem('authToken'));
    } else {
        console.log('Error!, cannot read token from browser.');
    }
    
});