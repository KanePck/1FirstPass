//Call from passwLog.pug
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const counts = document.getElementById('logCount').value;
    let loginCounts = 3 - counts;
    if (form) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('name').value;
            const password = document.getElementById('passw').value;
            console.log("Form intercepted. Processing login for:", username);
            //let loginAttempts = loginCounts;
            handleLogin(username, password, loginCounts);
        });
    } else {
        console.log('LoginForm not detected.');
    }
});

const bufToHex = (buf) => {
    // Ensure we are looking at the buffer as an array of 8-bit bytes
    const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return Array.from(view)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};
async function handleLogin(username, password, loginAttempts) {
    const response = await fetch('/loginCheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    const data = await response.json();
    const currentOrigin = window.location.origin;
    if (data.version === 1) {
        // --- STEP 1: Verify old password on the server ---
        const verifyRes = await fetch('/verifyVer1Passw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });
        if (verifyRes.ok) {
            console.log("Legacy password verified. Upgrading to Option B...");
            // --- TRIGGER MIGRATION ---
            console.log("Upgrading user to Option B...");

            // 1. Run the setup logic we built earlier
            const security = await setupUserSecurity(password);

            // 2. Send the new boxes to a 'complete-migration' route
            await fetch('/completeMigration', { //fetch and Post working fine here cause it return with res.sendStatus(200).
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    securityPayload: security.payloadForServer
                })
            });
            alert("Account upgraded! Please save your Recovery Key: " + security.recoveryKeyString);
            downloadRecoveryKey(username, security.recoveryKeyString);
            // 3. To server for 2FA process
            const f2faUrl = `${currentOrigin}/servLoginHdlr?name=${encodeURIComponent(username)}`;
            window.location.href = f2faUrl;
        } else {
            showToast("Invalid legacy password.");
            await handleFailedAttempt(username);
        }
    } else if (data.version === 2) {
        // --- STANDARD LOGIN ---
        try {
            if (!data || !data.masterBox) {
                throw new Error("Server did not return MasterBox data.");
            }
            // Try to open the Master Box with the provided password
            const privateKey = await unlockMasterBox(password, data.masterBox);
            alert("Your master passsword is valid.");
            const publicKey = data.publicKey;
            await saveSession(privateKey, publicKey);
            sessionStorage.setItem('isLoggedIn', 'true');
            //To server /servLoginHdlr for 2FA process
            const f2faUrl = `${currentOrigin}/servLoginHdlr?name=${encodeURIComponent(username)}`;
            window.location.href = f2faUrl;            
        } catch (err) {
            alert(`Invalid password (Decryption failed) with error: ${err}`);
            await handleFailedAttempt(username);
        }
    }
    async function handleFailedAttempt(name) {
        loginAttempts++;
        if (loginAttempts >= 3) {
            alert("Failed 3 attempts. Password reset or else.");
            //To server that would redirect to fail3LogPw.pug
            const f3Url = `${currentOrigin}/fail3LogHdlr?name=${encodeURIComponent(name)}`;
            window.location.href = f3Url;

        } else {
            const remAttempt = 3 - loginAttempts;
            alert(`Incorrect password. ${remAttempt} attempts remaining.`);
            // This is what you want for a page change:
            const fUrl = `${currentOrigin}/retryLog?name=${encodeURIComponent(name)}&remAttempt=${remAttempt}`;
            window.location.href = fUrl;
            //window.location.href = `/retryLog?name=${encodeURIComponent(name)}&remAttempt=${remAttempt}`;
        }
    }
}
//Helper: Converts Hex strings from MongoDB back into binary Uint8Arrays so the Web Crypto API can process them.
function hexToBuf(hex) {
    if (!hex || typeof hex !== 'string') {
        console.error("hexToBuf received invalid input:", hex);
        return new Uint8Array();
    }
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}


