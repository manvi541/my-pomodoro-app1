document.addEventListener("DOMContentLoaded", () => {
    const timeDisplay = document.getElementById("time-display");
    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const pomodoroSessionBtn = document.getElementById("pomodoro-session-btn");
    const shortBreakBtn = document.getElementById("short-break-btn");
    const longBreakBtn = document.getElementById("long-break-btn");
    const timerMessage = document.getElementById("timer-message");
    const mainTimerDisplay = document.getElementById("main-timer-display"); // The circular display container

    // Chatbot elements
    const chatbotContainer = document.getElementById("chatbotContainer");
    const chatToggleBtn = document.getElementById("chatToggleBtn");
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("userInput");
    const sendChatBtn = document.getElementById("sendChatBtn");

    let countdown;
    let timeRemaining;
    let isRunning = false;
    let currentSessionType = "pomodoro"; // "pomodoro", "shortBreak", "longBreak"
    const sessionTimes = {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
    };
    let conversationHistory = []; // Stores chat messages for context

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }

    function updateDisplay(seconds) {
        timeDisplay.textContent = formatTime(seconds);
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        countdown = setInterval(() => {
            timeRemaining--;
            updateDisplay(timeRemaining);
            if (timeRemaining <= 0) {
                clearInterval(countdown);
                isRunning = false;
                alert("Time's up!");
                // Optionally auto-switch to break or next pomodoro
                if (currentSessionType === "pomodoro") {
                    setSession("shortBreak"); // Auto-switch to short break
                } else {
                    setSession("pomodoro"); // Auto-switch back to pomodoro
                }
                updateDisplay(timeRemaining); // Ensure display is 00:00
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(countdown);
        isRunning = false;
    }

    function setSession(type) {
        stopTimer(); // Always stop current timer first
        currentSessionType = type;
        timeRemaining = sessionTimes[type];
        updateDisplay(timeRemaining);
        updateTimerMessage(type);
        updateActiveButton(type);
    }

    function updateTimerMessage(type) {
        switch (type) {
            case "pomodoro":
                timerMessage.textContent = "Time to focus!";
                break;
            case "shortBreak":
                timerMessage.textContent = "Short break!";
                break;
            case "longBreak":
                timerMessage.textContent = "Long break!";
                break;
        }
    }

    function updateActiveButton(activeType) {
        pomodoroSessionBtn.classList.remove("active");
        shortBreakBtn.classList.remove("active");
        longBreakBtn.classList.remove("active");

        if (activeType === "pomodoro") {
            pomodoroSessionBtn.classList.add("active");
        } else if (activeType === "shortBreak") {
            shortBreakBtn.classList.add("active");
        } else if (activeType === "longBreak") {
            longBreakBtn.classList.add("active");
        }
    }

    // Initialize with Pomodoro session
    setSession("pomodoro");

    // Event Listeners for Timer Buttons
    startButton.addEventListener("click", startTimer);
    stopButton.addEventListener("click", stopTimer);
    pomodoroSessionBtn.addEventListener("click", () => setSession("pomodoro"));
    shortBreakBtn.addEventListener("click", () => setSession("shortBreak"));
    longBreakBtn.addEventListener("click", () => setSession("longBreak"));

    // --- Chatbot Functionality ---

    // Toggle chatbot visibility
    chatToggleBtn.addEventListener('click', () => {
        chatbotContainer.classList.toggle('collapsed');
        if (chatbotContainer.classList.contains('collapsed')) {
            chatToggleBtn.textContent = '💬'; // Chat icon when collapsed
        } else {
            chatToggleBtn.textContent = 'X'; // Changed to simple 'X' for close when expanded
        }
    });

    function addMessage(message, senderClass) {
        const messageElement = document.createElement("div");
        messageElement.classList.add(senderClass);
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to latest message
    }

    function addUserMessage(message) {
        addMessage(message, "user-message");
    }

    function addBotMessage(message) {
        addMessage(message, "bot-message");
    }

    async function getChatResponseFromBackend(history) {
        // Adjust this URL to your Render backend URL
        const backendUrl = "https://pomodoro-study-assistant.onrender.com/chat";

        try {
            const response = await fetch(backendUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: history }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
            }

            const data = await response.json();
            return data.response; // Assuming your backend sends { response: "..." }
        } catch (error) {
            console.error("Error fetching from backend:", error);
            return "Sorry, I'm having trouble connecting right now. Please try again later.";
        }
    }

    sendChatBtn.addEventListener("click", async () => {
        const message = userInput.value.trim();
        if (message === "") return;

        addUserMessage(message);
        conversationHistory.push({ role: "user", content: message });
        userInput.value = ""; // Clear input field

        const typingIndicatorElement = document.createElement("p");
        typingIndicatorElement.classList.add("bot-message", "typing-indicator");
        typingIndicatorElement.textContent = "Assistant is thinking...";
        chatMessages.appendChild(typingIndicatorElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to show indicator

        try {
            const botResponse = await getChatResponseFromBackend(conversationHistory);
            chatMessages.removeChild(typingIndicatorElement); // Remove indicator
            addBotMessage(botResponse);
            conversationHistory.push({ role: "assistant", content: botResponse });
        } catch (error) {
            console.error("Failed to get bot response:", error);
            chatMessages.removeChild(typingIndicatorElement); // Remove indicator even on error
            addBotMessage("Sorry, I couldn't get a response. Please try again.");
        }
    });

    // Allow sending message with Enter key
    userInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendChatBtn.click();
        }
    });
});
