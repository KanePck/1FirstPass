document.addEventListener('DOMContentLoaded', (event) => {
    //const video = document.getElementById('video');//original - querySelector
    let stream = null;
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Properly stop all tracks
        //alert('Camera access stopped');
    }
})