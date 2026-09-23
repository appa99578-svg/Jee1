/* =========================================================
J.A.R.V.I.S - CORE BRAIN
Gemini AI + Memory + Voice + Vision
========================================================= */

/* =========================================================

1. API KEY
   ========================================================= */

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
API_KEY = prompt("Enter your Gemini API Key:");

```
if (API_KEY) {
    localStorage.setItem("jarvis_key", API_KEY);
}
```

}

/* =========================================================
2. GEMINI MODELS
========================================================= */

const MODELS = [
"gemini-3.5-flash",
"gemini-3.1-flash-lite",
"gemini-flash-latest"
];

/* =========================================================
3. MEMORY SYSTEM
========================================================= */

let MEMORY = JSON.parse(
localStorage.getItem("jarvis_memory") || "[]"
);

function saveMemory() {
localStorage.setItem(
"jarvis_memory",
JSON.stringify(MEMORY)
);
}

/* =========================================================
4. HTML ELEMENTS
========================================================= */

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");
const clearBtn = document.getElementById("clear-btn");
const camBtn = document.getElementById("cam-btn");
const imgInput = document.getElementById("img-input");

/* =========================================================
5. CHAT FUNCTION
========================================================= */

function add(text, type) {

```
const div = document.createElement("div");

div.className = "msg " + type;

div.innerText = text;

chat.appendChild(div);

chat.scrollTop = chat.scrollHeight;

return div;
```

}

/* =========================================================
6. LOAD OLD MEMORY
========================================================= */

MEMORY.forEach((m) => {

```
const prefix =
    m.role === "user"
        ? "YOU: "
        : "J.A.R.V.I.S: ";

add(
    prefix + m.text,
    m.role === "user" ? "user" : "ai"
);
```

});

/* =========================================================
7. GEMINI BRAIN
========================================================= */

async function callGemini(prompt) {

```
if (!API_KEY) {
    throw new Error("Gemini API key is missing.");
}

const contents = MEMORY
    .slice(-12)
    .map((m) => ({
        role: m.role,
        parts: [
            {
                text: m.text
            }
        ]
    }));

contents.push({
    role: "user",
    parts: [
        {
            text: prompt
        }
    ]
});


let lastError = null;


for (const model of MODELS) {

    try {

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            model +
            ":generateContent?key=" +
            API_KEY;


        const response = await fetch(url, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                contents: contents
            })

        });


        const data = await response.json();


        if (data.error) {

            lastError =
                new Error(data.error.message);

            const message =
                data.error.message.toLowerCase();


            if (
                message.includes("quota") ||
                message.includes("rate") ||
                message.includes("unavailable") ||
                message.includes("deprecated") ||
                message.includes("not found")
            ) {
                continue;
            }

            throw lastError;
        }


        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;


        if (!reply) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }


        return reply;


    } catch (error) {

        lastError = error;

    }

}


throw lastError ||
    new Error("All Gemini models failed.");
```

}

/* =========================================================
8. ASK GEMINI
========================================================= */

async function askGemini(prompt) {

```
const thinkingMessage =
    add(
        "J.A.R.V.I.S: Thinking...",
        "ai"
    );


try {

    const reply =
        await callGemini(prompt);


    MEMORY.push({
        role: "user",
        text: prompt
    });


    MEMORY.push({
        role: "model",
        text: reply
    });


    saveMemory();


    thinkingMessage.innerText =
        "J.A.R.V.I.S: " + reply;


    speak(reply);


} catch (error) {

    thinkingMessage.innerText =
        "J.A.R.V.I.S: ERROR - " +
        error.message;

    console.error(error);

}
```

}

/* =========================================================
9. SEND BUTTON
========================================================= */

sendBtn.onclick = () => {

```
const text =
    input.value.trim();

if (!text) {
    return;
}


add(
    "YOU: " + text,
    "user"
);


input.value = "";


askGemini(text);
```

};

/* =========================================================
10. ENTER KEY
========================================================= */

