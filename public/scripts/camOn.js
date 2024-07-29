document.addEventListener('DOMContentLoaded', (event) => {
    //alert('DOM fully loaded and parsed');
    const video = document.getElementById('video');//original - querySelector
    let stream = null;

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((mediaStream) => {
            //alert('Camera stream accessed');
            stream = mediaStream;
            video.srcObject = mediaStream;
            video.play();
        })
        .catch((err) => {
            console.error("Error accessing the camera: ", `${err}`);
        })
})