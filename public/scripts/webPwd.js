//To retrieve the password of user's login to the web
document.addEventListener('DOMContentLoaded', () => {
    const pElement = document.querySelector('p[data-url');
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
            const ansObj = event.target.result;
            if (ansObj) {
                var web = ansObj.url;//get() return object so web=cursor.value.url is wrong
                var passw = ansObj.pwd;
                var usrName = ansObj.name;
                console.log('url: ', web, 'password: ', passw);
                n += 1;
                var tableRow = document.createElement('tr');
                var tableRow2 = document.createElement('tr');
                var tableCell = document.createElement('td');
                var tableCell2 = document.createElement('td');
                tableCell.innerText = 'URL: ' + web + ' => Username: '+usrName+ ' =>  Password: ' + passw;
                tableCell2.innerHTML='<br>'+'Please copy the password and paste to login the website.'
                tableRow.appendChild(tableCell); // Append the table cell to the table row
                tableRow2.appendChild(tableCell2);
                tableEntry.appendChild(tableRow);
                tableEntry.appendChild(tableRow2);
            } else {
                if (n == 0) {
                    non.innerHTML = 'No matching url/web found.';
                } else {
                    console.log('No more entries.');
                }

            }
        };
        objectStore.onerror = (event) => {
            console.log('Retrieving data error: ', this.error);
        };
    };
})
