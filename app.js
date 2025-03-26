// Mock user data
const currentUser = {
    id: 'user_123',
    name: 'John Doe',
    walletId: 'wallet_789'
};

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const refreshBtn = document.getElementById('refresh-btn');
const startScanBtn = document.getElementById('start-scan');
const stopScanBtn = document.getElementById('stop-scan');
const qrCanvas = document.getElementById('qr-canvas');
const scannerVideo = document.getElementById('scanner');
const scanResult = document.getElementById('scan-result');
const confirmModal = document.getElementById('confirm-modal');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');
const qrAmount = document.getElementById('qr-amount');
const qrExpiry = document.getElementById('qr-expiry');
const confirmAmount = document.getElementById('confirm-amount');
const confirmMerchant = document.getElementById('confirm-merchant');
const loadingOverlay = document.getElementById('loading-overlay');
const toast = document.getElementById('toast');
const amountInput = document.getElementById('amount');
const txnLimitSelect = document.getElementById('txn-limit');
const refreshTxnBtn = document.getElementById('refresh-txn');
const transactionsList = document.getElementById('transactions-list');
const cameraSelect = document.getElementById('camera-select');
const scannerPlaceholder = document.getElementById('scanner-placeholder');

// State variables
let currentQRData = null;
let qrExpiryInterval = null;
let scannerInstance = null;
let activeCameraId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('username').textContent = `Welcome, ${currentUser.name}`;
    
    // Set up event listeners
    setupEventListeners();
    
    // Load transaction history
    await loadTransactionHistory();
    
    // Initialize camera selection
    initCameraSelection();
});

function setupEventListeners() {
    // Input validation for amount
    amountInput.addEventListener('input', validateAmount);
    
    // Transaction history controls
    txnLimitSelect.addEventListener('change', loadTransactionHistory);
    refreshTxnBtn.addEventListener('click', loadTransactionHistory);
    
    // Generate QR code with loading state
    generateBtn.addEventListener('click', async () => {
        if (validateForm()) {
            await generateQRCode();
        }
    });
    
    // Scanner controls
    startScanBtn.addEventListener('click', startScanner);
    stopScanBtn.addEventListener('click', stopScanner);
    cameraSelect.addEventListener('change', switchCamera);
    
    // Payment confirmation
    confirmBtn.addEventListener('click', processPayment);
    cancelBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        // In a real app, this would clear the session
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    });
}

// Enhanced input validation
function validateAmount() {
    const errorElement = document.getElementById('amount-error');
    const amount = parseFloat(amountInput.value);
    
    if (!amountInput.value) {
        showError(amountInput, errorElement, 'Amount is required');
        return false;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showError(amountInput, errorElement, 'Please enter a valid positive amount');
        return false;
    }
    
    if (amount > 10000) {
        showError(amountInput, errorElement, 'Amount cannot exceed $10,000');
        return false;
    }
    
    clearError(amountInput, errorElement);
    return true;
}

function validateForm() {
    const isValidAmount = validateAmount();
    const description = document.getElementById('description').value;
    const descError = document.getElementById('description-error');
    
    if (!description) {
        showError(document.getElementById('description'), descError, 'Description is required');
        return false;
    }
    
    clearError(document.getElementById('description'), descError);
    return isValidAmount;
}

