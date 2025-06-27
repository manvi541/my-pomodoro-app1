// --- Pomodoro Timer Variables ---
// Get the primary display element
let mainTimerDisplay = document.getElementById("main-timer-display");
let timeDisplay = document.getElementById("time-display"); // The <span> inside main-timer-display

// Get the new buttons by their specific IDs
let pomodoroSessionBtn = document.getElementById("pomodoro-session-btn");
let shortBreakBtn = document.getElementById("short-break-btn");
let longBreakBtn = document.getElementById("long-break-btn");

let startBtn = document.getElementById("start");
let stopBtn = document.getElementById("stop");
let timerMsg = document.getElementById("timer-message");

let currentSelectedDuration = pomodoroSessionBtn.getAttribute("data-time"); // Initialize with Pomodoro
let myInterval = null;

// --- Chatbot Specific Elements ---
// Corrected to "chat-messages" as per HTML
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("userInput");
const sendChatBtn = document.getElementById("sendChatBtn");

// Elements for the collapsible chatbot - Corrected IDs to match HTML
const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatbotContainer = document.getElementById("chatbotContainer");

let conversationHistory = [];

const BACKEND_API_URL = "https://pomodoro-chatbot-project-1.onrender.com/api/chat";

// --- Pomodoro Timer Functions ---

// This function is now simpler as we only have ONE timer display element
function updateTimerDisplay(minutes, seconds) {
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    timeDisplay.textContent = formattedTime;
}

// Function to handle button clicks and set the timer
function setTimer(button, duration) {
    // Remove 'active' class from all buttons
    document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
    // Add 'active' class to the clicked button
    button.classList.add('active');

    currentSelectedDuration = duration;
    clearInterval(myInterval); // Stop any running timer
    updateTimerDisplay(duration, 0); // Reset display to the new duration
    timerMsg.style.display = "block"; // Show message until started
}

// Add event listeners to the timer selection buttons
pomodoroSessionBtn.addEventListener("click", () => {
    setTimer(pomodoroSessionBtn, 25);
});

shortBreakBtn.addEventListener("click", () => {
    setTimer(shortBreakBtn, 5);
});

longBreakBtn.addEventListener("click", () => {
    setTimer(longBreakBtn, 15);
});

// Start the timer on click
function startTimer() {
    if (currentSelectedDuration === null) {
        timerMsg.style.display = "block"; // Keep message visible if no duration selected
        return;
    }
    timerMsg.style.display = "none"; // Hide message once timer starts

    if (myInterval) {
        clearInterval(myInterval);
    }

    let minutes = parseInt(currentSelectedDuration, 10);
    let seconds = 0; // Assuming initial duration is always whole minutes

    let durationInMilliseconds = (minutes * 60 + seconds) * 1000;
    let endTimestamp = Date.now() + durationInMilliseconds;

    myInterval = setInterval(function () {
        const timeRemaining = endTimestamp - Date.now();

        if (timeRemaining <= 0) {
            clearInterval(myInterval);
            updateTimerDisplay(0, 0); // Display 00:00
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
            updateTimerDisplay(minutesLeft, secondsLeft);
        }
    }, 1000);
}

// Initial setup: display the default Pomodoro time
updateTimerDisplay(25, 0);

startBtn.addEventListener("click", () => {
    startTimer();
});

stopBtn.addEventListener("click", () => {
    clearInterval(myInterval);
    updateTimerDisplay(currentSelectedDuration, 0); // Reset to the current selected duration
    timerMsg.style.display = "block"; // Show message again after stopping
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
        const response = await fetch(BACKEND_API_URL, {
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
        return "Oops! I'm having trouble connecting to my assistant right now. Please ensure your Node.js backend server is running and accessible from the frontend.";
    }
}

// --- Chatbot Interaction Logic ---

sendChatBtn.addEventListener("click", async () => {
    const userTextMessage = userInput.value.trim();
    if (userTextMessage) {
        addUserMessage(userTextMessage);
        conversationHistory.push({ role: "user", content: userTextMessage });

        userInput.value = "";

        const typingIndicatorElement = document.createElement("p");
        typingIndicatorElement.classList.add("bot-message", "typing-indicator");
        typingIndicatorElement.textContent = "Assistant is thinking...";
        chatMessages.appendChild(typingIndicatorElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const botResponse = await getChatResponseFromBackend(conversationHistory);
            chatMessages.removeChild(typingIndicatorElement);
            addBotMessage(botResponse);
            conversationHistory.push({ role: "assistant", content: botResponse });
        } catch (error) {
            console.error("Failed to get bot response:", error);
            chatMessages.removeChild(typingIndicatorElement);
            addBotMessage("Sorry, I couldn't get a response. Please try again.");
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
    chatbotContainer.classList.toggle('collapsed');

    if (chatbotContainer.classList.contains('collapsed')) {
        chatToggleBtn.textContent = '💬';
    } else {
        chatToggleBtn.textContent = 'X';
    }
});

chatbotContainer.addEventListener('transitionend', () => {
    if (!chatbotContainer.classList.contains('collapsed')) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
