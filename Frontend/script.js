// ==========================================
// J.A.R.V.I.S
// CORE JAVASCRIPT
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const chat =
    document.getElementById("chat");

const msg =
    document.getElementById("msg");

const sendBtn =
    document.getElementById("send");

const micBtn =
    document.getElementById("mic-btn");

const camBtn =
    document.getElementById("cam-btn");

const clearBtn =
    document.getElementById("clear-btn");

const imgInput =
    document.getElementById("img-input");


// ==========================================
// GEMINI SETTINGS
// ==========================================

const MODEL =
    "gemini-3.5-flash-lite";


// ==========================================
// API KEY
// ==========================================

let API_KEY =
    localStorage.getItem("jarvis_api_key");


if (!API_KEY) {

    API_KEY = prompt(
        "Enter your Gemini API Key:"
    );

    if (API_KEY) {

        localStorage.setItem(
            "jarvis_api_key",
            API_KEY.trim()
        );

    }

}


// ==========================================
// MEMORY
// ==========================================

let memory = JSON.parse(
    localStorage.getItem(
        "jarvis_memory"
    ) || "[]"
);


// ==========================================
// SAVE MEMORY
// ==========================================

function saveMemory() {

    localStorage.setItem(
        "jarvis_memory",
        JSON.stringify(memory)
    );

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(
    text,
    type
) {

    const div =
        document.createElement(
            "div"
        );


    if (type === "user") {

        div.className =
            "message user-message";

    } else {

        div.className =
            "message jarvis-message";

    }


    div.textContent = text;


    chat.appendChild(div);


    chat.scrollTop =
        chat.scrollHeight;


    return div;

}


// ==========================================
// LOAD MEMORY
// ==========================================

function loadMemory() {

    memory.forEach(
        item => {

            if (
                item.role ===
                "user"
            ) {

                addMessage(
                    "YOU: " +
                    item.text,
                    "user"
                );

            }

            if (
                item.role ===
                "model"
            ) {

                addMessage(
                    "J.A.R.V.I.S: " +
                    item.text,
                    "jarvis"
                );

            }

        }
    );

}


loadMemory();


// ==========================================
// API REQUEST
// ==========================================

async function generateContent(
    contents
) {

    if (!API_KEY) {

        throw new Error(
            "Gemini API key is missing."
        );

    }


    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent?key=" +
        encodeURIComponent(
            API_KEY
        );


    const response =
        await fetch(
            url,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        {
                            contents:
                                contents
                        }
                    )

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data?.error?.message ||
            "Gemini API request failed."
        );

    }


    const answer =
        data
        ?.candidates
        ?.[0]
        ?.content
        ?.parts
        ?.[0]
        ?.text;


    if (!answer) {

        throw new Error(
            "Gemini returned an empty response."
        );

    }


    return answer;

}


// ==========================================
// ASK JARVIS
// ==========================================

async function askJarvis(
    question
) {

    const thinking =
        addMessage(
            "J.A.R.V.I.S: Thinking...",
            "jarvis"
        );


    try {

        const history =
            memory
            .slice(-10)
            .map(
                item => ({

                    role:
                        item.role,

                    parts: [
                        {
                            text:
                                item.text
                        }
                    ]

                })
            );


        history.push({

            role: "user",

            parts: [
                {
                    text:
                        question
                }
            ]

        });


        const answer =
            await generateContent(
                history
            );


        thinking.textContent =
            "J.A.R.V.I.S: " +
            answer;


        memory.push({

            role: "user",

            text: question

        });


        memory.push({

            role: "model",

            text: answer

        });


        saveMemory();


        speak(answer);


    } catch (error) {

        console.error(error);


        thinking.textContent =
            "J.A.R.V.I.S: ERROR - " +
            error.message;

    }

}


// ==========================================
// SEND
// ==========================================

