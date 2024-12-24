document.getElementById('link').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default link behavior
    const uid = localStorage.getItem('usrId');
    const uname = localStorage.getItem('usrName');
    const auth = localStorage.getItem('authToken');
    // Data to send
    const usrData = {
        id: uid,
        username: uname
    };

    // Convert data to query string
    const queString1 = new URLSearchParams(usrData).toString();
    const queString2 = new URLSearchParams(auth).toString();
    // Redirect to the new URL with data
    window.location.href = `/page-1?${queString1, queString2}`;
});
