//Called from validLogin.pug
function uploadFile() {
    let db, versionNo;
    let dbName = 'webPwdDB';
    let dbStoreName = 'webDbStore1';
    var request = indexedDB.open(dbName);//if not 1, then version change
    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
    };
    request.onblocked = () => {
        console.error("Database connection is blocked. Close other tabs or processes using the database.");
    };
    request.onsuccess = (event) => {
        db = event.target.result;
        versionNo = db.version + 1;
        console.log('Open db version no: ', db.version, ' done.');
        db.close();
    };
    //versionNo += 1; will result in NaN because indexedDb.open is asynchronous and this line done before request.onsuccess
    request = indexedDB.open(dbName, versionNo);
    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Open db version no: ', versionNo, ' done.');
        const message = document.getElementById('mess');
        message.innerText = "Please select file from pop-up of your computer for importing web credential records to your browser database, due to loss of browser database.";
        triggerImport(db, dbStoreName);
    };
    request.onerror = (event) => {
        console.error("Database error:", event.target.error);
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
                    target.innerText = "Credential data from the backup file have been uploaded to browser database. To see list of the web/app credentials, please navigate to: Old website/app";
                } else {
                    target.innerText = "Upload from backup file failed.";
                }
            };
            reader.readAsText(file);//Read the file as text
            
        }
        
    }