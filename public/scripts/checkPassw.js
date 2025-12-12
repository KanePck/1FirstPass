//Check two passwords are matched. Called from masterPass.pug
// /scripts/checkPassw.js

// Define the function that performs the password check logic
function validatePasswordMatch() {
    const passw1 = document.getElementById('1passw').value;
    const passw2 = document.getElementById('2passw').value;
    const message = document.getElementById('message');

    if (passw1 === passw2) {
        message.textContent = 'Passwords match!';
        message.style.color = 'green';
    } else {
        message.textContent = 'Passwords do not match.';
        message.style.color = 'red';
    }
}

// Attach the function to the 'keyup' event of the second password field
document.addEventListener('DOMContentLoaded', () => {
    const confirmedPasswordField = document.getElementById('2passw');
    if (confirmedPasswordField) {
        confirmedPasswordField.addEventListener('keyup', validatePasswordMatch);
        // It's often helpful to listen to the first field too
        document.getElementById('1passw').addEventListener('keyup', validatePasswordMatch);
    }
});
/*document.addEventListener('keyup', (event) => {
    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(comparePassw, 500);
    function comparePassw() {
        const passw1 = document.getElementById('1passw').value;
        const passw2 = document.getElementById('2passw').value;
        if (passw1 != passw2) {
            document.getElementById('message').style.color = 'red';
            document.getElementById('message').innerHTML = 'Passwords are not exactly matching. Please correct.';
        } else {
            document.getElementById('message').style.color = 'green';
            document.getElementById('message').innerHTML = 'Passwords are matching.';
        }
    }
    
})*/