input.addEventListener(
"keydown",
(event) => {

```
    if (event.key === "Enter") {
        sendBtn.click();
    }

}
```

);

/* =========================================================
11. CLEAR MEMORY
========================================================= */

clearBtn.onclick = () => {

```
MEMORY = [];

saveMemory();

chat.innerHTML = "";

add(
    "SYSTEM: Memory cleared.",
    "ai"
);
```

};

/* =========================================================
12. VOICE INPUT
========================================================= */

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {

```
const recognition =
    new SpeechRecognition();


recognition.lang = "en-US";

recognition.continuous = false;

recognition.interimResults = false;


recognition.onresult = (event) => {

    const text =
        event.results[0][0].transcript;


    add(
        "YOU: " + text,
        "user"
    );


    askGemini(text);

};


recognition.onerror = (event) => {

    console.error(
        "Speech recognition error:",
        event.error
    );

    micBtn.innerText = "🎤";

};


recognition.onend = () => {

    micBtn.innerText = "🎤";

};


micBtn.onclick = () => {

    try {

        recognition.start();

        micBtn.innerText =
            "LISTENING...";

    } catch (error) {

        console.error(error);

    }

};
```

} else {

```
micBtn.disabled = true;

micBtn.innerText = "MIC N/A";
```

}

/* =========================================================
13. TEXT TO SPEECH
========================================================= */

let voices = [];

function loadVoices() {

```
voices =
    window.speechSynthesis.getVoices();
```

}

loadVoices();

if ("onvoiceschanged" in speechSynthesis) {

```
speechSynthesis.onvoiceschanged =
    loadVoices;
```

}

function speak(text) {

```
if (!("speechSynthesis" in window)) {
    return;
}


speechSynthesis.cancel();


const utterance =
    new SpeechSynthesisUtterance(text);


utterance.rate = 1.05;

utterance.pitch = 0.85;


const voice =
    voices.find(
        (v) =>
            v.lang &&
            v.lang.toLowerCase().startsWith("en")
    );


if (voice) {
    utterance.voice = voice;
}


speechSynthesis.speak(
    utterance
);
```

}

/* =========================================================
14. CAMERA / IMAGE INPUT
========================================================= */

if (camBtn && imgInput) {

```
camBtn.onclick = () => {

    imgInput.click();

};


imgInput.onchange = () => {

    const file =
        imgInput.files[0];


    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload = () => {

        const result =
            reader.result;


        const base64 =
            result.split(",")[1];


        const question =
            input.value.trim() ||
            "What do you see in this image? Describe it briefly.";


        add(
            "YOU: [IMAGE] " + question,
            "user"
        );


        input.value = "";


        askVision(
            base64,
            file.type,
            question
        );

    };


    reader.readAsDataURL(file);

};
```

}

/* =========================================================
15. GEMINI VISION
========================================================= */

async function askVision(
base64,
mimeType,
question
) {

```
const thinkingMessage =
    add(
        "J.A.R.V.I.S: Analyzing image...",
        "ai"
    );


let lastError = null;


for (const model of MODELS) {

    try {

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            model +
            ":generateContent?key=" +
            API_KEY;


        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        contents: [
                            {
                                role: "user",

                                parts: [

                                    {
                                        text: question
                                    },

                                    {
                                        inline_data: {
                                            mime_type:
                                                mimeType,

                                            data:
                                                base64
                                        }
                                    }

                                ]
                            }
                        ]

                    })
                }
            );


        const data =
            await response.json();


        if (data.error) {

            lastError =
                new Error(
                    data.error.message
                );


            const message =
                data.error.message.toLowerCase();


            if (
                message.includes("quota") ||
                message.includes("rate") ||
                message.includes("unavailable") ||
                message.includes("deprecated") ||
                message.includes("not found")
            ) {
                continue;
            }


            throw lastError;

        }


        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;


        if (!reply) {

            throw new Error(
                "No image analysis response."
            );

        }


        thinkingMessage.innerText =
            "J.A.R.V.I.S: " + reply;


        speak(reply);


        return;


    } catch (error) {

        lastError = error;

    }

}


thinkingMessage.innerText =
    "J.A.R.V.I.S: ERROR - " +
    (
        lastError?.message ||
        "Image analysis failed."
    );
```

}

