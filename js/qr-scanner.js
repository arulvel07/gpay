// ============================================================
// Google Pay Replica — QR Scanner & UPI Parser
// ============================================================

let html5QrCode = null;
let scannerRunning = false;

// Parse UPI QR code URL
// Format: upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=<Currency>&tn=<Note>
function parseUpiUrl(text) {
    if (!text) return null;

    // Check if it's a UPI URL
    const upiPattern = /^upi:\/\/pay\?/i;
    if (!upiPattern.test(text)) {
        // Also try detecting raw VPA patterns
        const vpaPattern = /^[\w.-]+@[\w]+$/;
        if (vpaPattern.test(text.trim())) {
            return { pa: text.trim(), pn: '', am: '', cu: 'INR', tn: '' };
        }
        return null;
    }

    try {
        const url = new URL(text);
        const params = url.searchParams;
        return {
            pa: params.get('pa') || '',       // Payee VPA
            pn: params.get('pn') || '',       // Payee Name
            am: params.get('am') || '',       // Amount
            mc: params.get('mc') || '',       // Merchant Code
            cu: params.get('cu') || 'INR',    // Currency
            tn: params.get('tn') || '',       // Transaction Note
            tr: params.get('tr') || '',       // Transaction Reference
            url: params.get('url') || '',     // URL
            mode: params.get('mode') || '',   // Mode
        };
    } catch (e) {
        console.error('Error parsing UPI URL:', e);
        return null;
    }
}

// Initialize QR Scanner
function initQrScanner(containerId, onSuccess, onError) {
    const container = document.getElementById(containerId);
    if (!container) return;

    html5QrCode = new Html5Qrcode(containerId);
}

// Start scanning
async function startScanning(containerId, onScanSuccess) {
    if (scannerRunning) return;

    try {
        html5QrCode = new Html5Qrcode(containerId);
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
        };

        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                // QR code detected
                const upiData = parseUpiUrl(decodedText);
                if (upiData) {
                    stopScanning();
                    onScanSuccess(upiData, decodedText);
                } else {
                    // Not a UPI QR — still pass the raw text
                    stopScanning();
                    onScanSuccess(null, decodedText);
                }
            },
            (errorMessage) => {
                // Scan error (ignore — continuous scanning)
            }
        );

        scannerRunning = true;
    } catch (err) {
        console.error('Error starting scanner:', err);
        // Try front camera as fallback
        try {
            await html5QrCode.start(
                { facingMode: "user" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    const upiData = parseUpiUrl(decodedText);
                    stopScanning();
                    onScanSuccess(upiData, decodedText);
                },
                () => {}
            );
            scannerRunning = true;
        } catch (err2) {
            console.error('No camera available:', err2);
            showCameraError(containerId);
        }
    }
}

// Stop scanning
async function stopScanning() {
    if (html5QrCode && scannerRunning) {
        try {
            await html5QrCode.stop();
            scannerRunning = false;
        } catch (err) {
            console.error('Error stopping scanner:', err);
            scannerRunning = false;
        }
    }
}

// Show camera error
function showCameraError(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="camera-error">
                <span class="material-symbols-rounded" style="font-size: 64px; color: #5f6368;">no_photography</span>
                <p>Camera access denied or unavailable</p>
                <p class="camera-error-sub">Please allow camera access in your browser settings</p>
            </div>
        `;
    }
}

// Check if device has camera
async function hasCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
    } catch {
        return false;
    }
}
