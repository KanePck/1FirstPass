//Called from delWebRec.pug
//To retrieve the password of user's login to the web
document.addEventListener('DOMContentLoaded', () => {
    const pElement = document.querySelector('p[data-url]');
    const url = pElement.getAttribute('data-url');
    console.log('url: ', url);
    let db;
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
            const none = document.getElementById('none');
            const ansObj = event.target.result;
            if (ansObj) {
                var web = ansObj.url;//get() return object so web=cursor.value.url is wrong
                var passw = ansObj.pwd;
                var usrName = ansObj.name;
                console.log('url: ', web, 'user-name: ', usrName, 'password: ', passw);
                n += 1;
                var tableRow = document.createElement('tr');
                /*var tableRow2 = document.createElement('tr');
                var tableRow3 = document.createElement('tr');
                var tableRow4 = document.createElement('tr');*/
                var tableCell = document.createElement('td');
                /*var tableCell2 = document.createElement('td');
                var tableCell3 = document.createElement('td');
                var tableCell4 = document.createElement('td');
                var button = document.createElement('button');
                var script = document.createElement('script');
                button.textContent = 'Click';
                button.type = 'button';//spefity type button as it is not part of a form
                script.src = '/scripts/deleteWebRec.js';
                tableCell3.innerHTML = '<br>' + 'Please click the button to delete login credentials data record.'
                tableCell2.appendChild(button);
                tableCell4.appendChild(script);*/
                tableCell.innerText = 'URL/APP: ' + web + ' => User-name: ' + usrName + ' =>  Password: ' + passw;
                tableRow.appendChild(tableCell); // Append the table cell to the table row
                /*tableRow2.appendChild(tableCell2);
                tableRow3.appendChild(tableCell3);
                tableRow4.appendChild(tableCell4);*/
                tableEntry.appendChild(tableRow);
                /*tableEntry.appendChild(tableRow2);
                tableEntry.appendChild(tableRow3);
                tableEntry.appendChild(tableRow4);*/
            } else {
                if (n == 0) {
                    none.innerHTML = 'No matching url/app found.';
                } else {
                    console.log('No more entries.');
                }

            }
        };
        objectStore.onerror = (event) => {
            console.log('Retrieving data error: ', this.error);
        };
        //To listen to click of the button then delete the login record
        document.addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON") {
                // Ignore when click is not on a button within <div id="popup-content">.
                return;
            }
            console.log('Delete button click done.');
            const tx = db.transaction(dbStoreName, 'readwrite');
            const objectStore = tx.objectStore(dbStoreName);
            const seekIndex = objectStore.index('url');
            const req = seekIndex.get(url);
            req.onsuccess = (event) => {
                const dataObj = event.target.result;
                if (dataObj) {
                    let action = objectStore.delete(dataObj.id);
                    action.onsuccess = (evt) => {
                        const del = document.getElementById('del');
                        del.innerText = 'URL/APP: ' + url + ' login record has been deleted.';
                        exportData(db, dbStoreName);
                        const bup = document.getElementById('bkup');
                        bup.innerText = "Updated web/app credential data has been stored in local file name: backup.";
                    }
                    action.onerror = (evt) => {
                        const del = document.getElementById('del');
                        del.innerText = 'Error deleting login record of => URL/APP: ' + url + '. Login record has not been deleted.';
                    }
                } else {
                    const del = document.getElementById('del');
                    del.innerText = 'Error deleting login record of => URL/APP: ' + url + '. Login record may not exist.';
                }


            }
            req.onerror = () => {
                const del = document.getElementById('del');
                del.innerText = 'Error deleting login record of => URL/APP: ' + url + '. Login record may not exist.';
            }
        })
    };
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
})
