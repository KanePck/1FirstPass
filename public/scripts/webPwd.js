//To retrieve the password of user's login to the web
document.addEventListener('DOMContentLoaded', () => {
    const pElement = document.querySelector('p[data-url]');
    const url = pElement.getAttribute('data-url');
    console.log('url: ', url);
    let db, ansObj, artObj, web, passw, usrName, derivedKey;
    let dbName = 'webPwdDB';
    let dbStoreName = 'webDbStore1';//Previous store is webDbStore
    const request = indexedDB.open(dbName);
    request.onerror = (event) => {
        console.error("Error to use IndexedDB?!");
    };
    request.onsuccess = (event) => {
        let n = 0;
        var tableEntry = document.querySelector('tbody');//tbody
        // Check if 'tbody' element is found
        if (tableEntry) {
            tableEntry.innerHTML = '';
        } else {
            console.error('tbody element not found');
            return;
        }
        db = event.target.result;
        const transaction = db.transaction(dbStoreName, 'readonly');
        const objectStore = transaction.objectStore(dbStoreName);
        const seekIndex = objectStore.index('url');
        const action = seekIndex.get(url);
        action.onsuccess = (event) => {
            ansObj = event.target.result;
            if (ansObj) {
                web = ansObj.url;//get() return object so web=cursor.value.url is wrong
                passw = ansObj.pwd;
                usrName = ansObj.name;
                console.log('url: ', web, 'password: ', passw);
                n += 1;
                var tableRow = document.createElement('tr');
                var tableRow2 = document.createElement('tr');
                var tableCell = document.createElement('td');
                var tableCell2 = document.createElement('td');
                tableCell.innerText = 'URL/APP: ' + web + ' => Username: ' + usrName + ' =>  Encrypted Password: ' + passw;
                tableCell2.innerHTML = 'Please copy the username/password and paste to login the website/app.'
                tableRow.appendChild(tableCell); // Append the table cell to the table row
                tableRow2.appendChild(tableCell2);
                tableEntry.appendChild(tableRow);
                tableEntry.appendChild(tableRow2);

            } else {
                if (n == 0) {
                    tableEntry.innerHTML = 'No matching url/app found.';
                } else {
                    console.log('No more entries.');
                }

            }
        };
        objectStore.onerror = (event) => {
            console.log('Retrieving data error: ', this.error);
        };
    };
    // Hex string -> Uint8Array
    const hexToBuf = (hex) => {
        if (!hex) throw new Error("Hex string is missing!");
        // Remove any spaces or newlines that might have crept into IndexedDB
        const cleanHex = hex.trim();
        return new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    };
    // Uint8Array -> Hex string
    const bufToHex = (buf) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    document.getElementById('view').addEventListener('click', async function () {
        // Collect the Master Password from the input field
        const masterPwdInput = document.getElementById('masPwd');
        const masterPassword = masterPwdInput.value;
        const decryptResult = document.getElementById('decrypt');
        try {
            const pwdVerify = await verifyMasPwd(masterPassword, ansObj);
            if (pwdVerify) {
                console.log('verifyMasPwd done. derivedKey: ', derivedKey);
                const decryptPwd = await decryptPassw(ansObj, artObj, derivedKey);
                if (decryptPwd) {
                    decryptResult.innerHTML = `Decrypted password is: ${decryptPwd}`;
                } else {
                    decryptResult.innerText = 'Decryption of encrypted web password failed.';
                }
                    
            } else {
                console.log('verifyMasPwd function not correct.');
            }
           
        } catch (err) {
            console.log('Verification of master passsword failed!', err);
            return;
        }
    });
    async function decryptPassw(encryptedObj, artObj, masterKey) {
        // 1. Convert hex strings from IndexedDB back to Uint8Arrays
        const iv = hexToBuf(encryptedObj.iv);
        const content = hexToBuf(encryptedObj.pwd);
        const tag = hexToBuf(encryptedObj.tag);
        console.log('iv: ', iv, ' /content: ', content, ' /tag:', tag);
        // 2. Combine content and tag (Web Crypto requirement for AES-GCM)
        const combined = new Uint8Array(content.length + tag.length);
        combined.set(content, 0);
        combined.set(tag, content.length);
        console.log("Content Hex:", encryptedObj.pwd);
        console.log("Tag Hex:", encryptedObj.tag);
        console.log("Combined Buffer Length:", combined.byteLength); // Should be 25 (9 + 16)
        console.log("Key Check - Algorithm:", masterKey.algorithm.name);
        console.log("Key Check - Usages:", masterKey.usages);
        try {
            // 3. Decrypt using the Master Key
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                masterKey,
                combined
            );

            // 4. Convert the buffer back into a readable string
            const decCode = new TextDecoder().decode(decryptedBuffer);
            return decCode;    
        } catch (error) {
            console.log('Decrypt failed', error);
            const decCode = '';
            return decCode;
        }
        
    }
    async function verifyMasPwd(masPwd, ansObj) {
        return new Promise((resolve, reject) => {
            // Hex string -> Uint8Array
            //const hexToBuf = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            // Uint8Array -> Hex string
            const bufToHex = (buf) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
            let db;
            let dbName = 'webPwdDB';
            let dbStoreName = 'artifactStore';
            //let pwdVerify = false;
            const message = document.getElementById("pwdVerify");
            const request = indexedDB.open(dbName);//if not 1, then version change
            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                resolve(false);
            };
            request.onblocked = () => {
                console.error("Database connection is blocked. Close other tabs or processes using the database.");
                resolve(false);
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
                                    resolve(true);
                                } else {
                                    message.innerText = 'The input master password not correct, please reinput';
                                    resolve(false);
                                }
                                
                            })
                            .catch((err) => {
                                console.log('promise.all - 1, 2 error: ', err);
                                message.innerText = 'Verification of input master password failed.';
                                resolve(false);
                            });
                    } else {
                        console.log('No artifact found with ID: currentCheck');
                        message.innerText = 'Verification of input master password failed.';
                        resolve(false);
                    }
                }
            }
        });
        
        async function validate(artObj) {
            //Encrytion config parameters
            const algorithm = 'AES-GCM';// 'aes-256-gcm';
            const keyBytes = 32;
            const iterations = 600000;
            const digest = 'SHA-256';//strict syntax, differ in n odejs 'sha256'
            const validCheckString = "VAULT_MASTER_PASSWORD_IS_CORRECT";
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
                derivedKey = await window.crypto.subtle.deriveKey(
                    {
                        name: 'PBKDF2',
                        salt: salt,
                        iterations: iterations, // MUST match your server-side value
                        hash: digest

                    },
                    baseKey,
                    { name: algorithm, length: 256 },
                    false, // Key cannot be exported for security
                    ['encrypt', 'decrypt']
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
                //derivedKey = null;

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
    
})
    /*document.getElementById('newWin').addEventListener('click', function () {
        const credentials = { [web]: { username: usrName, password: passw } };// an object
        const win = window.open(web, '_blank');
        if (win) win.opener = null;//Prevents the new tab from having access to the original page via window.opener
        /*Why this matters:
        - A malicious site opened by window.open() could use window.opener to manipulate the opener(e.g., redirect, inject code).
        - By setting win.opener = null, you eliminate that risk.*/
        /*window.addEventListener("load", () => {
            const formExists = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            if (formExists.length=0) {
                alert("No login form detected on this page.");
                observeLoginForm(credentials);
            } else {
                autofillLogin(credentials);
            }
        });
        
    });*/
    /*function observeLoginForm(creds) {
        const observer = new MutationObserver((mutations, obs) => {
            const passwordField = document.querySelector('input[type="password"]');
            if (passwordField) {
                obs.disconnect(); // Stop observing once we find it
                autofillLogin(creds); // Call your autofill logic
            }
        });

        observer.observe(document.body, {
            childList: true,      // Watch for added or removed elements
            subtree: true         // Watch the entire DOM tree
        });
        // Auto-disconnect after 10 seconds
        setTimeout(() => observer.disconnect(), 10000);
    };
    function autofillLogin(creds) {
        const usrname = creds.username;
        const passwd = creds.password;
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        let usernameField, passwordField;
        inputs.forEach(input => {
            const name = input.name.toLowerCase();
            if (!usernameField && /user|email|login/i.test(name)) {
                usernameField = input;
            } else if (!passwordField && /pass/i.test(name)) {
                passwordField = input;
            }
        });

        // Fill the inputs
        if (usernameField) usernameField.value = usrname;
        if (passwordField) passwordField.value = passwd;

        // Dispatch input events to trigger form logic
        usernameField?.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField?.dispatchEvent(new Event('input', { bubbles: true }));

    }*/

