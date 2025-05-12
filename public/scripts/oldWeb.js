//To get web data from indexed db. Called from oldUrl.pug
document.addEventListener('DOMContentLoaded', () => {
    let db, upgradedDb, transaction, trans, currentVersion;
    let clickOnce = false;
    let noStore = false;
    let badStore = false;
    let noValue = false;
    let dbLoss = false;
    var urlArr = [];
    let importSuccess = false;
    const webBtn = document.getElementById('btn');
    webBtn.addEventListener('click', () => {
        if (clickOnce) {
            return;
        }
        clickOnce = true;
        console.log("clickOnce: ", clickOnce);
        let dbName = 'webPwdDB';
        let dbStoreName = 'webDbStore1';//Previous store is webDbStore
        const request = indexedDB.open(dbName);
        request.onerror = (event) => {
            console.error("Error to use IndexedDB?!", event.target.error);
        };
        request.onblocked = () => {
            console.error("Database connection is blocked. Close other tabs or processes using the database.");
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            currentVersion = db.version;
            console.log('Open db version no: ', currentVersion, ' done.');
            if (dbLoss) {
                const message = document.getElementById('mess');
                message.innerText = "Please select file from pop-up of your computer for importing web credential records to your browser database, due to loss of browser database.";
                triggerImport(db, dbStoreName);
                
            }
            if (!db.objectStoreNames.contains(dbStoreName)) {
                noStore = true;
                console.log("No db store.");
                newStore(dbName, dbStoreName);
            }
            accessStore(dbStoreName);
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
            //triggerImport(db, dbStoreName);
            //addData(db, pwObj, dbStoreName);
            //exportData(db, dbStoreName);
        };
        clickOnce = false;
    })

    function accessStore(dbStoreName) {
        if (db.version == currentVersion) {
            try {
                trans = db.transaction(dbStoreName, 'readwrite');
                trans.oncomplete = (event) => {
                    console.log('Db current version exists.');
                }
            } catch (error) {
                console.error('No current version db: ', error.message);
            }

        } else {
            try {
                trans = upgradedDb.transaction(dbStoreName, 'readwrite');
                trans.oncomplete = (event) => {
                    console.log('Db new version exists.');
                }
            } catch (error) {
                console.error('No new version db: ', error.message);
            }

        }
        let n = 0;
        var tableEntry = document.querySelector('tbody');//tbody
        //console.log('tableEntry: ', tableEntry); // Check if 'tbody' element is found
        if (tableEntry) {
            tableEntry.innerHTML = '';
        } else {
            console.error('tbody element not found');
            return;
        }
        const objStore = trans.objectStore(dbStoreName);
        const action = objStore.openCursor();
        const authTok = localStorage.getItem('authToken');
        //console.log('Token: ', authTok);
        action.onsuccess = (event) => {
            const cursor = event.target.result;
            const non = document.getElementById('none');
            const text = document.getElementById('text');
            if (cursor) {
                var cell = cursor.value.url;
                urlArr.push(cell);
                n += 1;
                console.log('n: ', n, 'url: ', cell);
                if (n == 1) {
                    text.innerHTML = 'Please click O and press select which url to obtain the password.';

                }
                var tableRow = document.createElement('tr');
                var tableCell = document.createElement('td');
                var form = document.createElement('form');
                form.action = '/getWebPwd';
                form.method = 'post';
                var radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'url';
                radioInput.value = cell;
                var label = document.createElement('label');
                label.textContent = cell;
                var button = document.createElement('button');
                button.form = form;
                button.type = 'submit';
                button.textContent = 'Select';
                button.name = 'token';
                button.value = authTok;
                form.appendChild(radioInput);
                form.appendChild(button);
                form.appendChild(label);
                tableCell.appendChild(form);
                /*var anchor= document.createElement('a'); //if want to display url link
                anchor.href = cell;
                anchor.textContent = cell;//Set the text content of the anchor to the URL
                tableCell.appendChild(anchor); // Append the anchor to the table cell*/
                tableCell.appendChild(form);
                tableRow.appendChild(tableCell); // Append the table cell to the table row
                tableEntry.appendChild(tableRow);
                cursor.continue();
            } else {
                if (n == 0) {
                    non.innerHTML = 'No active url/web yet.';
                } else {
                    console.log('No more entries.');
                }

            }
        };
        action.onerror = (event) => {
            console.log('Retrieving data error: ', this.error);
        };
    }
    function triggerImport(dbUpg, dbStoreName) {
        // Create and insert a file input element dynamically
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.id = "fileInput";
        fileInput.style.display = "none"; // Hide the input element
        const target = document.getElementById('text');
        document.body.insertBefore(fileInput, target);
        // Simulate click on file input to select the import file
        fileInput.click();
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                //const trans = dbUpg.transaction(dbStoreName, 'readwrite');
                //const storeUpg = trans.objectStore(dbStoreName);
                importData(file);
            }
            // Remove the file input element after import
            document.body.removeChild(fileInput);
        });
        function importData(file) {
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
                    importSuccess = true;
                    const mess2 = document.getElementById('mess2');
                    mess2.innerText = "Import of backup data done, please click: Select Old/New Url, to get old cresential data.";
                    console.log("Transaction to import data completed.");
                }
                trans.onerror = function (event) {
                    console.log("Transaction failed: ", event);
                }
            };
            reader.readAsText(file);//Read the file as text
        }
    }
    async function newStore(dbName, dbStoreName) {
        const no = document.getElementById('nost');
        no.innerHTML = 'Database store neither exist nor has values . Old website credential data will be uploaded to the object store.';
        db.close;
        console.log("Current db closed.");
        try {
            // Upgrade the database and wait for it to complete
            const upgradedDb = await upgradeDatabase(dbName, dbStoreName);

            console.log("Database reopened and upgraded successfully!");

            // Execute dependent code after the upgrade is complete
            const message = document.getElementById('mess');
            message.innerText = "Please select a file from the pop-up of your computer for importing web credential records into your browser database due to loss of the browser database.";
            triggerImport(upgradedDb, dbStoreName);
        } catch (error) {
            console.error("Error during database upgrade:", error);
        }
    }
    function upgradeDatabase(dbName, dbStoreName) {
        return new Promise((resolve, reject) => {
            //Open new version db
            const upgradeRequest = indexedDB.open(dbName, currentVersion + 1);
            upgradeRequest.onupgradeneeded = (event) => {
                upgradedDb = event.target.result;
                console.log("Upgrading database...");
                try {
                    const objStore = upgradedDb.createObjectStore(dbStoreName, { keyPath: "id", autoIncrement: true });
                    console.log("New object store created!");
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
                } catch (error) {
                    console.error("Error during onupgradeneeded:", error);
                    reject(error);
                }
            };
            upgradeRequest.onsuccess = (event) => {
                console.log("Database reopened and upgraded successfully!");
                resolve(event.target.result); // Resolve with the upgraded database
            };
            upgradeRequest.onerror = (event) => {
                reject(event.target.error); // Reject if there is an error opening the database
            };
        });
    }
    async function isStoreBlank(objectStore) {
        const count = await new Promise((resolve, reject) => {
            const countRequest = objectStore.count();

            countRequest.onsuccess = () => {
                resolve(countRequest.result); // Resolve with the count result
            };

            countRequest.onerror = () => {
                reject(countRequest.error); // Reject if an error occurs
            };
        });

        if (count === 0) {
            console.log("Object store is empty!");
            return true; // Return true for "badStore"
        } else {
            console.log(`Object store has ${count} records.`);
            return false; // Return false for "badStore"
        }
    }
        
    async function ifNoValue(objectStore) {
        const noVa = await new Promise((resolve, reject) => {
            let found = false;
            const cursorRequest = objectStore.openCursor();
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                let n = 0;
                if (cursor) {
                    const record = cursor.value;
                    console.log("Have cursor no:", n);
                    n++;
                    // Check if the value is blank
                    if (!record || record === "" || record === null || record === undefined) {
                        console.log("Found a record with a blank value:", record);
                        found = true;
                    }
                    cursor.continue(); // Move to the next record
                } else {
                    console.log("Finished scanning all records, and n is:", n);
                    if (n == 0) {
                        found = true;
                    }
                    if (found) {
                        console.log('found is true');
                    } else {
                        console.log('found is false');
                    }
                    resolve(found);
                }

            };
            cursorRequest.onerror = () => {
                reject(cursorRequest.error)
                //console.error("Error cursor thru records:", cursorRequest.error);
            };
        }); 
        if (noVa) {
            return true;
        } else {
            return false;
        }
        
    }

})
//const transaction = db.transaction(dbStoreName, "readonly");
//const objectStr = transaction.objectStore(dbStoreName);
/*const promise1 = accessStore(db, dbStoreName);
const promise2 = 22;
Promise.all([promise1, promise2])
    .then(() => {
                           
        //To check if store exists
        if (!db.objectStoreNames.contains(dbStoreName)) {
            noStore = true;
        }
        const objStore = transaction.objectStore(dbStoreName);
        const promise3 = isStoreBlank(objStore);
        const promise4 = ifNoValue(objStore);
        Promise.all([promise3, promise4])
            .then(([badStore, noValue]) => {

                console.log('noStore, badStore, noValue: ', noStore, badStore, noValue);
                if (noStore || badStore || noValue) {
                    const no = document.getElementById('nost');
                    no.innerHTML = 'Database store neither exist nor has values . Old website credential data will be uploaded to the object store.';
                    db.close;
                    console.log("Current db closed.");
                    //Open new version db
                    const upgradeRequest = indexedDB.open(dbName, currentVersion + 1);
                    upgradeRequest.onupgradeneeded = (event) => {
                        upgradedDb = event.target.result;
                        const objStore = upgradedDb.createObjectStore(dbStoreName, { keyPath: "id", autoIncrement: true });
                        console.log("New object store created!");
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
                    upgradeRequest.onsuccess = (event) => {
                        console.log("Database reopened and upgraded successfully!");
                    };
                    const message = document.getElementById('mess');
                    message.innerText = "Please select file from pop-up of your computer for importing web credential records to your browser database, due to loss of browser database.";
                    triggerImport(upgradedDb, dbStoreName);
                }
            })
            .catch((error) => {
                console.error('promise.all-3and4 error: ', error);
            });
    })
    .catch((error) => {
        console.error('promise.all-1and2 error: ', error);
    });*/
    //To check if store exists
            /*if (!db.objectStoreNames.contains(dbStoreName)) {
                noStore = true;
                console.log("No db store.");
                newStore(dbName, dbStoreName);
                accessStore(dbStoreName);
            } else {
                transaction = db.transaction(dbStoreName, 'readwrite');
                const objStore = transaction.objectStore(dbStoreName);
                const promise1 = isStoreBlank(objStore);
                const promise2 = ifNoValue(objStore);
                Promise.all([promise1, promise2])
                    .then(([badSt, noVa]) => {
                        badStore = badSt;
                        noValue = noVa;
                        console.log('1:noStore, badStore, noValue: ', noStore, badStore, noValue);
                        if (badStore || noValue) {
                            const promise3 = newStore(dbName, dbStoreName);
                            const promise4 = 44;
                            Promise.all([promise3, promise4])
                                .then(() => {
                                    console.log("newStore function completed.");
                                })
                                .catch((error) => {
                                    console.error('promise.all-3and4 error: ', error);
                                });
                        }
                        accessStore(dbStoreName);
                    })
                    .catch((error) => {
                        console.error('promise.all-1and2 error: ', error);
                    });
            }*/ 