//Main Function: Unlocks the Private Key using the Master Password.
async function unlockMasterBox(password, masterBox) {
    const encoder = new TextEncoder();

    // 1. Import the raw password string as a CryptoKey
    const passwordKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // 2. Re-derive the AES Master Key using the SALT from the database
    // Note: Iterations must match EXACTLY what you used during setup (600,000)
    const masterKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: hexToBuf(masterBox.salt),
            iterations: 600000,
            hash: "SHA-256"
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["unwrapKey"]
    );

    // 3. Use the Master Key to unwrap (decrypt) the Private Key
    // If the password is wrong, this step throws an error automatically.
    const privateKey = await window.crypto.subtle.unwrapKey(
        "pkcs8",                            // The format the key was wrapped in
        hexToBuf(masterBox.encryptedKey),   // The actual encrypted bytes
        masterKey,                          // The key derived from the password
        {
            name: "AES-GCM",
            iv: hexToBuf(masterBox.iv)       // The IV from the database
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
async function setupUserSecurity(password) {
    const encoder = new TextEncoder();

    // --- STEP 1: Derive the Master Key from Password ---
    const passwordKey = await window.crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const masterSalt = window.crypto.getRandomValues(new Uint8Array(16));
    const masterKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: masterSalt, iterations: 600000, hash: "SHA-256" },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        true, ["wrapKey", "unwrapKey"]
    );

    // --- STEP 2: Generate the RSA "Anchor" Key Pair ---
    const rsaKeyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );

    // --- STEP 3: Generate the actual Data Encryption Key (DEK) ---
    // This is the key that will encrypt all the web credentials
    const dek = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true, ["encrypt", "decrypt"]
    );

    // --- STEP 4: Wrap the DEK with the RSA Public Key ---
    // This is the "Lockbox" for the data worker key
    const wrappedDEK = await window.crypto.subtle.wrapKey(
        "raw",
        dek,
        rsaKeyPair.publicKey,
        { name: "RSA-OAEP" }
    );

    // --- STEP 5: Generate the Recovery Key & Wrap Private Key ---
    const recoveryKeyString = generateRecoveryString();
    const recoveryKeyMaterial = await window.crypto.subtle.importKey(
        "raw", encoder.encode(recoveryKeyString), "PBKDF2", false, ["deriveKey"]
    );
    const recoverySalt = window.crypto.getRandomValues(new Uint8Array(16));
    const recoveryKey = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: recoverySalt, iterations: 100000, hash: "SHA-256" },
        recoveryKeyMaterial,
        { name: "AES-GCM", length: 256 },
        true, ["wrapKey"]
    );

    // --- STEP 6: Wrap the Private Key (Two Lockboxes) ---
    const ivMaster = window.crypto.getRandomValues(new Uint8Array(12));
    const wrappedPrivateMaster = await window.crypto.subtle.wrapKey(
        "pkcs8", rsaKeyPair.privateKey, masterKey, { name: "AES-GCM", iv: ivMaster }
    );

    const ivRecovery = window.crypto.getRandomValues(new Uint8Array(12));
    const wrappedPrivateRecovery = await window.crypto.subtle.wrapKey(
        "pkcs8", rsaKeyPair.privateKey, recoveryKey, { name: "AES-GCM", iv: ivRecovery }
    );

    // --- STEP 7: Export Public Key ---
    const exportedPublicKey = await window.crypto.subtle.exportKey("spki", rsaKeyPair.publicKey);
    console.log("Master Key Hex:", bufToHex(wrappedPrivateMaster));
    console.log("Public Key Hex:", bufToHex(exportedPublicKey));
    return {
        recoveryKeyString,
        payloadForServer: {
            publicKey: bufToHex(exportedPublicKey),
            wrappedDEK: bufToHex(wrappedDEK), // The encrypted worker key
            masterBox: {
                encryptedKey: bufToHex(wrappedPrivateMaster),
                salt: bufToHex(masterSalt),
                iv: bufToHex(ivMaster)
            },
            recoveryBox: {
                encryptedKey: bufToHex(wrappedPrivateRecovery),
                salt: bufToHex(recoverySalt),
                iv: bufToHex(ivRecovery)
            }
        }
    };
}

// Helper: Generate a random readable string
function generateRecoveryString() {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('-');
}
function downloadRecoveryKey(username, recoveryKeyString) {
    const timestamp = new Date().toLocaleDateString();
    const fileContent = `
    =========================================
    SECURE PASSWORD VAULT - RECOVERY KEY
    =========================================
    User: ${username}
    Created: ${timestamp}
    
    YOUR RECOVERY KEY:
    ${recoveryKeyString}
    
    IMPORTANT:
    If you lose your Master Password, this key is the 
    ONLY way to recover your data. Keep it offline in 
    a safe place (like a printed paper or a USB drive).
    =========================================
    `;

    // Create a "Blob" (binary large object) for the file content
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a hidden link and "click" it to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `RecoveryKey_${username}.txt`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
