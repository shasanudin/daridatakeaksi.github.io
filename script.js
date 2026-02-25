// Daftar derivation path yang umum digunakan
const DEFAULT_PATHS = [
    { name: 'BIP44 Legacy', path: "m/44'/0'/0'/0/0" },
    { name: 'BIP49 SegWit', path: "m/49'/0'/0'/0/0" },
    { name: 'BIP84 Native SegWit', path: "m/84'/0'/0'/0/0" },
    { name: 'BIP86 Taproot', path: "m/86'/0'/0'/0/0" },
    { name: 'Electrum', path: "m/0'/0/0" },
    { name: 'Multibit HD', path: "m/0'/0'/0'" },
    { name: 'Ledger Live', path: "m/44'/0'/0'/0/0" },
    { name: 'Trezor (old)', path: "m/44'/0'/0'/0/0" },
    { name: 'Mycelium', path: "m/44'/0'/0'/0/0" },
    { name: 'Coinomi', path: "m/44'/0'/0'/0/0" },
    { name: 'Exodus 1', path: "m/44'/0'/0'/0/0" },
    { name: 'Exodus 2', path: "m/84'/0'/0'/0/0" },
    { name: 'Electrum 2', path: "m/0'/0" },
    { name: 'BIP32 Root', path: "m/0'/0'" }
];

