//Call from getWebPwd.pug
async function verifyMasPwd(masPwd) {
    //Encrytion config parameters
    const algorithm = 'AES-GCM';// 'aes-256-gcm';
    const keyBytes = 32;
    const iterations = 600000;
    const digest = 'SHA-256';//strict syntax, differ in nodejs 'sha256'
    const validCheckString = "VAULT_MASTER_PASSWORD_IS_CORRECT";
    const hexToBuf = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    //let verify = false;
    let db;
    let dbName = 'webPwdDB';
    let dbStoreName = 'artifactStore';
    let versionNo, artObj;
    const message = document.getElementById("pwdVerify");
    const request = indexedDB.open(dbName);//if not 1, then version change
    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
    request.onblocked = () => {
        console.error("Database connection is blocked. Close other tabs or processes using the database.");
    };
    request.onsuccess = (event) => {
        db = event.target.result;
        versionNo = db.version;
        const tx = db.transaction(dbStoreName, 'readwrite');
        const store = tx.objectStore(dbStoreName);
        const storeReq = store.get('currentCheck');
        storeReq.onsuccess = evt => {
            artObj = evt.target.result;
            if (artObj) {
                console.log('salt: ', artObj.salt);
                const promise1 = validate(artObj);
                const promise2 = 22;
                Promise.all([promise1, promise2])
                    .then(([verify, prom2]) => {
                        if (verify) {
                            console.log('verify of validate() true.')
                            message.innerText = 'The input master password is correct.';
                            decryptPassw(pwObj, masPwd, artObj);
                        } else {
                            message.innerText = 'The input master password not correct, please reinput';
                            return;
                        }

                    })
                    .catch((err) => {
                        console.log('promise.all - 1, 2 error: ', err);
                        message.innerText = 'Verification of input master password failed.';
                        return;
                    });
            } else {
                console.log('No artifact found with ID: currentCheck');
                message.innerText = 'Verification of input master password failed.';
                return;
            }
        }

    }
    async function validate(artObj) {
        try {
            //const hexToBuf = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            // Convert all your stored hex strings to TypedArrays
            const salt = hexToBuf(artObj.salt);
            const iv = hexToBuf(artObj.iv);
            const tag = hexToBuf(artObj.tag);
            const data = hexToBuf(artObj.content);

            // Combine data + tag for SubtleCrypto
            const combined = new Uint8Array(data.length + tag.length);
            combined.set(data);
            combined.set(tag, data.length);
            //encode master password
            const encoder = new TextEncoder();
            const pwdBuf = encoder.encode(masPwd);
            //1. Derive the master key
            const baseKey = await window.crypto.subtle.importKey(
                'raw', pwdBuf, 'PBKDF2', false, ['deriveKey']
            );
            let derivedKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: iterations, // MUST match your server-side value
                    hash: digest

                },
                baseKey,
                { name: algorithm, length: 256 },
                false, // Key cannot be exported for security
                ['decrypt']
            );
            // 2. Attempt to decrypt the 'content'
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: algorithm, iv: iv },
                derivedKey,
                combined
            );

            const decryptedString = new TextDecoder().decode(decryptedBuffer);

            // 3. Clean up memory
            pwdBuf.fill(0);
            derivedKey = null;

            // 4. Check if the decrypted string matches your original validation string
            if (decryptedString === validCheckString) {
                const verify = true;
                return verify;
            } else {
                const verify = false;
                return verify;
            }
        } catch (err) {
            // If decryption or authentication tag fails, the password is wrong
            console.error("Verification failed:", err.message);
            const verify = false;
            return verify;
        }
    }
}