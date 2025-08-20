//To retrieve the password of user's login to the web
document.addEventListener('DOMContentLoaded', () => {
    const pElement = document.querySelector('p[data-url]');
    const url = pElement.getAttribute('data-url');
    console.log('url: ', url);
    let db, web, passw, usrName;
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
                web = ansObj.url;//get() return object so web=cursor.value.url is wrong
                passw = ansObj.pwd;
                usrName = ansObj.name;
                console.log('url: ', web, 'password: ', passw);
                n += 1;
                var tableRow = document.createElement('tr');
                var tableRow2 = document.createElement('tr');
                var tableCell = document.createElement('td');
                var tableCell2 = document.createElement('td');
                tableCell.innerText = 'URL/APP: ' + web + ' => Username: '+usrName+ ' =>  Password: ' + passw;
                tableCell2.innerHTML='<br>'+'Please copy the username/password and paste to login the website/app.'
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
})