// State
let selectedPaths = [];
let wallets = [];
let isHunting = false;

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    initializePaths();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('generateBtn').addEventListener('click', generateRandomSeed);
    document.getElementById('clearBtn').addEventListener('click', clearSeed);
    document.getElementById('usePassphrase').addEventListener('change', togglePassphrase);
    document.getElementById('selectAllPaths').addEventListener('change', toggleSelectAll);
    document.getElementById('huntBtn').addEventListener('click', startHunting);
    document.getElementById('customPathBtn').addEventListener('click', showCustomPathModal);
    document.getElementById('addCustomPath').addEventListener('click', addCustomPath);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('exportJSON').addEventListener('click', exportToJSON);
    document.getElementById('copyAll').addEventListener('click', copyAllAddresses);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('customPathModal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Inisialisasi daftar path
function initializePaths() {
    const container = document.getElementById('pathsContainer');
    container.innerHTML = '';
    
    DEFAULT_PATHS.forEach((path, index) => {
        const div = document.createElement('div');
        div.className = 'path-item';
        div.innerHTML = `
            <input type="checkbox" id="path${index}" value="${path.path}" checked>
            <label for="path${index}" title="${path.path}">${path.name}</label>
        `;
        container.appendChild(div);
    });
}

// Generate random seed phrase
function generateRandomSeed() {
    if (typeof bip39 === 'undefined') {
        alert('Library bip39 tidak terload. Periksa koneksi internet Anda.');
        return;
    }
    
    const strength = confirm('Gunakan 24 kata? (Klik OK untuk 24 kata, Cancel untuk 12 kata)') ? 256 : 128;
    const mnemonic = bip39.generateMnemonic(strength);
    document.getElementById('seedPhrase').value = mnemonic;
}

// Clear seed input
function clearSeed() {
    document.getElementById('seedPhrase').value = '';
    document.getElementById('passphrase').value = '';
    document.getElementById('usePassphrase').checked = false;
    document.getElementById('passphrase').disabled = true;
}

// Toggle passphrase input
function togglePassphrase() {
    const passphraseInput = document.getElementById('passphrase');
    passphraseInput.disabled = !this.checked;
    if (!this.checked) {
        passphraseInput.value = '';
    }
}

// Toggle select all paths
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('#pathsContainer input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = this.checked);
}

// Show custom path modal
function showCustomPathModal() {
    document.getElementById('customPathModal').style.display = 'block';
}

// Add custom path
function addCustomPath() {
    const customPath = document.getElementById('customPath').value.trim();
    if (!customPath) {
        alert('Masukkan derivation path');
        return;
    }
    
    const container = document.getElementById('pathsContainer');
    const div = document.createElement('div');
    div.className = 'path-item';
    div.innerHTML = `
        <input type="checkbox" id="custom_${Date.now()}" value="${customPath}" checked>
        <label for="custom_${Date.now()}" title="${customPath}">Custom: ${customPath}</label>
    `;
    container.appendChild(div);
    
    document.getElementById('customPathModal').style.display = 'none';
    document.getElementById('customPath').value = '';
}

// Start hunting wallets
async function startHunting() {
    if (isHunting) return;
    
    // Validasi input
    const seedPhrase = document.getElementById('seedPhrase').value.trim();
    if (!seedPhrase) {
        alert('Masukkan seed phrase terlebih dahulu');
        return;
    }
    
    // Validasi seed phrase
    if (!bip39.validateMnemonic(seedPhrase)) {
        alert('Seed phrase tidak valid! Pastikan menggunakan kata-kata BIP39 yang benar.');
        return;
    }
    
    // Ambil path yang dipilih
    selectedPaths = [];
    document.querySelectorAll('#pathsContainer input[type="checkbox"]:checked').forEach(cb => {
        selectedPaths.push(cb.value);
    });
    
    if (selectedPaths.length === 0) {
        alert('Pilih minimal satu derivation path');
        return;
    }
    
    // Reset state
    wallets = [];
    isHunting = true;
    document.getElementById('huntBtn').disabled = true;
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    
    try {
        // Generate seed
        const passphrase = document.getElementById('usePassphrase').checked ? 
                          document.getElementById('passphrase').value : '';
        const seed = bip39.mnemonicToSeedSync(seedPhrase, passphrase);
        
        // Generate master key
        const masterKey = bitcoin.bip32.fromSeed(seed);
        
        // Tampilkan info seed
        document.getElementById('seedInfo').innerHTML = `
            <strong>Seed Phrase:</strong> ${seedPhrase}<br>
            <strong>Passphrase:</strong> ${passphrase || '(none)'}
        `;
        
        document.getElementById('masterKeyInfo').innerHTML = `
            <strong>Master Key (xprv):</strong> ${masterKey.toBase58()}
        `;
        
        // Hunting di setiap path
        for (let i = 0; i < selectedPaths.length; i++) {
            if (!isHunting) break;
            
            const path = selectedPaths[i];
            updateProgress(i, selectedPaths.length, path);
            
            try {
                // Generate wallet dari path
                const childKey = masterKey.derivePath(path);
                const { address } = bitcoin.payments.p2pkh({ 
                    pubkey: childKey.publicKey 
                });
                
                // Coba berbagai format address
                const formats = generateAddressFormats(childKey);
                
                wallets.push({
                    path,
                    index: i,
                    address: formats.p2pkh,
                    addressSegwit: formats.p2sh,
                    addressNative: formats.p2wpkh,
                    addressTaproot: formats.p2tr,
                    privateKey: childKey.toWIF(),
                    publicKey: childKey.publicKey.toString('hex'),
                    xprv: childKey.toBase58(),
                    xpub: childKey.neutered().toBase58()
                });
            } catch (error) {
                console.error(`Error pada path ${path}:`, error);
            }
            
            // Delay untuk UI
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Tampilkan hasil
        displayResults();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        isHunting = false;
        document.getElementById('huntBtn').disabled = false;
    }
}

// Generate berbagai format address
function generateAddressFormats(key) {
    const pubkey = key.publicKey;
    
    return {
        // P2PKH (Legacy)
        p2pkh: bitcoin.payments.p2pkh({ pubkey }).address,
        
        // P2SH-P2WPKH (SegWit)
        p2sh: bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({ pubkey })
        }).address,
        
        // P2WPKH (Native SegWit)
        p2wpkh: bitcoin.payments.p2wpkh({ pubkey }).address,
        
        // P2TR (Taproot)
        p2tr: bitcoin.payments.p2tr({ 
            internalPubkey: pubkey.slice(1, 33) 
        }).address
    };
}

