//Check strong password and two passwords are matched. Called from masterPass.pug and pwResetForm.pug

// Define the function that performs the password check logic
function validatePasswordMatch() {
    const passw1 = document.getElementById('1passw').value;
    const passw2 = document.getElementById('2passw').value;
    const message = document.getElementById('message');
 
    if (passw1 === passw2) {
        message.textContent = 'Passwords match!';
        message.style.color = 'green';
        //strongPwdCheck(passw1);
    } else {
        message.textContent = 'Passwords do not match.';
        message.style.color = 'red';
        pwMatch = true;
    }
}
function strongPwdCheck() {
    const pwValue = document.getElementById('1passw').value;
    //console.log('pwValue: ', pwValue);
    const passwQ = document.getElementById('mpwq');
    if (!capitalRegExp.test(pwValue) || !numberRegExp.test(pwValue) || !specialCharRegExp.test(pwValue) || pwValue.length < 8) {
        passwQ.textContent = 'Input password not strong. Please revise.';
        passwQ.style.color = 'red';
    } else {
        passwQ.textContent = 'Input password strong enough to proceed.';
        passwQ.style.color = 'green';
        strongPw = true;
        finalPw = pwValue;
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
function renderRecoveryKit(key) {
    const container = document.body;
    container.innerHTML = `
        <div style="padding: 20px; border: 2px solid red; text-align: center;">
            <h2>?? SAVE YOUR RECOVERY KEY ??</h2>
            <p>If you lose your password, this is the ONLY way to get your data back.</p>
            <h1 style="background: #eee; padding: 10px;">${key}</h1>
            <button onclick="window.location.href='/login'">I have saved my key safely. Let's Login.</button>
        </div>
    `;
    downloadRecoveryKey(usrNm, key);
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
//Main program start here
// Regular expression for capital letters
const capitalRegExp = /[A-Z]/;
// Regular expression for numbers
const numberRegExp = /[0-9]/;
// Regular expression for special characters (consider adjusting based on your needs)
const specialCharRegExp = /[!@#$%^&*()_+\-=\[\]{};':"/?.<>|,\\]/;
let finalPw, usrNm;
let strongPw = false;
let pwMatch = false;
const bufToHex = (buf) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
// Attach the function to the 'keyup' event of the second password field
document.addEventListener('DOMContentLoaded', () => {
    const pwField = document.getElementById('1passw');
    usrNm = document.getElementById('usrNm').value;
    if (pwField) {
        pwField.addEventListener('keyup', strongPwdCheck);
    }
    const confirmedPasswordField = document.getElementById('2passw');
    //const passw2 = document.getElementById('2passw').value;
    if (confirmedPasswordField) {
        confirmedPasswordField.addEventListener('keyup', validatePasswordMatch);
        // It's often helpful to listen to the first field too
        document.getElementById('1passw').addEventListener('keyup', validatePasswordMatch);
        //strongPwdCheck(passw2);
    }
    document.getElementById('userRegForm').addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the page from reloading/sending raw data
        console.log('User registration form has been stopped');
        if (strongPw && pwMatch) {
            alert('Strong password and matches.');
            const option = document.getElementsByName('option').value;
            const userName = document.getElementById('usrNm').value;
            try {
                // 2. Run the Anchor/Option B logic we built
                // This generates the RSA pair, Master Box, and Recovery Box
                const security = await setupUserSecurity(password);

                // 3. Prepare the payload (The "Encrypted Bundle")
                const payload = {
                    username: userName,
                    photoOpt: option,
                    securityPayload: security.payloadForServer
                };

                // 4. Send to Node.js via Fetch
                const response = await fetch('/mpassHdlr2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    // 5. CRITICAL: Show the Recovery Key to the user
                    // In a real app, you'd show a "Download Recovery PDF" button here
                    renderRecoveryKit(security.recoveryKeyString);
                } else {
                    alert("Registration failed on server.");
                }

            } catch (err) {
                console.error("Security Setup Error:", err);
                alert("An error occurred during encryption. Please try again.");
            }
        } else {
            console.log('Password not strong and not match.');
            alert('Please input strong and matched passwords.')
            return;
        }
    });
    
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