//Call from dashBoard.pug
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get the Private Key from sessionStorage
    const prvKeyHex = sessionStorage.getItem('prvKey');//prvKey was set in handleLogin.js
    if (!prvKeyHex) return console.error("Not logged in or session expired.");

    // 2. Re-import the Private Key so the browser can use it
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        hexToBuf(prvKeyHex),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["unwrapKey"]
    );

    // 3. Find all encrypted password rows in your Pug/HTML
    const passwordRows = document.querySelectorAll('.vault-item');
    let clearPw = false;
    for (const row of passwordRows) {
        try {
            //Must match the exact names used in Pug (minus the data- prefix).
            const { encrypted, wrapped, iv } = row.dataset;
            //console.log(row.dataset);
            // Step A: Unwrap the DEK using your RSA Private Key
            const dek = await window.crypto.subtle.unwrapKey(
                "raw",
                hexToBuf(wrapped),
                privateKey,
                { name: "RSA-OAEP" },
                { name: "AES-GCM", length: 256 },
                true,
                ["decrypt"]
            );

            // Step B: Decrypt the actual password using the DEK
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: hexToBuf(iv) },
                dek,
                hexToBuf(encrypted)
            );

            // Step C: Convert back to string and display
            const clearText = new TextDecoder().decode(decryptedBuffer);
            row.querySelector('.password-display').textContent = clearText;
            const passBtn = row.querySelector('.copyPassBtn');
            //set data-pass to password value in pug: button.copyPassBtn(data-pass="" data-url=item.webUrl) Copy
            passBtn.dataset.pass = clearText;
            clearPw = true;
        } catch (err) {
            console.error("Decryption failed for an item:", err);
            row.querySelector('.password-display').textContent = "[Error Decrypting]";
        }
    }

    const currentOrigin = window.location.origin;
    if (clearPw) {
        document.querySelector('.vault-table').addEventListener('click', async (e) => {
            // --- CASE 1: Copy Username ---
            if (e.target.classList.contains('copyUserBtn')) {
                const username = e.target.dataset.user;
                await navigator.clipboard.writeText(username);
                showToast(`Username copied: ${username}`);
            }
            // --- CASE 2: Copy Password ---
            if (e.target.classList.contains('copyPassBtn')) {
                const password = e.target.dataset.pass;
                // Find the parent row containing all the data
                const row = e.target.closest('.vault-item');
                const url = row.dataset.url;
                if (!password) return alert("Not decrypted yet!");
                await navigator.clipboard.writeText(password);
                showToast(`Password of website ${url} copied!`);
            }
            // --- CASE 3: Delete Entry ---
            if (e.target.classList.contains('deleteBtn')) {
                const itemId = e.target.dataset.id;
                const usrId = sessionStorage.getItem('usrId');
                if (confirm('Delete this entry?')) {
                    const delEntUrl = `${currentOrigin}/deleteEntry?itemId=${encodeURIComponent(itemId)}&usrId=${encodeURIComponent(usrId)}`;
                    window.location.href = delEntUrl;
                }
            }
        });
    }
});
function hexToBuf(hex) {
    if (!hex) return new Uint8Array();
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
function showToast(message) {
    // 1. Ensure a container exists on the page
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
        console.log("Container created and appended to body.");
    }

    // 2. Create the toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Use prepend so the newest message is always at the TOP
    container.prepend(toast);

    // Force a "reflow" so the browser notices the element exists before animating
    toast.offsetHeight;

    // Add the show class
    toast.classList.add('show');

    // Clean up
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
            // If container is empty, remove it too to keep DOM clean
            if (container.childNodes.length === 0) container.remove();
        });
    }, 3000);
}