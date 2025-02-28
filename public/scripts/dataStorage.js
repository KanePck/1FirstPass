//Called from resultPassw.pug
function storePassword(pwJs) {
    // Change JSON to object
    const pwObj = JSON.parse(pwJs);
    console.log('dataObj: ', pwObj.pwd);
    const pElement = document.querySelector('p[data1]');
    const firstWeb = pElement.getAttribute('data1');
    if (firstWeb) {
        console.log('firstWeb in dataStorage is True.');
    } else {
        console.log('firstWeb in dataStorage is False.');
    }
    let db, dbUpg;
    let dbName = 'webPwdDB';
    let dbStoreName = 'webDbStore1';
    let versionNo;
    let dbLoss = false;
    let persist = false;
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((persistent) => {
            if (persistent) {
                persist = true;
                console.log("Storage will not be cleared except by explicit user action");
            } else {
                console.log("Storage may be cleared by the UA under storage pressure.");
            }
        });
    }

    const request = indexedDB.open(dbName);//if not 1, then version change
    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
    request.onsuccess = (event) => {
        db = event.target.result;
        versionNo = db.version;
        console.log('Open db version no: ', versionNo, ' done.');
        //Check if indexed db not exist(dbLoss=true, in request.onupgradeneeded) and this is returning user that has web access credentials before.
        if (!firstWeb && dbLoss) {
            const message = document.getElementById('mess');
            message.innerText = "Please select file from pop-up of your computer for importing web credential records to your browser database, due to loss of browser database.";
            triggerImport(db, dbStoreName);
        }
        addData(db, pwObj, dbStoreName);
        exportData(db, dbStoreName);
        const bup = document.getElementById('bkup');
        bup.innerText = "Updated website credential data has been stored in local file name: backup.";
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
        objStore.transaction.oncomplete = (event) => {
            console.log('Object store: ', dbStoreName, ' created.');
        };
        objStore.transaction.onerror = (evt) => {
            console.error("request.onupgradeneeded error: ", evt.target.error);
        };
        dbLoss = true;//indicate indexed db not exist
        //addData(db, pwObj, dbStoreName);
        //exportData(db, dbStoreName);
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
                        console.log("Error, import data to indexedDB failed.", event);
                    };
                })
                trans.oncomplete = function () {
                    console.log("Transaction to start the store before data import completed.");
                }
                trans.onerror = function (event) {
                    console.log("Transaction failed: ", event);
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
                    dataStored.innerText = "Username, Web URL, and its password have been kept in local storage. Please copy the password and paste on to sign up form of the website. Also data will be backed up and copied on to your local file folder.";
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
                data.push({key: recKey, value: recVal});
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



