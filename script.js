// script.js

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- Pomodoro Timer Variables ---
    const pomodoro = document.getElementById("pomodoro-timer");
    const short = document.getElementById("short-timer");
    const long = document.getElementById("long-timer");
    const timers = document.querySelectorAll(".timer-display"); // All timer display elements
    const sessionBtn = document.getElementById("pomodoro-session");
    const shortBreakBtn = document.getElementById("short-break");
    const longBreakBtn = document.getElementById("long-break");
    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");
    const timerMsg = document.getElementById("timer-message");

    let currentTimer = null; // Holds the currently selected timer element
    let myInterval = null; // Interval ID for the timer countdown

    // --- Chatbot Specific Elements ---
    const chatMessages = document.getElementById("chatMessages");
    const userInput = document.getElementById("userInput");
    const sendChatBtn = document.getElementById("sendChatBtn");
    const chatToggleBtn = document.getElementById("chatToggleBtn");
    const chatbotContainer = document.getElementById("chatbotContainer");

    // This array stores the conversation history for the AI, used for context.
    let conversationHistory = [];

    // 🚨 IMPORTANT: Replace this with your actual Render backend URL after deployment.
    // Example: "https://your-backend-service-name.onrender.com/api/chat"
    const BACKEND_API_URL = "https://pomodoro-chatbot-project-1.onrender.com/api/chat";

    // --- Pomodoro Timer Functions ---

    /**
     * Shows only the selected timer element and hides others.
     * @param {HTMLElement} selectedTimerElement The timer element to make active.
     */
    function showOnlySelectedTimer(selectedTimerElement) {
        timers.forEach((timer) => {
            timer.classList.remove("active-timer");
        });
        selectedTimerElement.classList.add("active-timer");
    }

    // Initialize `currentTimer` and show the Pomodoro timer by default on load.
    currentTimer = pomodoro;
    showOnlySelectedTimer(pomodoro);

    /**
     * Resets the timer display to its initial data-duration value.
     * @param {HTMLElement} timerElement The timer display element to reset.
     */
    function resetTimerDisplay(timerElement) {
        timerElement.querySelector(".time").textContent = timerElement.getAttribute("data-duration");
    }

    // Event listener for Pomodoro session button
    sessionBtn.addEventListener("click", () => {
        showOnlySelectedTimer(pomodoro);
        sessionBtn.classList.add("active");
        shortBreakBtn.classList.remove("active");
        longBreakBtn.classList.remove("active");
        currentTimer = pomodoro;
        clearInterval(myInterval); // Stop any running timer when changing selection
        resetTimerDisplay(pomodoro); // Reset display to initial duration
        timerMsg.style.display = "block"; // Show message until started
    });

    // Event listener for Short Break button
    shortBreakBtn.addEventListener("click", () => {
        showOnlySelectedTimer(short);
        sessionBtn.classList.remove("active");
        shortBreakBtn.classList.add("active");
        longBreakBtn.classList.remove("active");
        currentTimer = short;
        clearInterval(myInterval); // Stop any running timer
        resetTimerDisplay(short); // Reset display to initial duration
        timerMsg.style.display = "block"; // Show message until started
    });

    // Event listener for Long Break button
    longBreakBtn.addEventListener("click", () => {
        showOnlySelectedTimer(long);
        sessionBtn.classList.remove("active");
        shortBreakBtn.classList.remove("active");
        longBreakBtn.classList.add("active");
        currentTimer = long;
        clearInterval(myInterval); // Stop any running timer
        resetTimerDisplay(long); // Reset display to initial duration
        timerMsg.style.display = "block"; // Show message until started
    });

    /**
     * Starts the countdown timer for the given display element.
     * @param {HTMLElement} timerDisplay The active timer display element.
     */
    function startTimer(timerDisplay) {
        // Prevent starting if no timer is selected or already running and message is shown.
        if (!currentTimer) {
            timerMsg.style.display = "block";
            return;
        }
        timerMsg.style.display = "none"; // Hide message once timer starts

        // Clear any existing interval to prevent multiple timers running
        if (myInterval) {
            clearInterval(myInterval);
        }

        const timeElement = timerDisplay.querySelector(".time");
        const durationParts = timerDisplay.getAttribute("data-duration").split(":");
        let minutes = parseInt(durationParts[0], 10);
        let seconds = parseInt(durationParts[1], 10) || 0;

        let durationInMilliseconds = (minutes * 60 + seconds) * 1000;
        let endTimestamp = Date.now() + durationInMilliseconds;

        myInterval = setInterval(function () {
            const timeRemaining = endTimestamp - Date.now();

            if (timeRemaining <= 0) {
                clearInterval(myInterval);
                timeElement.textContent = "00:00";
                // Play alarm sound
                const alarm = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
                alarm.play();

                // --- AI Notification when Timer Ends ---
                const timerCompleteMessage = "My timer just finished. What should I do next, or how can I maintain my focus?";
                addBotMessage("Timer finished! Sending a note to the assistant..."); // Inform user
                conversationHistory.push({ role: "user", content: timerCompleteMessage }); // Add to history for AI context

                // Get AI's response to the timer completion
                getChatResponseFromBackend(conversationHistory).then((msg) => {
                    addBotMessage(msg); // Display AI's response
                    conversationHistory.push({ role: "assistant", content: msg }); // Add AI response to history
                }).catch(error => {
                    console.error("Error getting AI response after timer:", error);
                    addBotMessage("Timer finished! Great work. Keep going!"); // Fallback message
                });

            } else {
                // Calculate and format remaining time
                const minutesLeft = Math.floor(timeRemaining / 60000);
                const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);
                const formattedTime = `${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
                timeElement.textContent = formattedTime;
            }
        }, 1000); // Update every second
    }

    // Event listener for Start button
    startBtn.addEventListener("click", () => {
        if (currentTimer) {
            startTimer(currentTimer);
            timerMsg.style.display = "none"; // Hide the message when timer starts
        } else {
            // If no timer is selected (shouldn't happen with default selection)
            timerMsg.style.display = "block";
        }
    });

    // Event listener for Stop button
    stopBtn.addEventListener("click", () => {
        if (currentTimer) {
            clearInterval(myInterval); // Stop the countdown
            resetTimerDisplay(currentTimer); // Reset display to original duration
            timerMsg.style.display = "block"; // Show message again after stopping
        }
    });

    // --- Chatbot Helper Functions ---

    /**
     * Adds a user message to the chat display.
     * @param {string} message The text content of the user's message.
     */
    function addUserMessage(message) {
        const p = document.createElement("p");
        p.classList.add("user-message");
        p.textContent = message;
        chatMessages.appendChild(p);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }

    /**
     * Adds a bot message to the chat display.
     * @param {string} message The text content of the bot's message.
     */
    function addBotMessage(message) {
        const p = document.createElement("p");
        p.classList.add("bot-message");
        p.textContent = message;
        chatMessages.appendChild(p);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }

    // --- Function to Communicate with Your Node.js Backend ---

    /**
     * Sends conversation history to the backend API and retrieves bot's reply.
     * @param {Array<Object>} messages An array of message objects {role: "user"|"assistant", content: "..."}.
     * @returns {Promise<string>} A promise that resolves with the bot's reply.
     */
    async function getChatResponseFromBackend(messages) {
        try {
            const response = await fetch(BACKEND_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: messages }) // Send the full conversation history
            });

            if (!response.ok) {
                // Attempt to parse error data from the backend
                const errorData = await response.json().catch(() => ({ error: 'No error message provided' }));
                throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.reply; // Assuming the backend sends back a 'reply' field
        } catch (error) {
            console.error("Error communicating with backend:", error);
            // Provide a user-friendly error message
            return "Oops! I'm having trouble connecting to my assistant right now. Please ensure your backend server is running and accessible.";
        }
    }

    // --- Chatbot Interaction Logic ---

    // Event listener for Send Chat button
    sendChatBtn.addEventListener("click", async () => {
        const userTextMessage = userInput.value.trim();
        if (userTextMessage) {
            addUserMessage(userTextMessage);
            // Add user message to conversation history for the AI's context
            conversationHistory.push({ role: "user", content: userTextMessage });

            userInput.value = ""; // Clear input field

            // Display a typing indicator
            const typingIndicatorElement = document.createElement("p");
            typingIndicatorElement.classList.add("bot-message", "typing-indicator");
            typingIndicatorElement.textContent = "Assistant is thinking...";
            chatMessages.appendChild(typingIndicatorElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // Send the entire conversation history to the backend for contextual response
                const botResponse = await getChatResponseFromBackend(conversationHistory);
                chatMessages.removeChild(typingIndicatorElement); // Remove typing indicator
                addBotMessage(botResponse); // Display bot's response
                // Add bot's response to conversation history for future context
                conversationHistory.push({ role: "assistant", content: botResponse });
            } catch (error) {
                console.error("Failed to get bot response:", error);
                chatMessages.removeChild(typingIndicatorElement); // Remove typing indicator even on error
                // The error message from getChatResponseFromBackend will be displayed by addBotMessage.
                // If getChatResponseFromBackend failed to return a string, this provides a fallback.
                addBotMessage("Sorry, I couldn't get a response. Please check the console for errors and ensure the backend is working.");
            }
        }
    });

    // Allow sending messages with Enter key
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default new line behavior
            sendChatBtn.click(); // Trigger the send button click
        }
    });

    // --- Chatbot Toggle Functionality ---
    chatToggleBtn.addEventListener('click', () => {
        // Toggle the 'collapsed' class on the chatbot container to hide/show it
        chatbotContainer.classList.toggle('collapsed');

        // Change the button icon based on the chatbot's state
        if (chatbotContainer.classList.contains('collapsed')) {
            chatToggleBtn.textContent = '💬'; // Chat icon when collapsed
        } else {
            chatToggleBtn.textContent = 'X'; // 'X' for close when expanded
        }
    });

    // Scroll to the bottom of chat messages when the chatbot is fully opened (after transition)
    chatbotContainer.addEventListener('transitionend', () => {
        if (!chatbotContainer.classList.contains('collapsed')) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

}); // End of DOMContentLoaded