async function sendMessage() {

    const text =
        msg.value.trim();


    if (!text) {

        return;

    }


    addMessage(
        "YOU: " + text,
        "user"
    );


    msg.value = "";


    await askJarvis(
        text
    );

}


// ==========================================
// SEND BUTTON
// ==========================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// ==========================================
// ENTER KEY
// ==========================================

msg.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter"
        ) {

            sendMessage();

        }

    }
);


// ==========================================
// CLEAR MEMORY
// ==========================================

clearBtn.addEventListener(
    "click",
    function() {

        memory = [];

        localStorage.removeItem(
            "jarvis_memory"
        );


        chat.innerHTML = "";


        addMessage(
            "SYSTEM: Memory cleared.",
            "jarvis"
        );

    }
);


// ==========================================
// MICROPHONE
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        function() {

            micBtn.textContent =
                "🔴";

        };


    recognition.onend =
        function() {

            micBtn.textContent =
                "🎤";

        };


    recognition.onerror =
        function(event) {

            console.error(
                "Microphone:",
                event.error
            );

            micBtn.textContent =
                "🎤";

        };


    recognition.onresult =
        function(event) {

            const text =
                event
                .results[0][0]
                .transcript;


            msg.value =
                text;


            sendMessage();

        };


    micBtn.addEventListener(
        "click",
        function() {

            recognition.start();

        }
    );

} else {

    micBtn.addEventListener(
        "click",
        function() {

            addMessage(
                "J.A.R.V.I.S: Voice input is not supported in this browser.",
                "jarvis"
            );

        }
    );

}


// ==========================================
// TEXT TO SPEECH
// ==========================================

function speak(text) {

    if (
        !(
            "speechSynthesis"
            in window
        )
    ) {

        return;

    }


    speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        "en-IN";


    speech.rate =
        1;


    speech.pitch =
        0.9;


    speechSynthesis.speak(
        speech
    );

}


// ==========================================
// PHOTO / GALLERY
// ==========================================

camBtn.addEventListener(
    "click",
    function() {

        /*
         IMPORTANT:
         We DO NOT use:

         capture="environment"

         So Android can show
         Photos/Gallery picker.
        */

        imgInput.click();

    }
);


// ==========================================
// IMAGE SELECTED
// ==========================================

imgInput.addEventListener(
    "change",
    async function() {

        const file =
            this.files[0];


        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            addMessage(
                "J.A.R.V.I.S: Please select an image.",
                "jarvis"
            );

            return;

        }


        addMessage(
            "YOU: [PHOTO SELECTED]",
            "user"
        );


        const question =
            msg.value.trim() ||
            "Describe this image clearly and simply.";


        msg.value = "";


        await analyzeImage(
            file,
            question
        );


        /*
         Reset input so the
         same photo can be selected again.
        */

        this.value = "";

    }
);


// ==========================================
// IMAGE ANALYSIS
// ==========================================

async function analyzeImage(
    file,
    question
) {

    const thinking =
        addMessage(
            "J.A.R.V.I.S: Analyzing image...",
            "jarvis"
        );


    try {

        const base64 =
            await fileToBase64(
                file
            );


        const contents = [

            {

                role: "user",

                parts: [

                    {
                        text:
                            question
                    },

                    {

                        inline_data: {

                            mime_type:
                                file.type,

                            data:
                                base64

                        }

                    }

                ]

            }

        ];


        const answer =
            await generateContent(
                contents
            );


        thinking.textContent =
            "J.A.R.V.I.S: " +
            answer;


        speak(answer);


    } catch (error) {

        console.error(error);


        thinking.textContent =
            "J.A.R.V.I.S: IMAGE ERROR - " +
            error.message;

    }

}


// ==========================================
// FILE -> BASE64
// ==========================================

function fileToBase64(
    file
) {

    return new Promise(
        function(
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function() {

                    const result =
                        reader.result;


                    const base64 =
                        result.split(
                            ","
                        )[1];


                    resolve(
                        base64
                    );

                };


            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "Could not read image."
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}
