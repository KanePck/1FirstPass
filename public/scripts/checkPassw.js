//Check two passwords are matched. Called from masterPass.pug
document.addEventListener('keyup', (event) => {
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
    
})