//Call from pwGen.pug
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formPassw');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop form from reloading the page

            // 1. Figure out which button triggered the submit
            const action = e.submitter.id;
            let finWebPassw = ''; //Final web password

            if (action === 'selfBtn') {
                // User provided their own password
                finWebPassw = document.getElementById('self').value;
                if (!finWebPassw) return alert("Please enter a password.");
            }
            else if (action === 'genBtn') {
                // User wants an auto-generated password
                const options = {
                    length: parseInt(document.getElementById('length').value),
                    // Check if the "Yes" radio button is checked
                    includeUpper: document.querySelector('input[name="upCase"]:checked').value === 'yes',
                    includeLower: document.querySelector('input[name="lowCase"]:checked').value === 'yes',
                    includeNumbers: document.querySelector('input[name="numChar"]:checked').value === 'yes',
                    includeSpecial: document.querySelector('input[name="specChar"]:checked').value === 'yes'
                };
                finWebPassw = generateSecurePassword(options);
            }

            // 2. Put the result into the hidden field
            document.getElementById('passwordResult').value = finWebPassw;

            // 3. NOW start your Zero-Knowledge encryption!
            console.log("Ready to encrypt:", finWebPassw);
            try {
                await encryptAndSave(finWebPassw);
            } catch (error) {
                console.log('Encrypt and save failed with this error: ', error);
            }
        });
    }
});
function generateSecurePassword(options) {
    const { length, includeUpper, includeLower, includeNumbers, includeSpecial } = options;

    const charSets = {
        upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lower: "abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        special: "!@#$%^&*()_+~`|}{[]:;?><,./-="
    };

    let allChars = "";
    let guaranteedChars = [];

    // Build the pool and ensure at least one of each selected type is included
    if (includeUpper==='yes') {
        allChars += charSets.upper;
        guaranteedChars.push(getRandomChar(charSets.upper));
    }
    if (includeLower==='yes') {
        allChars += charSets.lower;
        guaranteedChars.push(getRandomChar(charSets.lower));
    }
    if (includeNumbers==='yes') {
        allChars += charSets.numbers;
        guaranteedChars.push(getRandomChar(charSets.numbers));
    }
    if (includeSpecial==='yes') {
        allChars += charSets.special;
        guaranteedChars.push(getRandomChar(charSets.special));
    }

    if (allChars === "") return ""; // No options selected

    let password = [...guaranteedChars];

    // Fill the rest of the length
    for (let i = password.length; i < length; i++) {
        password.push(getRandomChar(allChars));
    }

    // Shuffle the result so the "guaranteed" chars aren't always at the start
    return shuffleArray(password).join('');
}

// Cryptographically secure random character picker
function getRandomChar(str) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Use modulo to pick an index from the string
    return str[array[0] % str.length];
}

// Secure shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = getRandomCharIndex(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomCharIndex(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
}
function bufToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
function hexToBuf(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;
}
async function encryptAndSave(finalPassword) {
    // 1. Get the Public Key from sessionStorage
    const pubKeyHex = sessionStorage.getItem('pubKey');
    console.log('pubKeyHex: ', pubKeyHex);
    if (pubKeyHex) {
        const publicKey = await window.crypto.subtle.importKey(
            "spki",
            hexToBuf(pubKeyHex),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["wrapKey"]
        );

        // 2. Generate a fresh DEK (AES-GCM)
        const dek = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 3. Encrypt the password with the DEK
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedPw = new TextEncoder().encode(finalPassword);
        const encryptedPwBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            dek,
            encodedPw
        );

        // 4. "Wrap" the DEK with the RSA Public Key
        const wrappedDekBuffer = await window.crypto.subtle.wrapKey(
            "raw",
            dek,
            publicKey,
            { name: "RSA-OAEP" }
        );

        // 5. Prepare data for the Server (Convert to Hex)
        const authTok = document.getElementById('authToken').value;
        const payload = {
            userName: document.querySelector('input[name="usrName"]').value,
            webUserName: document.querySelector('select[name="webUserName"]').value,
            url: document.querySelector('input[name="url"]').value,
            urlOpt: document.querySelector('input[name="urlOpt"]').value,
            encryptedData: bufToHex(encryptedPwBuffer),
            wrappedDek: bufToHex(wrappedDekBuffer),
            iv: bufToHex(iv)
        };

        // 6. Send to MongoDB via your Express route
        const response = await fetch('/genWebPw2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: authTok, payload: payload })
        });

        if (response.ok) {
            alert("Password secured and saved!");
            const currentOrigin = window.location.origin;
            const dashUrl = `${currentOrigin}/dashBoard`;
            window.location.href = dashUrl;
        }
    } else {
        console.log('Cannot get pubKey from session storage.');
    }
}