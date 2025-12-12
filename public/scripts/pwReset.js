//Called from fail3logPw.pug
document.addEventListener('DOMContentLoaded', () => {
    const h1Element = document.querySelector('h1[data-name]');
    const usrName = h1Element.getAttribute('data-name');
    listenForClicks(usrName);
})
//Button click 
function listenForClicks(name) {
    document.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON" || !e.target.closest("#pwReset")) {
            // Ignore when click is not on a button within <div id="pwReset">.
            return;
        }
        const currentOrigin = window.location.origin;
        const fUrl = `${currentOrigin}/pwReset`;
        //URL-encode the username to handle special characters (spaces, etc.).
        const encodedUsrName = encodeURIComponent(name);
        window.location.href = `${fUrl}?usr=${encodedUsrName}`;
    })
}