//Call from fail3logPw.pug
document.addEventListener('DOMContentLoaded', () => {
    const usrId = document.getElementById('usrId').value;
    const usrName = document.getElementById('name').value;
    const btn = document.getElementById('recovKey');
    btn.addEventListener('click', () => {
        const key = document.getElementById('keyInput').value;
        if (!key) {
            alert('Recovery Key is blank, please complete input the key.');
            return;
        }
        handleKey(key, usrId, usrName);
    })

})
const bufToHex = (buf) => {
    // Ensure we are looking at the buffer as an array of 8-bit bytes
    const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return Array.from(view)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};
//Helper: Converts Hex strings from MongoDB back into binary Uint8Arrays so the Web Crypto API can process them.
function hexToBuf(hex) {
    if (!hex) return new Uint8Array();
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
async function handleKey(key, usrId, username) {
    const currentOrigin = window.location.origin;
    const response = await fetch('/recovKeyHdlr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    const data = await response.json();
    try {
        // Try to open the Recovery Box with the provided key
        const privateKey = await unlockRecovBox(key, data.recoveryBox);
        const publicKey = data.publicKey;
        await saveSession(privateKey, publicKey);
        alert("Your Recovery Key is valid.");
        //To server /servLoginHdlr for 2FA process
        const f2faUrl = `${currentOrigin}/vaultRecovKey?id=${encodeURIComponent(usrId)}`;
        window.location.href = f2faUrl;
    } catch (err) {
        console.error("Full Error Trace:", err);
        alert(`Invalid Recovery Key (Decryption failed) with error:  ${ err }`);
        await handleFailedAttempt(username);
    }
}
//Main Function: Unlocks the Private Key using the Recovery Key.
async function unlockRecovBox(key, recoveryBox) {
    const encoder = new TextEncoder();

    // 1. Import the raw password string as a CryptoKey
    const recovKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(key),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // 2. Re-derive the AES Master Key using the SALT from the database
    // Note: Iterations must match EXACTLY what you used during setup (600,000)
    const masterKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: hexToBuf(recoveryBox.salt),
            iterations: 100000,
            hash: "SHA-256"
        },
        recovKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["unwrapKey"]
    );

    // 3. Use the Master Key to unwrap (decrypt) the Private Key
    // If the password is wrong, this step throws an error automatically.
    const privateKey = await window.crypto.subtle.unwrapKey(
        "pkcs8",                            // The format the key was wrapped in
        hexToBuf(recoveryBox.encryptedKey),   // The actual encrypted bytes
        masterKey,                          // The key derived from the password
        {
            name: "AES-GCM",
            iv: hexToBuf(recoveryBox.iv)       // The IV from the database
        },
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,                               // Allow the key to be used for decryption
        ["decrypt", "unwrapKey"]            // Key usages
    );

    return privateKey;
}
//To save both keys to session storage
async function saveSession(privateKey, publicKey) {
    try {
        // 1. Export the Private Key (because it's a CryptoKey object)
        const exportedPrv = await window.crypto.subtle.exportKey("pkcs8", privateKey);
        const prvKey = bufToHex(exportedPrv);
        // 2. Use the Public Key directly (because it's already a Hex string from the DB)
        // We don't call exportKey on it!
        const pubKey = publicKey;
        // 3. Convert to Hex and store
        sessionStorage.setItem('prvKey', prvKey);
        sessionStorage.setItem('pubKey', pubKey);
        if (sessionStorage.getItem('prvKey') && sessionStorage.getItem('pubKey')) {
            console.log('saveSession done.', 'prvKey: ', prvKey, 'pubKey: ', pubKey);
        } else {
            console.log('sessionStorage of prvKey and pubKey failed.');
        }

    } catch (error) {
        console.error('saveSession error details:', error);
        throw error;
    }
}