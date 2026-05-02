//const { validationResult } = require("../../node_modules/express-validator/lib/validation-result");

//Called from resultPassw.pug
async function verifyMasPwd(masPwd, pwObj) {
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
                            storePassword(pwObj, masPwd, artObj);
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
    async function storePassword(pwObj, masPwd, artObj) {
        // Change JSON to object
        //const pwObj = JSON.parse(pwJs);
        //console.log('dataObj: ', pwObj.pwd);
        let db;
        let dbName = 'webPwdDB';
        let dbStoreName = 'webDbStore1';
        let versionNo;
        let dbLoss = false;
        let persist = false;
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persistent) => {
                if (persistent) {
                    persist = true;
                    console.log("Storage persisted and will not be cleared except by explicit user action");
                } else {
                    console.log("Storage not persisted and may be cleared by the UA under storage pressure.");
                }
            });
        }

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
            console.log('Open db version no: ', versionNo, ' done.');
            //Check if indexed db not exist(dbLoss=true, in request.onupgradeneeded) and this is returning user that has web access credentials before.
            if (dbLoss) {
                const message = document.getElementById('mess');
                message.innerText = "Please select file from pop-up of your computer for importing web credential records to your browser database, due to loss of browser database.";
                triggerImport(db, dbStoreName);
            } else {
                const promise5 = encrypt(pwObj, masPwd, artObj);//Encrypt web credentials before adding to db
                const promise6 = 66;
                Promise.all([promise5, promise6])
                    .then(([webEncObj, prom6]) => {
                        addData(db, webEncObj, dbStoreName);
                        exportData(db, dbStoreName);
                        const bup = document.getElementById('bkup');
                        bup.innerText = "Updated website/app credential data has been stored in local file name: backup.";
                    })
                    .catch((error) => {
                        console.error('promise.all-5,6 encrypt() error: ', error);
                    });
            }
        };
        request.onupgradeneeded = (evt) => {
            db = evt.target.result;
            console.log('Database version: ', db.version);
            const objStore = db.createObjectStore(
                dbStoreName, { keyPath: 'id', autoIncrement: true });
            //objStore.createIndex('rid', 'rid', { unique: true });
            objStore.createIndex('name', 'name', { unique: false });
            objStore.createIndex('url', 'url', { unique: false });
            objStore.createIndex('pwd', 'pwd', { unique: false });
            // Use transaction oncomplete to make sure the objectStore creation is
            // finished before adding data into it.
            objStore.transaction.oncomplete = (evt) => {
                console.log('Object store: ', dbStoreName, ' created.');
            };
            objStore.transaction.onerror = (evt) => {
                console.error("request.onupgradeneeded error: ", evt.target.error);
            };
            dbLoss = true;//indicate indexed db not exist
            //addData(db, pwObj, dbStoreName);
            //exportData(db, dbStoreName);
        };
        async function encrypt(webCredentialObj, masterPassword, artObj) {
            try {
                // A. Derive the Master Key (using your 600k iterations)
                const salt = hexToBuf(artObj.salt);
                console.log('salt when encrypt: ', artObj.salt);
                const encoder = new TextEncoder();
                const pwdBuf = encoder.encode(masterPassword)
                const baseKey = await window.crypto.subtle.importKey(
                    'raw', pwdBuf, 'PBKDF2', false, ['deriveKey']
                );

                const masterKey = await window.crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt: salt, iterations: iterations, hash: digest },
                    baseKey,
                    { name: algorithm, length: 256 },
                    false,
                    ['encrypt', 'decrypt'] //'decrypt' for reading web data later
                );

                // B. Encrypt the web password
                const encryptedResult = await encryptCredential(masterKey, webCredentialObj.pwd);

                // C. Prepare final object for IndexedDB
                const webEncObj = {
                    url: webCredentialObj.url,
                    username: webCredentialObj.name,
                    encPwd: encryptedResult.content,
                    iv: encryptedResult.iv,
                    tag: encryptedResult.tag
                };
                console.log("Success! Web credential data encrypted.");
                return webEncObj;
            } catch (e) {
                console.error("Encryption failed:", e);
            }
            
        }
        async function encryptCredential(masterKey, plainPwd) {
            const encoder = new TextEncoder();
            const data = encoder.encode(plainPwd);
            // Utility to convert Uint8Array to Hex string
            const bufToHex = (buf) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
            // 1. Generate a unique IV (Initialization Vector) for THIS password
            // AES-GCM standard uses a 12-byte (96-bit) IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // 2. Encrypt the data
            // Web Crypto automatically handles the Auth Tag generation
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                masterKey,
                data
            );

            // 3. Web Crypto appends the 16-byte Auth Tag to the end of the ciphertext.
            // We need to split them to store them in your IndexedDB structure.
            const combined = new Uint8Array(encryptedBuffer);
            const tagLength = 16;
            const content = combined.slice(0, combined.byteLength - tagLength);
            const tag = combined.slice(combined.byteLength - tagLength);

            // 4. Convert to Hex strings for easy storage in IndexedDB
            return {
                content: bufToHex(content),
                iv: bufToHex(iv),
                tag: bufToHex(tag)
            };
        }
        function triggerImport(dbUpg, dbStoreName) {
            // Create and insert a file input element dynamically
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.id = "fileInput";
            fileInput.style.display = "none"; // Hide the input element
            const target = document.getElementById('target');
            document.body.insertBefore(fileInput, target);
            // Simulate click on file input to select the import file
            fileInput.click();
            fileInput.addEventListener("change", (event) => {
                const file = event.target.files[0];
                if (file) {
                    //const trans = dbUpg.transaction(dbStoreName, 'readwrite');
                    //const storeUpg = trans.objectStore(dbStoreName);
                    importData(file, dbStoreName);
                }
                // Remove the file input element after import
                document.body.removeChild(fileInput);
            });
            function importData(file, dbStoreName) {
                const reader = new FileReader();
                let success = true;
                reader.onload = (event) => {
                    const jsonData = event.target.result;
                    const data = JSON.parse(jsonData);//data is obj type variable
                    const trans = dbUpg.transaction(dbStoreName, 'readwrite');
                    const storeUpg = trans.objectStore(dbStoreName);
                    data.forEach((item) => {
                        const { value } = item;
                        const action = storeUpg.put(value);//put() will update and insert, add() only insert
                        action.onsuccess = function () {
                            console.log("Import data to indexedDB/objectStore");
                        };
                        action.onerror = function () {
                            success = false;
                            console.log("Error, import data to indexedDB failed.", event);
                        };
                    })
                    trans.oncomplete = function () {
                        console.log("Transaction to start the store before data import completed.");
                    }
                    trans.onerror = function (event) {
                        console.log("Transaction failed: ", event);
                    }
                    if (success) {
                        target.innerText = "Credential data from the backup file have been uploaded to browser database.";
                    } else {
                        target.innerText = "Upload from backup file failed.";
                    }
                };
                reader.readAsText(file);//Read the file as text
            }

        }
        function addData(db, pwObj, dbStoreName) {
            // Start a new transaction
            const tx = db.transaction(dbStoreName, 'readwrite');
            const store = tx.objectStore(dbStoreName);
            const seekIndex = store.index('url');
            const url = pwObj.url;
            const action = seekIndex.get(url);//To check if this url already exist?
            action.onsuccess = (event) => {
                const dataObj = event.target.result;
                if (dataObj) {
                    var web = dataObj.url;//get url value
                    dataObj.pwd = pwObj.encPwd;//update data(password) read from the store
                    dataObj.iv = pwObj.iv;
                    dataObj.tag = pwObj.tag;
                    const updateDataRequest = store.put(dataObj);//update data record in indexedDB
                    updateDataRequest.onsuccess = () => {
                        console.log('Data updated, url: ', web, ', password: ', dataObj.pwd);
                    }
                } else {
                    const datObj = {'pwd': pwObj.encPwd, 'name': pwObj.name, 'url': pwObj.url,
                                    'iv': pwObj.iv, 'tag': pwObj.tag};
                    const act = store.add(datObj);
                    act.onsuccess = function () {
                        console.log('Add data done.');
                        const dataStored = document.getElementById("storeButt");
                        dataStored.innerText = "Username, Web/App, and its password have been kept in local storage. Please copy the password and paste on to sign up form of the website/app. Also data will be backed up and copied on to your local file folder.";
                    };
                    act.onerror = function () {
                        console.log('Adding data error: ', this.error);
                    };

                }
            };
            action.onerror = (event) => { //previously objectStore.onerror
                console.log('Retrieving data error: ', this.error);
            };


        }
        function exportData(db, dbStoreName) {
            const transaction = db.transaction(dbStoreName, "readonly");
            const objectStore = transaction.objectStore(dbStoreName);
            const data = [];
            objectStore.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const recVal = cursor.value;
                    const recKey = cursor.key;
                    data.push({ key: recKey, value: recVal });
                    cursor.continue();
                } else {
                    // Convert data to JSON and create a downloadable link
                    const jsonData = JSON.stringify(data);
                    const blob = new Blob([jsonData], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "backup.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            };

        }
    }
}
// Check if the object store exists
/*if (!db.objectStoreNames.contains(dbStoreName)) {
    console.log("Object store does not exist.");
    const noStore = document.getElementById("storeButt");
    noStore.innerText = "Browser database that store credential data not available. Please select backup file below to upload and restore the database.";
    // Handle the case where the object store is missing by closing the current database
    db.close();
    versionNo += 1;
    const requestUpg = indexedDB.open(dbName, versionNo);
    requestUpg.onsuccess = (event) => {
        dbUpg = event.target.result;
        console.log('Open db version no: ', versionNo, ' done.');
        //createStore(requestUpg, dbUpg);
                
    }
    requestUpg.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
    requestUpg.onupgradeneeded = (evt) => {
        dbUpg = evt.target.result;
        console.log('Upgrade to version: ', dbUpg.version);
        const objStore = dbUpg.createObjectStore(
            dbStoreName, { keyPath: 'id', autoIncrement: true });
        //objStore.createIndex('rid', 'rid', { unique: true });
        objStore.createIndex('name', 'name', { unique: false });
        objStore.createIndex('url', 'url', { unique: false });
        objStore.createIndex('pwd', 'pwd', { unique: false });
        // Use transaction oncomplete to make sure the objectStore creation is
        // finished before adding data into it.
        objStore.transaction.oncomplete = (event) => {
            console.log('Object store: ', dbStoreName, ' created.');
        };
        objStore.transaction.onerror = (evt) => {
            console.error("request.onupgradeneeded error: ", evt.target.error);
        };
    }
    triggerImport(dbUpg, dbStoreName);
    addData(dbUpg, pwObj, dbStoreName);
    exportData(dbUpg, dbStoreName);
        
} else {
    console.log("Object store exists");
    addData(db, pwObj, dbStoreName);
    exportData(db, dbStoreName);
}
    function createStore(requestUpg, dbUpg) {
        requestUpg.onupgradeneeded = (evt) => {
            dbUpg = evt.target.result;
            console.log('Upgrade to version: ', dbUpg.version);
            const objStore = dbUpg.createObjectStore(
                dbStoreName, { keyPath: 'id', autoIncrement: true });
            //objStore.createIndex('rid', 'rid', { unique: true });
            objStore.createIndex('name', 'name', { unique: false });
            objStore.createIndex('url', 'url', { unique: false });
            objStore.createIndex('pwd', 'pwd', { unique: false });
            // Use transaction oncomplete to make sure the objectStore creation is
            // finished before adding data into it.
            objStore.transaction.oncomplete = (event) => {
                console.log('Object store: ', dbStoreName, ' created.');
            };
            objStore.transaction.onerror = (evt) => {
                console.error("request.onupgradeneeded error: ", evt.target.error);
            };
}
    }*/



