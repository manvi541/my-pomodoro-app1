// --- Pomodoro Timer Variables ---
let pomodoro = document.getElementById("pomodoro-timer");
let short = document.getElementById("short-timer");
let long = document.getElementById("long-timer");
let timers = document.querySelectorAll(".timer-display");
let session = document.getElementById("pomodoro-session");
let shortBreak = document.getElementById("short-break");
let longBreak = document.getElementById("long-break");
let startBtn = document.getElementById("start");
let stopBtn = document.getElementById("stop");
let timerMsg = document.getElementById("timer-message");

let currentTimer = null;
let myInterval = null;

// --- Chatbot Specific Elements ---
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendChatBtn = document.getElementById("sendChatBtn");

// Elements for the collapsible chatbot
const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatbotContainer = document.getElementById("chatbotContainer");

// This array will store the conversation history for the AI
// Removed the 'system' role. The initial assistant greeting is now only UI-based.
// The history sent to the backend will start with the first user message.
let conversationHistory = [];

// 🚨 IMPORTANT: You will REPLACE this with your actual Render backend URL after deployment.
// Example: "https://your-backend-service-name.onrender.com/api/chat"
const BACKEND_API_URL = "https://pomodoro-chatbot-project-1.onrender.com/api/chat";
// --- Pomodoro Timer Functions ---

function showOnlySelectedTimer(selectedTimerElement) {
    timers.forEach((timer) => {
        timer.classList.remove("active-timer");
    });
    selectedTimerElement.classList.add("active-timer");
}

// Set initial active timer
// Ensure `currentTimer` is initialized so that the start button has something to work with.
currentTimer = pomodoro;
showOnlySelectedTimer(pomodoro);

session.addEventListener("click", () => {
    showOnlySelectedTimer(pomodoro);
    session.classList.add("active");
    shortBreak.classList.remove("active");
    longBreak.classList.remove("active");
    currentTimer = pomodoro;
    clearInterval(myInterval); // Stop any running timer when changing selection
    pomodoro.querySelector(".time").textContent = pomodoro.getAttribute("data-duration"); // Reset display
    timerMsg.style.display = "block"; // Show message until started
});

shortBreak.addEventListener("click", () => {
    showOnlySelectedTimer(short);
    session.classList.remove("active");
    shortBreak.classList.add("active");
    longBreak.classList.remove("active");
    currentTimer = short;
    clearInterval(myInterval); // Stop any running timer
    short.querySelector(".time").textContent = short.getAttribute("data-duration"); // Reset display
    timerMsg.style.display = "block"; // Show message until started
});

longBreak.addEventListener("click", () => {
    showOnlySelectedTimer(long);
    session.classList.remove("active");
    shortBreak.classList.remove("active");
    longBreak.classList.add("active");
    currentTimer = long;
    clearInterval(myInterval); // Stop any running timer
    long.querySelector(".time").textContent = long.getAttribute("data-duration"); // Reset display
    timerMsg.style.display = "block"; // Show message until started
});

// Start the timer on click
function startTimer(timerDisplay) {
    if (!currentTimer) {
        timerMsg.style.display = "block";
        return;
    }
    timerMsg.style.display = "none"; // Hide message once timer starts

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
            const alarm = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
            alarm.play();

            // --- AI Notification when Timer Ends ---
            const timerCompleteMessage = "My timer just finished. What should I do next, or how can I maintain my focus?";
            addBotMessage("Timer finished! Sending a note to the assistant..."); // Inform user
            conversationHistory.push({ role: "user", content: timerCompleteMessage }); // Add to history
            getChatResponseFromBackend(conversationHistory).then((msg) => {
                addBotMessage(msg); // Display AI's response to timer completion
                conversationHistory.push({ role: "assistant", content: msg }); // Add AI response to history
            }).catch(error => {
                console.error("Error getting AI response after timer:", error);
                addBotMessage("Timer finished! Great work. Keep going!"); // Fallback
            });

        } else {
            const minutesLeft = Math.floor(timeRemaining / 60000);
            const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);
            const formattedTime = `${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
            timeElement.textContent = formattedTime;
        }
    }, 1000);
}

startBtn.addEventListener("click", () => {
    if (currentTimer) {
        startTimer(currentTimer);
        timerMsg.style.display = "none";
    } else {
        timerMsg.style.display = "block";
    }
});

stopBtn.addEventListener("click", () => {
    if (currentTimer) {
        clearInterval(myInterval);
        currentTimer.querySelector(".time").textContent = currentTimer.getAttribute("data-duration");
        timerMsg.style.display = "block"; // Show message again after stopping
    }
});

// --- Chatbot Helper Functions ---

function addUserMessage(message) {
    const p = document.createElement("p");
    p.classList.add("user-message");
    p.textContent = message;
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addBotMessage(message) {
    const p = document.createElement("p");
    p.classList.add("bot-message");
    p.textContent = message;
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Function to Communicate with Your Node.js Backend ---

async function getChatResponseFromBackend(messages) {
    try {
        const response = await fetch(BACKEND_API_URL, { // <--- THIS LINE IS NOW USING BACKEND_API_URL
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: messages })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error("Error communicating with backend:", error);
        // More explicit message for "Failed to fetch" type errors
        return "Oops! I'm having trouble connecting to my assistant right now. Please ensure your Node.js backend server is running."; // This message will be updated later
    }
}

// --- Chatbot Interaction Logic ---

sendChatBtn.addEventListener("click", async () => {
    const userTextMessage = userInput.value.trim();
    if (userTextMessage) {
        addUserMessage(userTextMessage);
        // Add user message to conversation history for the AI
        conversationHistory.push({ role: "user", content: userTextMessage });

        userInput.value = "";

        const typingIndicatorElement = document.createElement("p");
        typingIndicatorElement.classList.add("bot-message", "typing-indicator");
        typingIndicatorElement.textContent = "Assistant is thinking...";
        chatMessages.appendChild(typingIndicatorElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Send the entire conversation history to the backend
            const botResponse = await getChatResponseFromBackend(conversationHistory);
            chatMessages.removeChild(typingIndicatorElement); // Remove typing indicator
            addBotMessage(botResponse);
            // Add bot's response to conversation history
            conversationHistory.push({ role: "assistant", content: botResponse });
        } catch (error) {
            console.error("Failed to get bot response:", error);
            chatMessages.removeChild(typingIndicatorElement);
            // The updated error message from getChatResponseFromBackend will be displayed
            addBotMessage("Sorry, I couldn't get a response. Please try again."); // Fallback message if specific error not caught
        }
    }
});

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendChatBtn.click();
    }
});

// --- Chatbot Toggle Functionality ---
chatToggleBtn.addEventListener('click', () => {
    // Toggle the 'collapsed' class on the chatbot container
    chatbotContainer.classList.toggle('collapsed');

    // Optional: Change the button icon based on state
    if (chatbotContainer.classList.contains('collapsed')) {
        chatToggleBtn.textContent = '💬'; // Chat icon when collapsed
    } else {
        chatToggleBtn.textContent = 'X'; // Changed to simple 'X' for close when expanded
    }
});

// Immediately scroll to the bottom when the chat is opened,
// especially if initial messages are already there.
chatbotContainer.addEventListener('transitionend', () => {
    if (!chatbotContainer.classList.contains('collapsed')) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
