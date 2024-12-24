//To store session id to local storage
document.addEventListener('DOMContentLoaded', () => {
    console.log('in sessLocStore');
    const h1Element = document.querySelector('h1[data-uid]');
    const usrid = h1Element.getAttribute('data-uid');
    const pElement = document.querySelector('p[data-uname]')
    const usrname = pElement.getAttribute('data-uname');
    const divElement = document.querySelector('div[data-auth]');
    const authTok = divElement.getAttribute('data-auth');
    var login = true;
    localStorage.setItem('usrId', usrid);
    localStorage.setItem('usrName', usrname);
    localStorage.setItem('authToken', authTok);
    localStorage.setItem('login', login);
    console.log('user Id: ', localStorage.getItem('usrId'));
    console.log('authTok: ', localStorage.getItem('authToken'));
})