// Update progress
function updateProgress(current, total, path) {
    const percentage = ((current + 1) / total) * 100;
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = 
        `${current + 1}/${total} paths selesai`;
    document.getElementById('currentPath').textContent = 
        `Sedang memeriksa: ${path}`;
}

// Display results
function displayResults() {
    const container = document.getElementById('walletsContainer');
    container.innerHTML = '';
    
    document.getElementById('totalWallets').textContent = wallets.length;
    
    wallets.forEach((wallet, index) => {
        const card = document.createElement('div');
        card.className = 'wallet-card';
        
        // Generate QR code untuk address
        const qrId = `qr_${index}`;
        
        card.innerHTML = `
            <h4>Wallet #${index + 1}</h4>
            <div class="wallet-detail">
                <span class="label">Derivation Path:</span>
                <span class="value">${wallet.path}</span>
            </div>
            <div class="wallet-detail">
                <span class="label">Address (Legacy):</span>
                <span class="value">${wallet.address}</span>
            </div>
            <div class="wallet-detail">
                <span class="label">Address (SegWit):</span>
                <span class="value">${wallet.addressSegwit}</span>
            </div>
            <div class="wallet-detail">
                <span class="label">Address (Native):</span>
                <span class="value">${wallet.addressNative}</span>
            </div>
            <div class="wallet-detail">
                <span class="label">Address (Taproot):</span>
                <span class="value">${wallet.addressTaproot}</span>
            </div>
            <div class="wallet-detail">
                <span class="label">Private Key (WIF):</span>
                <span class="value">${wallet.privateKey}</span>
            </div>
            <div class="wallet-detail">
                <span class="label">Public Key:</span>
                <span class="value">${wallet.publicKey.substring(0, 30)}...</span>
            </div>
            <div class="qr-container" id="${qrId}"></div>
        `;
        
        container.appendChild(card);
        
        // Generate QR code
        setTimeout(() => {
            QRCode.toCanvas(document.getElementById(qrId), wallet.address, {
                width: 100,
                margin: 1,
                color: {
                    dark: '#f7931a',
                    light: '#000000'
                }
            }, (error) => {
                if (error) console.error('QR Error:', error);
            });
        }, 100);
    });
    
    document.getElementById('resultsSection').style.display = 'block';
}

// Export ke CSV
function exportToCSV() {
    if (wallets.length === 0) return;
    
    const headers = ['Path', 'Address (Legacy)', 'Address (SegWit)', 'Address (Native)', 
                     'Address (Taproot)', 'Private Key (WIF)', 'Public Key', 'xprv', 'xpub'];
    
    const csvContent = [
        headers.join(','),
        ...wallets.map(w => [
            w.path,
            w.address,
            w.addressSegwit,
            w.addressNative,
            w.addressTaproot,
            w.privateKey,
            w.publicKey,
            w.xprv,
            w.xpub
        ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'wallets.csv', 'text/csv');
}

// Export ke JSON
function exportToJSON() {
    const jsonContent = JSON.stringify(wallets, null, 2);
    downloadFile(jsonContent, 'wallets.json', 'application/json');
}

// Copy all addresses
function copyAllAddresses() {
    const addresses = wallets.map(w => 
        `Path: ${w.path}\nLegacy: ${w.address}\nSegWit: ${w.addressSegwit}\nNative: ${w.addressNative}\nTaproot: ${w.addressTaproot}\n`
    ).join('\n---\n\n');
    
    navigator.clipboard.writeText(addresses).then(() => {
        alert('Semua address telah dicopy ke clipboard!');
    }).catch(() => {
        alert('Gagal copy ke clipboard');
    });
}

// Download file
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Export ke global
window.startHunting = startHunting;
