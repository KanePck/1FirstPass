//Called from scripts/readWebRec.js
console.log('In deleteWebRec.js');
listenForClicks();
//Button click 
function listenForClicks() {
    document.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") {
            // Ignore when click is not on a button within <div id="popup-content">.
            return;
        }

    })
    }