function showError(input, errorElement, message) {
    input.classList.add('input-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearError(input, errorElement) {
    input.classList.remove('input-error');
    errorElement.style.display = 'none';
}

// Enhanced QR Code Generation with loading state
async function generateQRCode() {
    try {
        showLoading('Generating secure QR code...');
        
        const amount = document.getElementById('amount').value;
        const currency = document.getElementById('currency').value;
        const description = document.getElementById('description').value;
        
        // Create secure payload
        currentQRData = {
            transactionId: generateUUID(),
            amount: parseFloat(amount).toFixed(2),
            currency,
            description,
            merchantId: currentUser.walletId,
            merchantName: currentUser.name,
            timestamp: Date.now(),
            expiresAt: Date.now() + 300000, // 5 minutes
            // In production: Add digital signature here
        };
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Display QR Code
        await QRCode.toCanvas(qrCanvas, JSON.stringify(currentQRData), {
            errorCorrectionLevel: 'H',
            width: 250,
            margin: 2
        });
        
        // Update UI
        qrAmount.textContent = `${currentQRData.amount} ${currentQRData.currency}`;
        updateExpiryTimer();
        refreshBtn.disabled = false;
        
        // Start expiry countdown
        if (qrExpiryInterval) clearInterval(qrExpiryInterval);
        qrExpiryInterval = setInterval(updateExpiryTimer, 1000);
        
        showToast('QR code generated successfully', 'success');
    } catch (error) {
        console.error('QR generation error:', error);
        showToast('Failed to generate QR code', 'error');
    } finally {
        hideLoading();
    }
}

function updateExpiryTimer() {
    if (!currentQRData) return;
    
    const now = Date.now();
    const expiresIn = currentQRData.expiresAt - now;
    
    if (expiresIn <= 0) {
        qrExpiry.textContent = 'Expired';
        clearInterval(qrExpiryInterval);
        refreshBtn.disabled = false;
        return;
    }
    
    const minutes = Math.floor(expiresIn / 60000);
    const seconds = Math.floor((expiresIn % 60000) / 1000);
    qrExpiry.textContent = `${minutes}m ${seconds}s`;
}

// Refresh QR Code
refreshBtn.addEventListener('click', async () => {
    if (!currentQRData) return;
    
    try {
        showLoading('Refreshing QR code...');
        
        // Update expiry time
        currentQRData.timestamp = Date.now();
        currentQRData.expiresAt = Date.now() + 300000;
        currentQRData.transactionId = generateUUID();
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Regenerate QR
        await QRCode.toCanvas(qrCanvas, JSON.stringify(currentQRData), {
            errorCorrectionLevel: 'H',
            width: 250,
            margin: 2
        });
        
        // Reset timer
        updateExpiryTimer();
        refreshBtn.disabled = true;
        if (qrExpiryInterval) clearInterval(qrExpiryInterval);
        qrExpiryInterval = setInterval(updateExpiryTimer, 1000);
        
        showToast('QR code refreshed', 'success');
    } catch (error) {
        console.error('Error refreshing QR:', error);
        showToast('Failed to refresh QR', 'error');
    } finally {
        hideLoading();
    }
});

// Real QR Scanner Implementation
async function initCameraSelection() {
    try {
        if (!Instascan) {
            console.error('Instascan not loaded');
            return;
        }
        
        const cameras = await Instascan.Camera.getCameras();
        if (cameras.length === 0) {
            console.error('No cameras found');
            showToast('No cameras detected', 'error');
            return;
        }
        
        cameraSelect.innerHTML = '<option value="">Select Camera</option>';
        cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.id;
            option.text = camera.name || `Camera ${cameraSelect.options.length}`;
            cameraSelect.appendChild(option);
        });
        
        cameraSelect.style.display = 'block';
    } catch (error) {
        console.error('Camera error:', error);
        showToast('Camera access error', 'error');
    }
}

