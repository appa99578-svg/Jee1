// ==========================================
// J.A.R.V.I.S - JAVASCRIPT
// ==========================================

// ------------------------------
// ELEMENTS
// ------------------------------

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");

const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");
const camBtn = document.getElementById("cam-btn");
const clearBtn = document.getElementById("clear-btn");

const imgInput = document.getElementById("img-input");

// ------------------------------
// SETTINGS
// ------------------------------

const API_KEY = localStorage.getItem("jarvis_key") || "";

const MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
];

// ------------------------------
// MEMORY
// ------------------------------

let memory = JSON.parse(
    localStorage.getItem("jarvis_memory") || "[]"
);

// ------------------------------
// ADD MESSAGE
// ------------------------------

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className =
        "message " +
        (type === "user"
            ? "user-message"
            : "jarvis-message");

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}

// ------------------------------
// SAVE MEMORY
// ------------------------------

function saveMemory() {

    localStorage.setItem(
        "jarvis_memory",
        JSON.stringify(memory)
    );
}

// ------------------------------
// SEND MESSAGE
// ------------------------------

async function sendMessage() {

    const text = msg.value.trim();

    if (!text) {
        return;
    }

    addMessage("YOU: " + text, "user");

    msg.value = "";

    memory.push({
        role: "user",
        text: text
    });

    saveMemory();

    addMessage("J.A.R.V.I.S: Thinking...", "jarvis");

    await askGemini(text);
}

// ------------------------------
// GEMINI
// ------------------------------

async function askGemini(userText) {

    if (!API_KEY) {

        replaceLastMessage(
            "J.A.R.V.I.S: API key not configured."
        );

        return;
    }

    for (const model of MODELS) {

        try {

            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                encodeURIComponent(API_KEY);

            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text:
                                    "You are J.A.R.V.I.S, a helpful personal AI assistant. " +
                                    "Answer clearly and simply.\n\n" +
                                    userText
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(url, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                continue;
            }

            const answer =
                data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!answer) {
                continue;
            }

            replaceLastMessage(
                "J.A.R.V.I.S: " + answer
            );

            memory.push({
                role: "assistant",
                text: answer
            });

            saveMemory();

            speak(answer);

            return;

        } catch (error) {

            console.error(
                "Gemini error:",
                error
            );
        }
    }

    replaceLastMessage(
        "J.A.R.V.I.S: Unable to connect to the AI service."
    );
}

// ------------------------------
// REPLACE LAST MESSAGE
// ------------------------------

function replaceLastMessage(text) {

    const messages =
        chat.querySelectorAll(".jarvis-message");

    if (messages.length === 0) {
        addMessage(text, "jarvis");
        return;
    }

    messages[messages.length - 1].textContent = text;
}

// ------------------------------
// ENTER KEY
// ------------------------------

msg.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});

// ------------------------------
// SEND BUTTON
// ------------------------------

sendBtn.addEventListener(
    "click",
    sendMessage
);

// ------------------------------
// CLEAR MEMORY
// ------------------------------

clearBtn.addEventListener(
    "click",
    function () {

        localStorage.removeItem("jarvis_memory");

        memory = [];

        chat.innerHTML = "";

        addMessage(
            "J.A.R.V.I.S: Memory cleared.",
            "jarvis"
        );
    }
);

// ------------------------------
// VOICE INPUT
// ------------------------------

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.onstart = function () {

        micBtn.textContent = "🔴";
    };

    recognition.onend = function () {

        micBtn.textContent = "🎤";
    };

    recognition.onresult = function (event) {

        const result =
            event.results[0][0].transcript;

        msg.value = result;

        sendMessage();
    };

}

micBtn.addEventListener(
    "click",
    function () {

        if (!recognition) {

            addMessage(
                "J.A.R.V.I.S: Voice input is not supported in this browser.",
                "jarvis"
            );

            return;
        }

        recognition.start();
    }
);

// ------------------------------
// TEXT TO SPEECH
// ------------------------------

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";

    speech.rate = 1;

    speech.pitch = 1;

    speechSynthesis.speak(speech);
}

// ------------------------------
// CAMERA / IMAGE
// ------------------------------

camBtn.addEventListener(
    "click",
    function () {

        imgInput.click();

    }
);

imgInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        addMessage(
            "J.A.R.V.I.S: Image selected. Image analysis requires a vision-capable API setup.",
            "jarvis"
        );

        this.value = "";
    }
);

// ------------------------------
// LOAD OLD MEMORY
// ------------------------------

function loadMemory() {

    if (memory.length === 0) {
        return;
    }

    memory.forEach(item => {

        if (item.role === "user") {

            addMessage(
                "YOU: " + item.text,
                "user"
            );

        } else {

            addMessage(
                "J.A.R.V.I.S: " + item.text,
                "jarvis"
            );

        }

    });
}

loadMemory();
