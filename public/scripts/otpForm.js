//Call from otpSubmit.pug
document.addEventListener('DOMContentLoaded', () => {
    const otpDuration = 5 * 60;
    const coolPeriod = 60;
    const resendButton = document.getElementById('resendButt');
    const submitButton = document.getElementById('submitOtpButt'); // Assuming you have an ID for the submit button
    const otpInput = document.getElementById('otpInputs');       // Assuming an ID for the input field
    // Define the specific logic (the callback function)
    resendButton.disabled = true;//To not allow click until cooldown is 0.
    const handleOtpExpiration = () => {
        // 1. Update the timer display
        const timerDisplay = document.getElementById('otpTimer');
        if (timerDisplay) {
            timerDisplay.textContent = "EXPIRED";
            timerDisplay.style.color = "red"; // Visual cue
        }
        // 2. Disable form interaction for security/UX
        if (submitButton) {
            submitButton.disabled = true; // Prevent submission of expired code
        }
        if (otpInput) {
            otpInput.disabled = true; // Lock the input field
            otpInput.value = "";
        }
        // 3. Inform the user (and allow a new request)
        if (resendButton) {
            resendButton.disabled = false; // Ensure resend is enabled now
            resendButton.textContent = "Request New OTP";
        }
        console.log("OTP has expired. User cannot submit verification.");
    };
    const handleCoolDownExp = () => {
        // 1. Update the timer display
        const timerDisplay = document.getElementById('resendTimer');
        if (timerDisplay) {
            timerDisplay.textContent = "New OTP Request enable ";
            timerDisplay.style.color = "red"; // Visual cue
        }
        // 2. Inform the user (and allow a new request)
        if (resendButton) {
            resendButton.disabled = false; // Ensure resend is enabled now
            resendButton.textContent = "Request New OTP";
        }
        console.log("Cooldow expired. User can submit new request.");
        //Listen to click button that request new OTP
        listenForClick();
    }
    //Start the main 5-minute OTP countdown ---
    startCountdownTimer(otpDuration, 'otpTimer', handleOtpExpiration);
    //Start countdown of cooldown period for otp resend
    startCountdownTimer(coolPeriod, 'resendTimer', handleCoolDownExp);

    //Function to start a countdown timer and updates a display element.
    function startCountdownTimer(durationSeconds, displayElementId, callback) {
        let timer = durationSeconds;
        const display = document.getElementById(displayElementId);
        // Check if the display element exists
        if (!display) {
            console.error(`Display element with ID "${displayElementId}" not found.`);
            return;
        }
        // Update the display immediately
        updateDisplay();
        // Set up the interval to run every 1000 milliseconds (1 second)
        const countdownInterval = setInterval(() => {
            timer--; // Decrement the time
            if (timer < 0) {
                // Stop the timer
                clearInterval(countdownInterval);

                // Execute the callback function (e.g., disable resend button)
                if (typeof callback === 'function') {
                    callback();
                }
                return;
            }
            updateDisplay();
        }, 1000);
        // Helper function to format seconds into MM:SS
        function updateDisplay() {
            // Calculate minutes and seconds
            const minutes = parseInt(timer / 60, 10);
            const seconds = parseInt(timer % 60, 10);

            // Pad the numbers with a leading zero if they are less than 10
            const formattedTime =
                `${minutes < 10 ? "0" + minutes : minutes}:` +
                `${seconds < 10 ? "0" + seconds : seconds}`;

            display.textContent = formattedTime;
        }
    }
    function handleResendRequest(formId, targetUrl) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Temporarily change the destination URL
        form.action = targetUrl;

        // Submit the form and navigate away
        form.submit();

        // Nothing more is needed here!
    }
    //CLick button
    function listenForClick() {
        document.addEventListener("click", (e) => {
            if (e.target.id === "resendButt") {
                e.preventDefault(); // Stop default button action
                const currentOrigin = window.location.origin;
                const resendUrl = `${currentOrigin}/reqNewOTP`;
                // Pass the original action for cleanup (though not strictly required here)
                handleResendRequest('otpForm', resendUrl);
            }
        });
        /*document.addEventListener("click", (e) => {
        if (e.target.id === "resendButt") {
        //e.preventDefault();
        // Call the JSON submission function
        sendJsonResendRequest();
        }
        });*/
    }
});
/*async function sendJsonResendRequest() {
    // 1. Manually collect the data from the hidden inputs
    const data = {
        email: document.getElementById('mail').value,
        phone: document.getElementById('phone').value,
        id: document.getElementById('usrId').value,
        name: document.getElementById('usrName').value,
        auTok: document.getElementById('authTok').value,
    };
    try {
        const response = await fetch('/reqNewOTP', {
            method: 'POST',
            // 2. Tell the server the request body is JSON
            headers: {
                'Content-Type': 'application/json'
            },
            // 3. Convert the JavaScript object to a JSON string
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            console.log("New OTP requested successfully. Resetting timers.");
            // 4. Client-side update: Reset both timers and provide user feedback
            // You would call your timer reset functions here instead of reloading the page
            // e.g., resetTimer(otpDuration);
            // e.g., resetTimer(resendCooldown);
        } else {
            console.error("Resend request failed:", result.message);
            // Handle error feedback to the user
        }

    } catch (error) {
        console.error('Network or processing error:', error);
    }
}*/