// data.js (handles user, url, and password info)
let dataObj = { url: '', webUn:'', webPw:''} ; // This would be set dynamically based on user info

function setDataObj(url, name, pw) {
    //dataObj.id = id;
    dataObj.webUn = name;
    dataObj.url = url;
    dataObj.webPw = pw;
}

function getDataObj() {
    return dataObj;
}
module.exports = { setDataObj, getDataObj };