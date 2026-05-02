//Call from mfa.pug
async function saveArtToDb(artjs) {
    const artData = JSON.parse(artjs);
    let dbName = 'webPwdDB';
    let dbStoreName = 'artifactStore';
    var versionNo = 0;
    let db, objStore;
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((persisted) => {
            if (persisted) {
                console.log("Persisted is True. Storage will not be cleared except by explicit user action");
            } else {
                console.log("Persisted is false. Storage may be cleared by the UA under storage pressure.");
            }
        });
    }
    const promise1 = checkDbStore(dbName);
    const promise2 = 22;    
    Promise.all([promise1, promise2])
        .then(() => {
            const nextVersion = Number(versionNo ?? 1) + 1;
            console.log('nextVersion = ', nextVersion, ', versionNo: ', versionNo);
            const req = indexedDB.open(dbName, versionNo);
            req.onsuccess = (ev) => {
                db = ev.target.result;
                const tx = db.transaction(dbStoreName, "readwrite");
                const store = tx.objectStore(dbStoreName);
                const request = store.put(artData);
                request.onsuccess = () => {
                    console.log('Artifact stored in indexedDB.');
                }
                request.onerror = () => {
                    console.log('Artifact data storage error: ', this.error);
                }
                // Good practice: close connection after specific tasks 
                // to prevent blocking future upgrades.
                tx.oncomplete = () => db.close();
            }
            req.onerror = (ev) => {
                console.error("Database error:", ev.target.error);
            };
            req.onupgradeneeded = (ev) => {
                const dbNew = ev.target.result;
                // If the store already exists, delete it so we can recreate it with autoIncrement
                if (dbNew.objectStoreNames.contains(dbStoreName)) {
                    dbNew.deleteObjectStore(dbStoreName);
                }
                const objStore = dbNew.createObjectStore(dbStoreName, { keyPath: "id", autoIncrement: true });
                objStore.transaction.oncomplete = (ev) => {
                    console.log('Object store: ', dbStoreName, ' created.');
                };
                objStore.transaction.onerror = (ev) => {
                    console.error("request.onupgradeneeded error: ", evt.target.error);
                };
                console.log(`Created 'artifacts' store at version ${versionNo}`);
            }
    });
    async function checkDbStore(dbName) {
        const version = await new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);//if not 1, then version change
            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                //return versionNo;
            };
            request.onblocked = () => {
                console.error("Database connection is blocked. Close other tabs or processes using the database.");
                //return versionNo;
            };
            request.onsuccess = (event) => {
                const dbNow = event.target.result;
                versionNo = dbNow.version;
                console.log('Open db version no: ', versionNo, ' done.');
                const hasArtStore = dbNow.objectStoreNames.contains(dbStoreName);
                if (!hasArtStore) {
                    dbNow.close();
                    versionNo = versionNo + 1;
                    console.log('versionNo if no store: ', versionNo);
                }
                dbNow.close();
                resolve(versionNo);
            }
            request.onupgradeneeded = (event) => {
                const dbNow = event.target.result;
                // If the store already exists, delete it so we can recreate it with autoIncrement
                if (dbNow.objectStoreNames.contains(dbStoreName)) {
                    dbNow.deleteObjectStore(dbStoreName);
                }
                const objStore = dbNow.createObjectStore(dbStoreName, { keyPath: "id", autoIncrement: true });
                objStore.transaction.oncomplete = (event) => {
                    console.log('Object store: ', dbStoreName, ' created.');
                };
                objStore.transaction.onerror = (ev) => {
                    console.error("request.onupgradeneeded error: ", event.target.error);
                };
                console.log(`Created 'artifacts' store at version ${versionNo}`);
            }
        });
        return versionNo;
    }
      
    /*async function upgradeDb(newVersion) {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(dbName, newVersion);
            req.onupgradeneeded = (event) => {
                const dbNew = event.target.result;
                // Safety check: only create if it doesn't exist
                if (!dbNew.objectStoreNames.contains("artifacts")) {
                    dbNew.createObjectStore("artifactStore", { keyPath: "id" });
                    console.log(`Created 'artifacts' store at version ${newVersion}`);
                }
            }
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    function addData(db, artObj, dbStoreName) {
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
                dataObj.pwd = pwObj.pwd;//update data(password) read from the store
                const updateDataRequest = store.put(dataObj);//update data record in indexedDB
                updateDataRequest.onsuccess = () => {
                    console.log('Data updated, url: ', web, ', password: ', dataObj.pwd);
                }
            } else {
                const act = store.add(pwObj);
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


    }*/
}