// ============================================================
// Google Pay Replica — Main App Controller
// ============================================================

(function () {
    'use strict';

    // ---------- State ----------
    let currentScreen = 'home';
    let currentPayee = null;
    let pinValue = '';
    let payAmount = '';
    let balanceVisible = false;

    // ---------- DOM Helpers ----------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---------- Initialize App ----------
    async function init() {
        try {
            // Load data from Supabase (or fallback to local)
            await SupabaseDB.fetchTransactions();
            await SupabaseDB.fetchBalance();
            await SupabaseDB.fetchContacts();
        } catch (err) {
            console.error('Failed to init Supabase data, falling back to local:', err);
        }

        try {
            renderHome();
            renderHistory();
            renderOffers();
            setupNavigation();
            setupPaymentFlow();
            setupPinPad();
            setupSearch();
            setupBalanceCard();
        } catch (err) {
            console.error('Render error:', err);
        }

        // Splash screen
        setTimeout(() => {
            const splash = $('#splash-screen');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.style.display = 'none';
                    showScreen('home');
                }, 500);
            }
        }, 1800);

        // Apply ripple effects
        initRipples();

        // History API setup
        if (!window.location.hash) {
            history.replaceState(null, '', '#home');
        }
        window.addEventListener('popstate', handlePopState);
    }

    // ---------- History State ----------
    let isHistoryNavigating = false;

    function pushHistory(hash) {
        if (!isHistoryNavigating) {
            history.pushState(null, '', '#' + hash);
        }
    }

    function popHistory() {
        if (!isHistoryNavigating) {
            isHistoryNavigating = true;
            history.back();
            setTimeout(() => { isHistoryNavigating = false; }, 100);
        }
    }

    function handlePopState(e) {
        if (isHistoryNavigating) return;

        isHistoryNavigating = true;
        const hash = window.location.hash.replace('#', '');

        const result = $('#screen-result');
        const pin = $('#screen-pin');
        const payment = $('#screen-payment');
        const scanner = $('#screen-scanner');

        if (result && !result.classList.contains('hidden')) {
            result.style.opacity = '0';
            setTimeout(() => {
                result.style.display = 'none';
                result.classList.add('hidden');
                result.style.opacity = '';
                showScreen('home');
            }, 300);
        } else if (pin && !pin.classList.contains('hidden')) {
            const el = $('#screen-pin');
            slideOut(el, 'right');
            setTimeout(() => el.classList.add('hidden'), 350);
        } else if (payment && !payment.classList.contains('hidden')) {
            const el = $('#screen-payment');
            slideOut(el, 'right');
            setTimeout(() => el.classList.add('hidden'), 350);
        } else if (scanner && !scanner.classList.contains('hidden')) {
            if (typeof stopScanning === 'function') stopScanning();
            const el = $('#screen-scanner');
            slideOut(el, 'right');
            setTimeout(() => el.classList.add('hidden'), 350);
        } else {
            const target = ['home', 'history', 'offers', 'profile'].includes(hash) ? hash : 'home';
            
            const tabScreens = ['home', 'history', 'offers', 'profile'];
            tabScreens.forEach(s => {
                const el = $(`#screen-${s}`);
                if (s === target) {
                    el.classList.remove('hidden');
                    el.classList.add('active');
                } else {
                    el.classList.add('hidden');
                    el.classList.remove('active');
                }
            });
            currentScreen = target;
            
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            const activeNav = $(`.nav-item[data-screen="${target}"]`);
            if (activeNav) activeNav.classList.add('active');
        }

        setTimeout(() => { isHistoryNavigating = false; }, 100);
    }

    // ---------- Navigation ----------
    function setupNavigation() {
        $$('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.dataset.screen;
                if (!screen) return;

                if (screen === 'scanner') {
                    openScanner();
                    return;
                }

                // Update active nav
                $$('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                showScreen(screen);
            });
        });

        // Scanner back
        $('#btn-scanner-back').addEventListener('click', () => {
            closeScanner();
        });

        // Profile from home avatar
        $('#btn-profile-home').addEventListener('click', () => {
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            $('#nav-profile').classList.add('active');
            showScreen('profile');
        });

        // View all transactions
        $('#btn-view-all-transactions').addEventListener('click', () => {
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            $('#nav-history').classList.add('active');
            showScreen('history');
        });
    }

    function showScreen(name) {
        if (name !== currentScreen) pushHistory(name);

        const tabScreens = ['home', 'history', 'offers', 'profile'];
        tabScreens.forEach(s => {
            const el = $(`#screen-${s}`);
            if (s === name) {
                el.classList.remove('hidden');
                el.classList.add('active');
            } else {
                el.classList.add('hidden');
                el.classList.remove('active');
            }
        });
        currentScreen = name;
    }

    function showOverlay(name) {
        pushHistory('overlay-' + name);
        const el = $(`#screen-${name}`);
        el.classList.remove('hidden');
        slideIn(el, 'right');
    }

    function hideOverlay(name) {
        popHistory();
        const el = $(`#screen-${name}`);
        slideOut(el, 'right');
        setTimeout(() => el.classList.add('hidden'), 350);
    }

    // ---------- Home Screen ----------
    function renderHome() {
        // Quick Actions
        const grid = $('#quick-actions-grid');
        grid.innerHTML = APP_DATA.quickActions.map(action => `
            <div class="quick-action-item ripple" data-action="${action.id}">
                <div class="quick-action-icon">
                    <span class="material-symbols-rounded">${action.icon}</span>
                </div>
                <span class="quick-action-label">${action.label}</span>
            </div>
        `).join('');

        grid.querySelectorAll('.quick-action-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                if (action === 'scan') {
                    openScanner();
                } else if (action === 'pay-contacts') {
                    startPayment(APP_DATA.contacts[0]);
                } else if (action === 'pay-phone') {
                    startPayment({ name: 'Phone Number', initials: 'PN', upiId: 'Enter number', color: '#34A853' });
                } else if (action === 'pay-self') {
                    startPayment({
                        name: APP_DATA.user.name,
                        initials: APP_DATA.user.initials,
                        upiId: APP_DATA.user.upiId,
                        color: '#1a73e8'
                    });
                }
            });
        });

        // People scroll
        const peopleScroll = $('#people-scroll');
        peopleScroll.innerHTML = APP_DATA.contacts.map(contact => `
            <div class="person-item ripple" data-upi-id="${contact.upiId}">
                <div class="person-avatar" style="background: ${contact.color};">${contact.initials}</div>
                <span class="person-name">${contact.name.split(' ')[0]}</span>
            </div>
        `).join('');

        peopleScroll.querySelectorAll('.person-item').forEach(item => {
            item.addEventListener('click', () => {
                const upiId = item.dataset.upiId;
                const contact = APP_DATA.contacts.find(c => c.upiId === upiId);
                if (contact) startPayment(contact);
            });
        });

        // Bills grid
        const billsGrid = $('#bills-grid');
        billsGrid.innerHTML = APP_DATA.billCategories.map(bill => `
            <div class="bill-item ripple">
                <div class="bill-icon" style="background: ${bill.color};">
                    <span class="material-symbols-rounded">${bill.icon}</span>
                </div>
                <span class="bill-label">${bill.label}</span>
            </div>
        `).join('');

        // Offers scroll
        const offersScroll = $('#offers-scroll');
        offersScroll.innerHTML = APP_DATA.offers.map(offer => `
            <div class="offer-card" style="background: ${offer.color};">
                <span class="material-symbols-rounded offer-icon">${offer.icon}</span>
                <div class="offer-title">${offer.title}</div>
                <div class="offer-desc">${offer.desc}</div>
            </div>
        `).join('');

        // Recent transactions (show 4)
        renderTransactionList('#home-transactions', APP_DATA.transactions.slice(0, 4));
    }

    function renderTransactionList(selector, transactions) {
        const container = $(selector);
        container.innerHTML = transactions.map(tx => `
            <div class="transaction-item ripple list-item" data-tx-id="${tx.id}">
                <div class="transaction-avatar" style="background: ${tx.color};">${tx.initials}</div>
                <div class="transaction-details">
                    <div class="transaction-name">${tx.name}</div>
                    <div class="transaction-date">${formatDate(tx.date)}</div>
                </div>
                <div class="transaction-amount ${tx.type === 'sent' ? 'sent' : 'received'}">
                    ${tx.type === 'sent' ? '- ' : '+ '}${formatCurrency(tx.amount)}
                </div>
            </div>
        `).join('');

        setTimeout(() => animateListItems(container, '.transaction-item'), 100);
    }

    // ---------- History Screen ----------
    function renderHistory(filter = 'all') {
        let transactions = APP_DATA.transactions;
        if (filter === 'sent') transactions = transactions.filter(tx => tx.type === 'sent');
        else if (filter === 'received') transactions = transactions.filter(tx => tx.type === 'received');
        else if (filter === 'rewards') transactions = transactions.filter(tx => tx.name === 'Cashback');

        renderTransactionList('#history-transactions', transactions);

        $$('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
            chip.onclick = () => renderHistory(chip.dataset.filter);
        });
    }

    // ---------- Offers Screen ----------
    function renderOffers() {
        const list = $('#offers-list');
        list.innerHTML = APP_DATA.offers.map(offer => `
            <div class="promo-card ripple" style="background: linear-gradient(135deg, ${offer.color}, ${offer.color}cc);">
                <div class="promo-icon">
                    <span class="material-symbols-rounded">${offer.icon}</span>
                </div>
                <div class="promo-content">
                    <div class="promo-title">${offer.title}</div>
                    <div class="promo-desc">${offer.desc}</div>
                </div>
                <span class="material-symbols-rounded" style="opacity: 0.7;">chevron_right</span>
            </div>
        `).join('');
    }

    // ---------- Balance Card ----------
    function setupBalanceCard() {
        $('#btn-check-balance').addEventListener('click', async () => {
            if (!balanceVisible) {
                balanceVisible = true;
                const display = $('#balance-display');
                const balance = await SupabaseDB.fetchBalance();
                animateNumber(display, balance);
                $('#btn-check-balance').textContent = 'Hide balance';
            } else {
                balanceVisible = false;
                $('#balance-display').textContent = '••••••';
                $('#btn-check-balance').textContent = 'Check balance';
            }
        });
    }

    // ---------- Search ----------
    function setupSearch() {
        const searchBar = $('#search-bar');
        const searchInput = $('#search-input');

        searchBar.addEventListener('click', () => {
            searchInput.removeAttribute('readonly');
            searchInput.focus();
        });

        searchInput.addEventListener('blur', () => {
            searchInput.setAttribute('readonly', '');
        });
    }

    // ---------- QR Scanner ----------
    function openScanner() {
        pushHistory('scanner');
        const screen = $('#screen-scanner');
        screen.classList.remove('hidden');
        slideIn(screen, 'right');

        setTimeout(() => {
            startScanning('qr-reader', onQrScanned);
        }, 500);
    }

    function closeScanner() {
        popHistory();
        stopScanning();
        const screen = $('#screen-scanner');
        slideOut(screen, 'right');
        setTimeout(() => screen.classList.add('hidden'), 350);
    }

    function onQrScanned(upiData, rawText) {
        closeScanner();

        if (upiData) {
            const payee = {
                name: upiData.pn || 'Unknown Payee',
                initials: (upiData.pn || 'UP').substring(0, 2).toUpperCase(),
                upiId: upiData.pa,
                color: '#1a73e8',
                amount: upiData.am || '',
                note: upiData.tn || ''
            };
            setTimeout(() => startPayment(payee, upiData.am, upiData.tn), 400);
        } else {
            alert(`QR Code Detected:\n${rawText}\n\n(Not a UPI QR code)`);
        }
    }

    // ---------- Payment Flow ----------
    function setupPaymentFlow() {
        const amountInput = $('#amount-input');
        amountInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
            if (parts[1] && parts[1].length > 2) val = parts[0] + '.' + parts[1].substring(0, 2);
            e.target.value = val;
            payAmount = val;

            const payBtn = $('#btn-pay');
            const hasAmount = val && parseFloat(val) > 0;
            payBtn.disabled = !hasAmount;

            if (hasAmount) {
                const amt = parseFloat(val);
                $('#pay-btn-amount').textContent = '₹' + (Number.isInteger(amt) ? amt : amt.toFixed(2));
            } else {
                $('#pay-btn-amount').textContent = '₹0';
            }
        });

        $('#btn-pay').addEventListener('click', () => {
            if (!payAmount || parseFloat(payAmount) <= 0) return;
            showPinScreen();
        });

        $('#btn-payment-back').addEventListener('click', () => {
            hideOverlay('payment');
        });
    }

    function startPayment(contact, prefillAmount, prefillNote) {
        prefillAmount = prefillAmount || '';
        prefillNote = prefillNote || '';
        currentPayee = contact;

        $('#payee-initials').textContent = contact.initials;
        $('#payee-avatar').style.background = contact.color || '#9aa0a6';
        $('#payee-name').textContent = contact.name;
        $('#payee-banking-name').textContent = contact.name;
        $('#payee-upi-display').textContent = contact.upiId || '';

        $('#sheet-bank-name').textContent = APP_DATA.user.bank.name + ' ••••' + APP_DATA.user.bank.account.slice(-4);

        const amountInput = $('#amount-input');
        const noteInput = $('#note-input');

        amountInput.value = prefillAmount;
        noteInput.value = prefillNote;
        payAmount = prefillAmount;

        const hasAmount = prefillAmount && parseFloat(prefillAmount) > 0;
        $('#btn-pay').disabled = !hasAmount;
        if (hasAmount) {
            const amt = parseFloat(prefillAmount);
            $('#pay-btn-amount').textContent = '₹' + (Number.isInteger(amt) ? amt : amt.toFixed(2));
        } else {
            $('#pay-btn-amount').textContent = '₹0';
        }

        showOverlay('payment');

        if (!prefillAmount) {
            setTimeout(() => amountInput.focus(), 400);
        }
    }

    // ---------- PIN Screen ----------
    function setupPinPad() {
        const numpad = $('#pin-numpad');
        numpad.querySelectorAll('.upi-numpad-key').forEach(key => {
            key.addEventListener('click', () => {
                const val = key.dataset.key;

                if (key.id === 'btn-confirm-pin') return;
                if (val === 'back') {
                    pinValue = pinValue.slice(0, -1);
                } else if (val === '' || val === undefined) {
                    return;
                } else if (pinValue.length < 6) {
                    pinValue += val;
                }

                updatePinDots();

                if (pinValue.length === 6) {
                    $('#btn-confirm-pin').disabled = false;
                } else {
                    $('#btn-confirm-pin').disabled = true;
                }
            });
        });

        $('#btn-confirm-pin').addEventListener('click', () => {
            processPayment();
        });

        $('#btn-pin-back').addEventListener('click', () => {
            pinValue = '';
            updatePinDots();
            hideOverlay('pin');
        });
    }

    function showPinScreen() {
        pinValue = '';
        updatePinDots();
        $('#btn-confirm-pin').disabled = true;

        const amount = parseFloat(payAmount);
        $('#pin-pay-amount').textContent = '₹' + amount.toFixed(2);
        $('#pin-payee-name').textContent = currentPayee.name;
        $('#pin-bank-name').textContent = APP_DATA.user.bank.name;

        showOverlay('pin');
    }

    function updatePinDots() {
        const dots = $$('#pin-dots .upi-dot');
        dots.forEach((dot, i) => {
            if (i < pinValue.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }

    // ---------- Process Payment ----------
    function processPayment() {
        // Capture everything BEFORE any resets
        const amount = parseFloat(payAmount);
        const enteredPin = pinValue;
        const payee = currentPayee;
        const noteVal = $('#note-input').value || '';
        const isSuccess = (enteredPin === '111927');

        const resultScreen = $('#screen-result');
        const resultContent = $('#result-content');

        // Reset immediately
        pinValue = '';
        payAmount = '';

        // Hide pin and payment
        hideOverlay('pin');
        setTimeout(() => hideOverlay('payment'), 100);

        // Format date
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        }) + ', ' + now.toLocaleTimeString('en-IN', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });

        const formattedAmount = '₹' + amount.toFixed(2);

        // Show result — NO async here, listeners attach instantly
        setTimeout(() => {
            resultScreen.classList.remove('hidden');
            resultScreen.style.display = '';
            resultScreen.style.opacity = '1';

            if (isSuccess) {
                try {
                    const paySound = new Audio('gpay sound.mp3');
                    paySound.play().catch(() => { });
                } catch (e) { }

                resultContent.innerHTML = `
                    <div class="result-main-content">
                        <div class="result-icon-circle success">
                            <span class="material-symbols-rounded">check</span>
                        </div>
                        <div class="result-amount">${formattedAmount}</div>
                        <div class="result-paid-label">Paid to</div>
                        <div class="result-payee-name">${payee.name}</div>
                        <div class="result-payee-upi">${payee.upiId}</div>
                        <div class="result-date">${formattedDate}</div>
                    </div>
                    <div class="result-upi-badge">
                        <img src="upi.png" alt="Powered by UPI" class="result-upi-logo">
                    </div>
                    <div class="result-bottom-bar">
                        <button class="result-share-btn ripple" id="btn-result-share">
                            <span class="material-symbols-rounded" style="font-size: 18px;">share</span>
                            Share screenshot
                        </button>
                        <button class="result-done-btn ripple" id="btn-result-done">Done</button>
                    </div>
                `;

                // Fire Supabase saves in BACKGROUND — don't block UI
                (async () => {
                    try {
                        await SupabaseDB.saveTransaction({
                            id: Date.now(),
                            type: 'sent',
                            name: payee.name,
                            initials: payee.initials,
                            color: payee.color || '#4285F4',
                            amount: amount,
                            upiId: payee.upiId || '',
                            date: new Date().toISOString(),
                            note: noteVal,
                            status: 'completed'
                        });
                        await SupabaseDB.updateBalance(amount);
                        await SupabaseDB.saveContact({
                            id: Date.now(),
                            name: payee.name,
                            initials: payee.initials,
                            upiId: payee.upiId || '',
                            phone: '',
                            color: payee.color || '#9AA0A6'
                        });
                    } catch (dbErr) {
                        console.error('DB save error:', dbErr);
                    }
                })();

            } else {
                resultContent.innerHTML = `
                    <div class="result-main-content">
                        <div class="result-icon-circle failure">
                            <span class="material-symbols-rounded">close</span>
                        </div>
                        <div class="result-amount">${formattedAmount}</div>
                        <div class="result-payee-name">${payee.name}</div>
                        <div class="result-failure-msg">Payment failed. Please try again later.</div>
                    </div>
                    <div class="result-bottom-bar">
                        <button class="result-share-btn ripple" id="btn-result-done">Done</button>
                        <button class="result-done-btn ripple" id="btn-result-retry">Retry</button>
                    </div>
                `;
            }

            // Attach event listeners IMMEDIATELY (not blocked by Supabase)
            const doneBtn = document.getElementById('btn-result-done');
            const retryBtn = document.getElementById('btn-result-retry');

            if (doneBtn) {
                doneBtn.addEventListener('click', () => {
                    resultScreen.style.opacity = '0';
                    resultScreen.style.transition = 'opacity 300ms ease';
                    setTimeout(() => {
                        resultScreen.style.display = 'none';
                        resultScreen.classList.add('hidden');
                        resultScreen.style.opacity = '';
                        resultScreen.style.transition = '';
                        showScreen('home');
                        renderHome();
                        renderHistory();
                    }, 300);
                });
            }

            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    resultScreen.style.opacity = '0';
                    resultScreen.style.transition = 'opacity 300ms ease';
                    setTimeout(() => {
                        resultScreen.style.display = 'none';
                        resultScreen.classList.add('hidden');
                        resultScreen.style.opacity = '';
                        resultScreen.style.transition = '';
                        startPayment(payee);
                    }, 300);
                });
            }

            initRipples();
        }, 600);
    }

    // ---------- Boot ----------
    document.addEventListener('DOMContentLoaded', init);

})();
