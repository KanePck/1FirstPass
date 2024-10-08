//Called from resultPassw.pug
function storePassword(pwJs) {
    // Change JSON to object
    const pwObj = JSON.parse(pwJs);
    //alert('dataObj: ', pwObj.pwd);
    console.log('dataObj: ', pwObj.pwd);
    let db;
    let dbName = 'webPwdDB';
    let dbStoreName = 'webDbStore1';
    const versionNo = 1;
    const request = indexedDB.open(dbName, versionNo);//if not 1, then version change
    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
    request.onsuccess = (event) => {
        db = request.result;
        console.log('Open db version no: ', versionNo, ' done.');
        addData(db, pwObj, dbStoreName);
        alert('The data is stored on this browser only, and not on any other browser type.');
    }
    request.onupgradeneeded = (evt) => {
        const db = evt.target.result;
        console.log('Upgrade to version: ', db.version);
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
    };
    
    
    function addData(db, pwObj, dbStoreName) {
        // Start a new transaction
        const tx = db.transaction(dbStoreName, 'readwrite');
        const store = tx.objectStore(dbStoreName);
        const seekIndex = store.index('url');
        const url = pwObj.url;
        const action = seekIndex.get(url);
        action.onsuccess = (event) => {
            const dataObj = event.target.result;
            if (dataObj) {
                var web = dataObj.url;//get() return object so web=cursor.value.url is wrong
                dataObj.pwd = pwObj.pwd;//update data(password) read from the store
                const updateDataRequest = store.put(dataObj);//update data record in indexedDB
                updateDataRequest.onsuccess = () => {
                    console.log('Data updated, url: ', web, ', password: ', dataObj.pwd);
                }
            } else {
                const act = store.add(pwObj);
                act.onsuccess = function () {
                    console.log('Add data done.');
                    alert('Id, Username, Web URL, and its password have been kept in local storage.');
                    alert('Please copy the password and paste on to sign up form of the website.');
                };
                act.onerror = function () {
                    console.log('Adding data error: ', this.error);
                };

            }
        };
        objectStore.onerror = (event) => {
            console.log('Retrieving data error: ', this.error);
        };

                
    }
        
}



