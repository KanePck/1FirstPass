//To obtain authorized token of a user
var token = localStorage.getItem('authToken');
console.log('token: ', token);
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('authToken').value = token;
});