async function startScanner() {
    try {
        showLoading('Initializing scanner...');
        
        const selectedCameraId = cameraSelect.value;
        if (!selectedCameraId) {
            showToast('Please select a camera first', 'error');
            hideLoading();
            return;
        }
        
        scannerInstance = new Instascan.Scanner({
            video: scannerVideo,
            mirror: false,
            captureImage: false,
            backgroundScan: true
        });
        
        scannerInstance.addListener('scan', handleScannedQR);
        
        const cameras = await Instascan.Camera.getCameras();
        const selectedCamera = cameras.find(c => c.id === selectedCameraId);
        
        if (!selectedCamera) {
            throw new Error('Selected camera not found');
        }
        
        await scannerInstance.start(selectedCamera);
        activeCameraId = selectedCameraId;
        
        scannerPlaceholder.style.display = 'none';
        scannerVideo.style.display = 'block';
        startScanBtn.disabled = true;
        stopScanBtn.disabled = false;
        
        showToast('Scanner started', 'success');
    } catch (error) {
        console.error('Scanner error:', error);
        showToast(`Scanner error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function stopScanner() {
    try {
        if (scannerInstance) {
            await scannerInstance.stop();
            scannerInstance = null;
            activeCameraId = null;
        }
        
        scannerVideo.style.display = 'none';
        scannerPlaceholder.style.display = 'flex';
        startScanBtn.disabled = false;
        stopScanBtn.disabled = true;
        scanResult.textContent = '';
    } catch (error) {
        console.error('Error stopping scanner:', error);
        showToast('Error stopping scanner', 'error');
    }
}

async function switchCamera() {
    if (scannerInstance && activeCameraId !== cameraSelect.value) {
        await stopScanner();
        await startScanner();
    }
}

function handleScannedQR(content) {
    try {
        const data = JSON.parse(content);
        
        if (!data.amount || !data.currency || !data.merchantId) {
            throw new Error('Invalid payment QR code');
        }
        
        // Show confirmation modal
        confirmAmount.textContent = `${data.amount} ${data.currency}`;
        confirmMerchant.textContent = data.merchantName || data.merchantId;
        confirmModal.style.display = 'flex';
        
        // Store the scanned data in the confirm button
        confirmBtn.dataset.scannedData = content;
    } catch (e) {
        console.error('QR parsing error:', e);
        scanResult.textContent = 'Invalid payment QR code';
        scanResult.style.color = 'var(--danger-color)';
    }
}

// Enhanced Payment Processing
async function processPayment() {
    try {
        showLoading('Processing payment...');
        
        const qrData = JSON.parse(confirmBtn.dataset.scannedData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create transaction record
        const transaction = {
            id: generateUUID(),
            amount: parseFloat(qrData.amount),
            currency: qrData.currency,
            merchant: qrData.merchantName || qrData.merchantId,
            type: 'debit',
            status: 'completed',
            timestamp: new Date().toISOString(),
            description: `Payment to ${qrData.merchantName || qrData.merchantId}`
        };
        
        // Add to transaction history
        await addTransaction(transaction);
        await loadTransactionHistory();
        
        // Show success
        scanResult.textContent = `Payment of ${qrData.amount} ${qrData.currency} processed!`;
        scanResult.style.color = 'var(--success-color)';
        
        showToast('Payment successful!', 'success');
    } catch (error) {
        console.error('Payment error:', error);
        scanResult.textContent = 'Payment failed. Please try again.';
        scanResult.style.color = 'var(--danger-color)';
        showToast('Payment failed', 'error');
    } finally {
        confirmModal.style.display = 'none';
        hideLoading();
        stopScanner();
        
        // Clear after 5 seconds
        setTimeout(() => {
            scanResult.textContent = '';
            scanResult.style.color = '';
        }, 5000);
    }
}

// Transaction History
async function loadTransactionHistory() {
    try {
        showLoading('Loading transactions...');
        const limit = parseInt(txnLimitSelect.value);
        
        // In a real app, this would be an API call
        const transactions = await mockLoadTransactions(limit);
        
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<p class="no-transactions">No transactions found</p>';
            return;
        }
        
        transactions.forEach(txn => {
            const txnElement = document.createElement('div');
            txnElement.className = 'transaction-item';
            
            txnElement.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-description">${txn.description}</div>
                    <div class="transaction-meta">
                        <span>${formatDate(txn.timestamp)}</span>
                        <span>${txn.status}</span>
                    </div>
                </div>
                <div class="transaction-amount ${txn.type}">
                    ${txn.type === 'debit' ? '-' : '+'}${txn.amount} ${txn.currency}
                </div>
            `;
            
            transactionsList.appendChild(txnElement);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Failed to load transactions', 'error');
    } finally {
        hideLoading();
    }
}

async function mockLoadTransactions(limit = 10) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    const mockTransactions = [
        {
            id: 'txn_1',
            amount: 50.00,
            currency: 'USD',
            merchant: 'Amazon',
            type: 'debit',
            status: 'completed',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            description: 'Online purchase at Amazon'
        },
        {
            id: 'txn_2',
            amount: 1200.00,
            currency: 'USD',
            merchant: 'Salary',
            type: 'credit',
            status: 'completed',
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            description: 'Monthly salary'
        },
        {
            id: 'txn_3',
            amount: 25.50,
            currency: 'USD',
            merchant: 'Coffee Shop',
            type: 'debit',
            status: 'completed',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            description: 'Coffee and snacks'
        }
    ];
    
    // Sort by timestamp (newest first)
    return mockTransactions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
}

async function addTransaction(transaction) {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return transaction;
}

// Helper functions
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function showLoading(message = '') {
    if (message) {
        document.querySelector('.loading-text').textContent = message;
    }
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast';
    if (type) toast.classList.add(type);
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}