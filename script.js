// Konfigurasi game
const GRID_SIZE = 8;
const TOTAL_BITCOINS = 10;
const TOTAL_TRAPS = 5;

// State game
let grid = [];
let score = 0;
let bitcoinsFound = 0;
let gameActive = true;

// Inisialisasi game
function initGame() {
    grid = [];
    score = 0;
    bitcoinsFound = 0;
    gameActive = true;
    
    // Buat grid kosong
    for (let i = 0; i < GRID_SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            grid[i][j] = {
                type: 'empty',
                revealed: false
            };
        }
    }
    
    // Tempatkan Bitcoin secara random
    let bitcoinsPlaced = 0;
    while (bitcoinsPlaced < TOTAL_BITCOINS) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        
        if (grid[row][col].type === 'empty') {
            grid[row][col].type = 'bitcoin';
            bitcoinsPlaced++;
        }
    }
    
    // Tempatkan jebakan secara random
    let trapsPlaced = 0;
    while (trapsPlaced < TOTAL_TRAPS) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        
        if (grid[row][col].type === 'empty') {
            grid[row][col].type = 'trap';
            trapsPlaced++;
        }
    }
    
    updateDisplay();
    updateStats();
}

// Membuat grid HTML
function createGrid() {
    const gridContainer = document.getElementById('gameGrid');
    gridContainer.innerHTML = '';
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            if (grid[i][j].revealed) {
                cell.classList.add('revealed');
                if (grid[i][j].type === 'bitcoin') {
                    cell.classList.add('bitcoin');
                    cell.textContent = '₿';
                } else if (grid[i][j].type === 'trap') {
                    cell.classList.add('trap');
                    cell.textContent = '⚠';
                }
            }
            
            cell.addEventListener('click', handleCellClick);
            gridContainer.appendChild(cell);
        }
    }
}

// Handle klik pada cell
function handleCellClick(e) {
    if (!gameActive) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const cell = grid[row][col];
    
    if (cell.revealed) return;
    
    cell.revealed = true;
    
    if (cell.type === 'bitcoin') {
        score += 100;
        bitcoinsFound++;
        showMessage('🎉 Selamat! Anda menemukan Bitcoin! +100 poin');
    } else if (cell.type === 'trap') {
        score = Math.max(0, score - 50);
        showMessage('💥 Aduh! Terkena jebakan! -50 poin');
    } else {
        score += 10;
        showMessage('📦 Kotak kosong +10 poin');
    }
    
    updateDisplay();
    updateStats();
    
    // Cek kondisi menang
    if (bitcoinsFound === TOTAL_BITCOINS) {
        gameActive = false;
        showMessage('🎊 SELAMAT! Anda menemukan semua Bitcoin! 🎊');
    }
}

// Update tampilan grid
function updateDisplay() {
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellData = grid[row][col];
        
        if (cellData.revealed) {
            cell.classList.add('revealed');
            if (cellData.type === 'bitcoin') {
                cell.classList.add('bitcoin');
                cell.textContent = '₿';
            } else if (cellData.type === 'trap') {
                cell.classList.add('trap');
                cell.textContent = '⚠';
            } else {
                cell.textContent = '·';
            }
        } else {
            cell.className = 'cell';
            cell.textContent = '';
        }
    });
}

// Update statistik
function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('bitcoinCount').textContent = `${bitcoinsFound}/${TOTAL_BITCOINS}`;
}

// Tampilkan pesan
function showMessage(msg) {
    const hintBox = document.getElementById('hintBox');
    const hintText = document.getElementById('hintText');
    
    hintBox.style.display = 'block';
    hintText.textContent = msg;
    
    setTimeout(() => {
        hintBox.style.display = 'none';
    }, 3000);
}

// Reset game
function resetGame() {
    initGame();
    createGrid();
    document.getElementById('hintBox').style.display = 'none';
}

// Beri petunjuk
function giveHint() {
    if (!gameActive) return;
    
    // Cari Bitcoin yang belum ditemukan
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j].type === 'bitcoin' && !grid[i][j].revealed) {
                showMessage(`Petunjuk: Coba lihat di baris ${i + 1}, kolom ${j + 1}`);
                return;
            }
        }
    }
    
    showMessage('Semua Bitcoin sudah ditemukan!');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    createGrid();
    
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('hintBtn').addEventListener('click', giveHint);
});
