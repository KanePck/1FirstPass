/**Called from newUrl.pug
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('in newWeb.js');
    const h1Element = document.querySelector('h1[data-newUrl]');
    const newUrl = h1Element.getAttribute('data-newUrl');
    localStorage.setItem('newUrl', newUrl);

})
listenForClicks();
//Button click 
function listenForClicks() {
    document.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON" || !e.target.closest("#popupButt")) {
            // Ignore when click is not on a button within <div id="popupButt">.
            return;
        }

        const clickButt = e.target.textContent;
        const choose = buttonToUrl(clickButt);
        const fUrl = "https://localhost:1337/" + choose;
        window.open(fUrl);
        function buttonToUrl(popupButt) {
            var ret;
            switch (popupButt) {
                case "User Name":
                    ret = "userNameGen";
                    return ret;
                case "Delete":
                    ret = "delWebRec";
                    return ret;

            }
        }
    });
}
