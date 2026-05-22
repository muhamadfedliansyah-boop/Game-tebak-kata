const WORD_POOL = [
    "BOGOR", "MEDAN", "PAPUA", "BEKASI", "PADANG", "AMBON", "BALI",
    "JAKARTA", "BANDUNG", "SOLO", "SURABAYA", "MALANG", "MAKASSAR", 
    "ACEH", "DEPOK", "JOGJA", "CIREBON", "PALEMBANG", "MANADO"
];

const MAX_ATTEMPTS = 6;
let secretWord = "";
let WORD_LENGTH = 5;

let currentAttempt = 0;
let currentTile = 0;
let gameOver = false;
let boardState = [];
let scoreStreak = 0; // Menyimpan skor streak tebakan benar beruntun

const gridContainer = document.getElementById("game-grid");
const keyboardContainer = document.getElementById("keyboard");
const modal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const btnRestart = document.getElementById("btn-restart");
const scoreDisplay = document.getElementById("current-score");

// Jalankan game pertama kali
initGame();

function initGame() {
    // Memilih kata acak dari pool daerah
    secretWord = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
    WORD_LENGTH = secretWord.length; // Panjang kolom adaptif mengikuti kata rahasia
    
    console.log("Daerah Rahasia (Debug):", secretWord, `(${WORD_LENGTH} huruf)`);

    // Reset posisi state input
    currentAttempt = 0;
    currentTile = 0;
    gameOver = false;
    boardState = Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill(""));
    
    // Reset komponen visual DOM
    gridContainer.innerHTML = "";
    keyboardContainer.innerHTML = "";
    modal.classList.add("hidden");

    // Update tampilan skor streak
    scoreDisplay.innerText = scoreStreak;

    // Set lebar kontainer ubin secara dinamis berdasarkan kuantitas huruf
    gridContainer.style.width = `${WORD_LENGTH * 55}px`;

    // Render Baris dan Kolom Grid Ubin Baru
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
        const row = document.createElement("div");
        row.className = "grid-row";
        row.id = `row-${r}`;
        row.style.gridTemplateColumns = `repeat(${WORD_LENGTH}, 1fr)`;
        
        for (let c = 0; c < WORD_LENGTH; c++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.id = `row-${r}-tile-${c}`;
            row.appendChild(tile);
        }
        gridContainer.appendChild(row);
    }

    // Render Layout Keyboard Virtual
    const keyboardLayout = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
    ];

    keyboardLayout.forEach(rowKeys => {
        const row = document.createElement("div");
        row.className = "keyboard-row";
        
        rowKeys.forEach(key => {
            const button = document.createElement("button");
            button.innerText = key === "BACKSPACE" ? "⌫" : key;
            button.className = "key";
            button.setAttribute("data-key", key);

            if (key === "ENTER" || key === "BACKSPACE") {
                button.classList.add("wide");
            }

            button.addEventListener("click", () => handleInput(key));
            row.appendChild(button);
        });
        keyboardContainer.appendChild(row);
    });
}

function handleInput(key) {
    if (gameOver) return;

    if (key === "ENTER") {
        submitGuess();
    } else if (key === "BACKSPACE" || key === "Backspace") {
        deleteLetter();
    } else if (/^[a-zA-Z]$/.test(key)) {
        insertLetter(key.toUpperCase());
    }
}

function insertLetter(letter) {
    if (currentTile < WORD_LENGTH) {
        boardState[currentAttempt][currentTile] = letter;
        const tileDom = document.getElementById(`row-${currentAttempt}-tile-${currentTile}`);
        tileDom.innerText = letter;
        tileDom.setAttribute("data-state", "tapped");
        currentTile++;
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        boardState[currentAttempt][currentTile] = "";
        const tileDom = document.getElementById(`row-${currentAttempt}-tile-${currentTile}`);
        tileDom.innerText = "";
        tileDom.removeAttribute("data-state");
    }
}

