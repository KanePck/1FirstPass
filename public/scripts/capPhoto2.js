// Client side script code to save photos to server file system
document.addEventListener('DOMContentLoaded', (event) => {
    //alert('DOM fully loaded and parsed');
    const video = document.getElementById('video');//original - querySelector
    const canvas = document.getElementById('canvas');
    const photo = document.getElementById('photo');
    const startButton = document.getElementById('startButton');
    const photoButton = document.getElementById('photoButton');
    const stopButton = document.getElementById('stopButton');
    let stream = null;
    let photNo = 1;

    startButton.addEventListener('click', () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((mediaStream) => {
                //alert('Camera stream accessed');
                stream = mediaStream;
                video.srcObject = mediaStream;
                video.play();
            })
            .catch((err) => {
                console.error("Error accessing the camera: ", `${err}`);
            });
    });
    const cropCanvas = (sourceCanvas, leftPercentage, topPercentage, widthPercentage, heightPercentage) => {
        const targetCanvas = document.createElement('canvas');
        const tCtx = targetCanvas.getContext('2d');

        // Calculate the cropped dimensions
        const croppedWidth = sourceCanvas.width * widthPercentage;
        const croppedHeight = sourceCanvas.height * heightPercentage;

        // Calculate the position for cropping
        const left = sourceCanvas.width * leftPercentage;
        const top = sourceCanvas.height * topPercentage;

        // Set dimensions for the target canvas
        targetCanvas.width = croppedWidth;
        targetCanvas.height = croppedHeight;

        // Draw the cropped section onto the target canvas
        tCtx.drawImage(sourceCanvas, left, top, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

        return targetCanvas.toDataURL('image/png');
    };
    function takePhoto() {
        if (photNo > 3) {
            alert('Taking photo exceed 3 times');
            return;
        }
        let imageDataUrl;
        let imageObj;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            imageDataUrl = cropCanvas(canvas, 0.25, 0.05, 0.5, 0.85);
            //imageDataUrl = canvas.toDataURL('image/png');
            photo.setAttribute('src', imageDataUrl); // Ensure this is an 'img' element in your HTML
        } catch (error) {
            console.log('Error drawing image on canvas: ' + error.message);
        }
        canvas.style.display = 'inline-block';
        //photo.style.display = 'inline-block';
        // Check if imageDataUrl is defined before calling savePhoto
        if (imageDataUrl) {
            imageObj = { image: imageDataUrl, Number: photNo };
            savePhoto(imageObj);
            
        }
        photNo += 1;
    };
    //var photNo = 1;
    //var label = 1;
    photoButton.addEventListener('click', takePhoto);
    stopButton.addEventListener('click', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop()); // Properly stop all tracks
            //alert('Camera access stopped');
        }
    });
    function savePhoto(imageObj) { //This function post imageObj to saveFaceLn.js then if result is ok to ffi.js

        // Use fetch to send the data URL to the server
        fetch('/saveFaceLn', { // '/saveFaceLn' is the path to your server endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(imageObj) //{ image: imageDataUrl }, {Number: photNo }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Image saving process:', data);
                window.location.href = '/ffi';
            })
            .catch(error => {
                console.error('Error saving the image:', error);
            });
    }

});
