//To get web data from indexed db. Called from oldUrl.pug
document.addEventListener('DOMContentLoaded', () => {
    const webBtn = document.getElementById('btn');
    webBtn.addEventListener('click', () => {
        let db, transaction;
        var urlArr = [];
        let dbName = 'webPwdDB';
        let dbStoreName = 'webDbStore1';//Previous store is webDbStore
        const request = indexedDB.open(dbName);
        request.onerror = (event) => {
            console.error("Error to use IndexedDB?!");
        };
        request.onsuccess = (event) => {
            let n = 0;
            var tableEntry = document.querySelector('tbody');//tbody
            //console.log('tableEntry: ', tableEntry); // Check if 'tbody' element is found
            if (tableEntry) {
                tableEntry.innerHTML = '';
            } else {
                console.error('tbody element not found');
                return;
            }
            db = event.target.result;
            try {
                transaction = db.transaction(dbStoreName, 'readonly');
                transaction.oncomplete = (event) => {
                    console.log('Database store exists.');
                }
            } catch (error) {
                console.error('No database store exists: ', error.message);
                const no = document.getElementById('none');
                no.innerHTML = 'Database store not exist on this browser. Please try with the browser that you use when registering.';
            }
                       
            const objectStore = transaction.objectStore(dbStoreName);
            const action = objectStore.openCursor();
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
            objectStore.onerror = (event) => {
                console.log('Retrieving data error: ', this.error);
            };
        };
    })

})