function submitGuess() {
    if (currentTile < WORD_LENGTH) {
        alert(`Kata harus berisi ${WORD_LENGTH} huruf!`);
        return;
    }

    const currentGuessArr = boardState[currentAttempt];
    const guessWord = currentGuessArr.join("");
    
    let secretLetters = secretWord.split("");
    let tileStatuses = Array(WORD_LENGTH).fill("absent");

    // Evaluasi Tahap 1: Cek kecocokan warna Hijau Mint (#DAF9DE)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (currentGuessArr[i] === secretLetters[i]) {
            tileStatuses[i] = "correct";
            secretLetters[i] = null;
        }
    }

    // Evaluasi Tahap 2: Cek kecocokan warna Kuning Mentega (#F6FFDC) atau Merah Muda Pastel (#F9B2D7)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (tileStatuses[i] === "correct") continue;

        const foundIndex = secretLetters.indexOf(currentGuessArr[i]);
        if (foundIndex !== -1) {
            tileStatuses[i] = "present";
            secretLetters[foundIndex] = null;
        }
    }

    // Eksekusi Animasi Flip Bergelombang
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tileDom = document.getElementById(`row-${currentAttempt}-tile-${i}`);
        
        setTimeout(() => {
            tileDom.classList.add("flip");
            setTimeout(() => {
                tileDom.classList.add(tileStatuses[i]);
                updateKeyboardKey(currentGuessArr[i], tileStatuses[i]);
            }, 250);
        }, i * 150);
    }

    // Evaluasi Status Kelanjutan Permainan
    setTimeout(() => {
        if (guessWord === secretWord) {
            // JIKA BENAR: Streak bertambah, redupkan baris aktif, langsung ganti soal otomatis
            scoreStreak++;
            scoreDisplay.innerText = scoreStreak;
            
            const currentRowDom = document.getElementById(`row-${currentAttempt}`);
            currentRowDom.style.transition = "opacity 0.5s";
            currentRowDom.style.opacity = "0.3";

            setTimeout(() => {
                initGame();
            }, 500);

        } else if (currentAttempt === MAX_ATTEMPTS - 1) {
            // JIKA KALAH: Tampilkan modal game over
            endGame();
        } else {
            currentAttempt++;
            currentTile = 0;
        }
    }, WORD_LENGTH * 150 + 400);
}

function updateKeyboardKey(letter, status) {
    const keyDom = document.querySelector(`[data-key="${letter}"]`);
    if (!keyDom) return;

    if (keyDom.classList.contains("correct")) return;
    if (keyDom.classList.contains("present") && status === "absent") return;

    keyDom.classList.remove("present", "absent");
    keyDom.classList.add(status);
}

function endGame() {
    gameOver = true;
    modal.classList.remove("hidden");
    modalTitle.innerText = "Game Over! 😢";
    modalMessage.innerText = `Kesempatan habis. Daerah yang benar adalah: [${secretWord}]. Skor tertinggi kamu: ${scoreStreak} daerah.`;
}

// Reset total streak kembali ke 0 jika kalah dan mengulang
btnRestart.addEventListener("click", () => {
    scoreStreak = 0;
    initGame();
});

// Integrasi Input Keyboard Fisik PC/Laptop
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleInput("ENTER");
    else if (e.key === "Backspace") handleInput("BACKSPACE");
    else handleInput(e.key);
});


// ==========================================================
// PIXEL ART BACKGROUND GENERATOR ENGINE (CANVAS)
// ==========================================================
const canvas = document.getElementById("pixel-bg");
const ctx = canvas.getContext("2d");

const pixelScale = 8; 
let width = (canvas.width = window.innerWidth / pixelScale);
let height = (canvas.height = window.innerHeight / pixelScale);

window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth / pixelScale;
    height = canvas.height = window.innerHeight / pixelScale;
});

let time = 0;

function drawPixelBackground() {
    time += 0.02;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let noise = Math.sin(x * 0.05 + time) * Math.cos(y * 0.05 + time * 0.5);
            noise += Math.sin(y * 0.1 - time) * 0.5;

            // Efek gradasi perpaduan warna pastel #F9B2D7 dan #CFECF3 menggunakan noise math
            let r = Math.floor(249 + (207 - 249) * ((noise + 1) / 2));
            let g = Math.floor(178 + (236 - 178) * ((noise + 1) / 2));
            let b = Math.floor(215 + (243 - 215) * ((noise + 1) / 2));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    requestAnimationFrame(drawPixelBackground);
}
drawPixelBackground();