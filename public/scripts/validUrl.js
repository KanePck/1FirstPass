//Call from validLogin.pug, postLogin.pug
let urlOk = false;
const submitBtn = document.getElementById('submit');
document.addEventListener('DOMContentLoaded', () => {
    const urlField = document.getElementById('nurl');
    if (urlField) {
        urlField.addEventListener('keyup', validateUrl);
    } else {
        console.log('Cannot locate urlField.');
    }
    //submitBtn.removeAttribute("disabled");
});
function validateUrl() {
    const urlInput = document.getElementById('nurl').value.trim();
    const urlQ = document.getElementById('urlOk');
    // Validate the URL format
    const pattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!pattern.test(urlInput)) {
        urlQ.textContent = "Invalid URL format! Please enter 'www.example.com' or 'http(s)://www.example.com'.";
        urlQ.style.color = 'red';
        //submitBtn.disabled = true;
    } else {
        urlQ.textContent = "Valid URL format.";
        urlQ.style.color = 'green';
        //submitBtn.disabled = false;
        urlOk = true;
    }
    //return true; // Allow form submission if validation passes
}