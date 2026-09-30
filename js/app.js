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
    let isProcessingPayment = false;

    // ---------- DOM Helpers ----------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function showPaymentError(message) {
        hidePaymentError();
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message-pill';
        errorEl.id = 'payment-error';
        errorEl.innerHTML = `
            <span class="material-symbols-rounded">error</span>
            <span>${message}</span>
        `;
        const payeeSection = $('.pay-payee-section');
        if (payeeSection) payeeSection.after(errorEl);
        setTimeout(() => hidePaymentError(), 4000);
    }

    function hidePaymentError() {
        const existing = $('#payment-error');
        if (existing) existing.remove();
    }

    // ---------- Initialize App ----------
    function init() {
        // Immediate initial render using local state
        try {
            renderHome();
            renderHistory();
            renderOffers();
            setupNavigation();
            setupPaymentFlow();
            setupPinPad();
            setupSearch();
            setupBalanceCard();
            renderUserProfile();
        } catch (err) {
            console.error('Render error:', err);
        }

        // Fast splash screen fade-out
        setTimeout(() => {
            const splash = $('#splash-screen');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.style.display = 'none';
                    showScreen('home');
                }, 400);
            }
        }, 1000);

        // Apply ripple effects
        initRipples();

        // History API setup
        if (!window.location.hash) {
            history.replaceState(null, '', '#home');
        }
        window.addEventListener('popstate', handlePopState);

        // Background Supabase sync without blocking UI
        (async () => {
            try {
                await SupabaseDB.fetchTransactions();
                await SupabaseDB.fetchBalance();
                await SupabaseDB.fetchContacts();
                // Re-render data-dependent components once data is loaded
                renderHome();
                renderHistory();
                renderUserProfile();
            } catch (err) {
                console.error('Supabase background sync error:', err);
            }
        })();
    }

    // ---------- History State ----------
    let isHistoryNavigating = false;

    function pushHistory(hash) {
        if (!isHistoryNavigating) {
            history.pushState(null, '', '#' + hash);
        }
    }

    function popHistory() {
        if (window.location.hash.startsWith('#overlay-')) {
            if (!isHistoryNavigating) {
                isHistoryNavigating = true;
                history.back();
                setTimeout(() => { isHistoryNavigating = false; }, 150);
            }
        } else {
            history.replaceState(null, '', '#' + currentScreen);
        }
    }

    function handlePopState(e) {
        if (isHistoryNavigating) return;

        isHistoryNavigating = true;
        const hash = window.location.hash.replace('#', '');

        const result = $('#screen-result');

        if (result && !result.classList.contains('hidden')) {
            result.style.opacity = '0';
            setTimeout(() => {
                result.style.display = 'none';
                result.classList.add('hidden');
                result.style.opacity = '';
                showScreen('home');
            }, 300);
        } else if (overlayStack.length > 0) {
            const topOverlay = overlayStack[overlayStack.length - 1];
            if (topOverlay === 'scanner' && typeof stopScanning === 'function') {
                stopScanning();
            }
            closeOverlayDirectly(topOverlay);
        } else {
            const target = ['home', 'money', 'profile'].includes(hash) ? hash : 'home';
            showScreen(target);
        }

        setTimeout(() => { isHistoryNavigating = false; }, 150);
    }

    // ---------- Navigation ----------
    let activePinIntent = 'payment'; // 'payment' or 'check-balance'

    function triggerBankBalancePin() {
        activePinIntent = 'check-balance';
        payAmount = '0';
        currentPayee = { name: APP_DATA.user.bank.name, upiId: APP_DATA.user.bank.account };
        showPinScreen();
    }

    function setupNavigation() {
        $$('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.dataset.screen;
                if (!screen) return;
                showScreen(screen);
            });
        });

        // Floating QR Scanner button
        const floatingQr = $('#btn-floating-qr');
        if (floatingQr) {
            floatingQr.addEventListener('click', () => {
                openScanner();
            });
        }

        // Scanner back
        $('#btn-scanner-back').addEventListener('click', () => {
            closeScanner();
        });

        // Profile from home avatar
        const btnProfileHome = $('#btn-profile-home');
        if (btnProfileHome) {
            btnProfileHome.addEventListener('click', () => {
                showScreen('profile');
            });
        }

        // View all transactions (from main page, money page, or bank balance page)
        const openAllTransactions = () => {
            renderHistory('all');
            showOverlay('history');
        };

        const btnViewAllTxs = $('#btn-view-all-transactions');
        if (btnViewAllTxs) btnViewAllTxs.addEventListener('click', openAllTransactions);

        const btnBalPageSeeAll = $('#btn-bal-page-see-all');
        if (btnBalPageSeeAll) btnBalPageSeeAll.addEventListener('click', openAllTransactions);

        const btnMoneySeeAll = $('#btn-money-see-all');
        if (btnMoneySeeAll) btnMoneySeeAll.addEventListener('click', openAllTransactions);

        // History Back button
        const btnHistoryBack = $('#btn-history-back');
        if (btnHistoryBack) {
            btnHistoryBack.addEventListener('click', () => {
                hideOverlay('history');
            });
        }

        const btnCheckBalHome = $('#btn-check-balance');
        if (btnCheckBalHome) btnCheckBalHome.addEventListener('click', triggerBankBalancePin);

        const btnMoneyCheckBal = $('#btn-money-check-bal');
        if (btnMoneyCheckBal) btnMoneyCheckBal.addEventListener('click', triggerBankBalancePin);

        // Bank Balance Screen Back & Actions
        const btnBankBalBack = $('#btn-bank-bal-back');
        if (btnBankBalBack) {
            btnBankBalBack.addEventListener('click', () => {
                hideOverlay('bank-balance');
            });
        }

        // Offers screen
        const openOffers = () => showOverlay('offers');
        const btnRewards = $('#btn-rewards');
        const btnOffers = $('#btn-offers');
        const btnReferrals = $('#btn-referrals');
        if (btnRewards) btnRewards.addEventListener('click', openOffers);
        if (btnOffers) btnOffers.addEventListener('click', openOffers);
        if (btnReferrals) btnReferrals.addEventListener('click', openOffers);

        const btnOffersBack = $('#btn-offers-back');
        if (btnOffersBack) btnOffersBack.addEventListener('click', () => hideOverlay('offers'));

        // CIBIL handlers
        const onCibilClick = () => {
            alert('Your CIBIL Score is 785 (Excellent)\nUpdated today. Your credit profile is in great health!');
        };
        const btnCibilBanner = $('#cibil-banner');
        if (btnCibilBanner) btnCibilBanner.addEventListener('click', onCibilClick);
        const btnCibilLink = $('#btn-cibil');
        if (btnCibilLink) btnCibilLink.addEventListener('click', onCibilClick);
        const btnMoneyCibil = $('#btn-money-cibil');
        if (btnMoneyCibil) btnMoneyCibil.addEventListener('click', onCibilClick);

        // Manage Bills & Explore Businesses
        const btnViewBills = $('#btn-view-bills');
        if (btnViewBills) {
            btnViewBills.addEventListener('click', () => {
                const billsGrid = $('#bills-grid');
                if (billsGrid) billsGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        const btnViewBiz = $('#btn-view-biz');
        if (btnViewBiz) {
            btnViewBiz.addEventListener('click', () => {
                isBizExpanded = !isBizExpanded;
                renderBusinessesGrid();
            });
        }
    }

    function renderMoneyTab() {
        const bankName = APP_DATA.user.bank.name;
        const bankLast4 = APP_DATA.user.bank.account.slice(-4);
        const moneyBankName = $('#money-bank-name');
        if (moneyBankName) moneyBankName.textContent = bankName + ' ••••' + bankLast4;

        renderTransactionList('#money-transactions', APP_DATA.transactions.slice(0, 5), false);
    }

    function showScreen(name) {
        if (name !== currentScreen) pushHistory(name);

        const tabScreens = ['home', 'money', 'profile'];
        tabScreens.forEach(s => {
            const el = $(`#screen-${s}`);
            if (!el) return;
            if (s === name) {
                el.classList.remove('hidden');
                el.classList.add('active');
            } else {
                el.classList.add('hidden');
                el.classList.remove('active');
            }
        });
        currentScreen = name;

        if (name === 'money') {
            renderMoneyTab();
        }

        // Show bottom nav for tab screens
        const bottomNav = $('#bottom-nav');
        if (bottomNav) bottomNav.style.display = 'flex';

        // Highlight active nav item
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = $(`.nav-item[data-screen="${name}"]`);
        if (activeNav) activeNav.classList.add('active');
    }

    let overlayStack = [];

    function showOverlay(name) {
        pushHistory('overlay-' + name);
        const el = $(`#screen-${name}`);
        if (!el) return;

        // Remove name if already in stack, then push to top
        overlayStack = overlayStack.filter(item => item !== name);
        overlayStack.push(name);

        // Dynamically assign higher z-index so top overlay is ALWAYS visible on top!
        const baseZ = 60 + overlayStack.length * 10;
        el.style.zIndex = baseZ;
        el.style.display = 'flex';

        el.classList.remove('hidden');
        slideIn(el, 'right');

        // Hide bottom nav during overlays
        const bottomNav = $('#bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';
    }

    function closeOverlayDirectly(name) {
        const el = $(`#screen-${name}`);
        if (!el) return;

        slideOut(el, 'right');
        setTimeout(() => {
            el.classList.add('hidden');
            el.style.display = 'none';
            el.style.zIndex = '';
        }, 350);

        overlayStack = overlayStack.filter(item => item !== name);

        // Show bottom nav again ONLY if no active overlays remain
        if (overlayStack.length === 0) {
            const bottomNav = $('#bottom-nav');
            if (bottomNav) bottomNav.style.display = 'flex';
        }
    }

    function hideOverlay(name) {
        popHistory();
        closeOverlayDirectly(name);
    }

    // ---------- Home Screen ----------
    let isPeopleExpanded = false;
    let isBizExpanded = false;

    function renderHome() {
        // Quick Actions
        const grid = $('#quick-actions-grid');
        if (grid) {
            grid.innerHTML = APP_DATA.quickActions.map(action => `
                <div class="quick-action-item ripple" data-action="${action.id}">
                    <div class="quick-action-icon">
                        <span class="material-symbols-rounded">${action.icon}</span>
                    </div>
                    <span class="quick-action-label">${action.label.replace('\n', '<br>')}</span>
                </div>
            `).join('');

            grid.querySelectorAll('.quick-action-item').forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.dataset.action;
                    if (action === 'scan') {
                        openScanner();
                    } else if (action === 'pay-phone' || action === 'pay-contacts') {
                        startPayment(APP_DATA.contacts[0]);
                    } else if (action === 'pay-self') {
                        startPayment({
                            name: APP_DATA.user.name,
                            initials: APP_DATA.user.initials,
                            upiId: APP_DATA.user.upiId,
                            color: '#0B57D0'
                        });
                    }
                });
            });
        }

        // People Section
        renderPeopleGrid();

        // Businesses Section
        renderBusinessesGrid();

        // Bills grid
        const billsGrid = $('#bills-grid');
        if (billsGrid) {
            billsGrid.innerHTML = APP_DATA.billCategories.map(bill => `
                <div class="bill-item ripple" data-bill-id="${bill.id}">
                    <div class="bill-icon" style="background: ${bill.color};">
                        <span class="material-symbols-rounded">${bill.icon}</span>
                    </div>
                    <span class="bill-label">${bill.label.replace('\n', '<br>')}</span>
                </div>
            `).join('');

            billsGrid.querySelectorAll('.bill-item').forEach(item => {
                item.addEventListener('click', () => {
                    const billId = item.dataset.billId;
                    const category = APP_DATA.billCategories.find(b => b.id === billId);
                    startPayment({
                        name: item.querySelector('.bill-label').innerText.replace('\n', ' '),
                        initials: 'GP',
                        upiId: `${billId || 'bill'}@upi`,
                        color: category ? category.color : '#0B57D0'
                    });
                });
            });
        }
    }

    function renderPeopleGrid() {
        const peopleContainer = $('#people-scroll');
        if (!peopleContainer) return;

        const maxVisible = isPeopleExpanded ? APP_DATA.contacts.length : 7;
        const visibleContacts = APP_DATA.contacts.slice(0, maxVisible);

        let html = visibleContacts.map(contact => `
            <div class="person-item ripple" data-upi-id="${contact.upiId}">
                <div class="person-avatar" style="background: ${contact.color};">${contact.initials}</div>
                <span class="person-name">${contact.name}</span>
            </div>
        `).join('');

        // Expand / Collapse button
        if (APP_DATA.contacts.length > 7) {
            html += `
                <div class="person-item ripple" id="btn-toggle-people">
                    <div class="person-avatar toggle-more-avatar">
                        <span class="material-symbols-rounded">${isPeopleExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                    </div>
                    <span class="person-name">${isPeopleExpanded ? 'Less' : 'More'}</span>
                </div>
            `;
        }

        peopleContainer.innerHTML = html;

        peopleContainer.querySelectorAll('.person-item[data-upi-id]').forEach(item => {
            item.addEventListener('click', () => {
                const upiId = item.dataset.upiId;
                const contact = APP_DATA.contacts.find(c => c.upiId === upiId);
                if (contact) startPayment(contact);
            });
        });

        const toggleBtn = $('#btn-toggle-people');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                isPeopleExpanded = !isPeopleExpanded;
                renderPeopleGrid();
            });
        }
    }

    function renderBusinessesGrid() {
        const bizContainer = $('#businesses-grid');
        if (!bizContainer) return;

        const maxVisible = isBizExpanded ? APP_DATA.businesses.length : 7;
        const visibleBiz = APP_DATA.businesses.slice(0, maxVisible);

        let html = visibleBiz.map(biz => `
            <div class="person-item ripple" data-biz-id="${biz.id}">
                <div class="person-avatar" style="background: ${biz.color};">${biz.initials}</div>
                <span class="person-name">${biz.name}</span>
            </div>
        `).join('');

        if (APP_DATA.businesses.length > 7) {
            html += `
                <div class="person-item ripple" id="btn-toggle-biz">
                    <div class="person-avatar toggle-more-avatar">
                        <span class="material-symbols-rounded">${isBizExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                    </div>
                    <span class="person-name">${isBizExpanded ? 'Less' : 'More'}</span>
                </div>
            `;
        }

        bizContainer.innerHTML = html;

        bizContainer.querySelectorAll('.person-item[data-biz-id]').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.bizId, 10);
                const biz = APP_DATA.businesses.find(b => b.id === id);
                if (biz) startPayment(biz);
            });
        });

        const toggleBizBtn = $('#btn-toggle-biz');
        if (toggleBizBtn) {
            toggleBizBtn.addEventListener('click', () => {
                isBizExpanded = !isBizExpanded;
                renderBusinessesGrid();
            });
        }
    }

    function renderTransactionList(selector, transactions, groupByMonth = false) {
        const container = $(selector);

        let html = '';
        let currentMonthGroup = '';

        // Pre-compute monthly totals for groupByMonth
        const monthlyTotals = {};
        if (groupByMonth) {
            transactions.forEach(tx => {
                const dateObj = new Date(tx.date);
                const monthYear = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                if (!monthlyTotals[monthYear]) monthlyTotals[monthYear] = 0;
                if (tx.status !== 'failed') {
                    if (tx.type === 'sent') {
                        monthlyTotals[monthYear] -= tx.amount;
                    } else {
                        monthlyTotals[monthYear] += tx.amount;
                    }
                }
            });
        }

        transactions.forEach(tx => {
            const isFailed = tx.status === 'failed';

            if (groupByMonth) {
                const dateObj = new Date(tx.date);
                const monthYear = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

                if (monthYear !== currentMonthGroup) {
                    currentMonthGroup = monthYear;
                    const parts = monthYear.split(' ');
                    const total = monthlyTotals[monthYear] || 0;
                    const totalColor = total >= 0 ? '#81c995' : '#e8eaed';
                    const totalSign = total > 0 ? '+ ' : (total < 0 ? '- ' : '');
                    const totalDisplay = totalSign + '₹' + Math.abs(total).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                    html += `
                        <div class="month-header" style="background: transparent; padding: 20px 20px 8px; margin-top: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                                <div>
                                    <div style="font-size: 12px; font-weight: 400; color: #9aa0a6; margin-bottom: 2px;">${parts[1]}</div>
                                    <div style="font-size: 22px; font-weight: 500; color: #e8eaed; letter-spacing: -0.2px;">${parts[0]}</div>
                                </div>
                                <div style="font-size: 16px; font-weight: 500; color: ${totalColor};">${totalDisplay}</div>
                            </div>
                        </div>
                    `;
                }
            }

            const dateObj = new Date(tx.date);
            const txDateStr = groupByMonth 
                ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) 
                : formatDate(tx.date);

            const amountClass = tx.type === 'sent' ? 'sent' : 'received';
            const amountPrefix = (tx.type === 'sent' || isFailed) ? '' : '+ ';
            const amountFormatted = amountPrefix + formatCurrency(tx.amount);

            html += `
            <div class="transaction-item ripple list-item" data-tx-id="${tx.id}">
                <div class="transaction-avatar" style="background: ${tx.color};">${tx.initials}</div>
                <div class="transaction-details">
                    <div class="transaction-name" ${isFailed ? 'style="color: #f28b82;"' : ''}>${tx.name}</div>
                    <div class="transaction-date">
                        ${txDateStr}
                        ${isFailed ? '<span style="color: #f28b82; font-weight: 500; margin-left: 4px;">• Failed</span>' : ''}
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}" ${isFailed ? 'style="color: var(--text-secondary); text-decoration: line-through;"' : ''}>
                    ${amountFormatted}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;

        // Add click handlers for transaction detail
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', () => {
                const txId = item.dataset.txId;
                const tx = APP_DATA.transactions.find(t => String(t.id) === String(txId));
                if (tx) openTransactionDetail(tx);
            });
        });

        setTimeout(() => animateListItems(container, '.transaction-item'), 100);
    }

    // ---------- History Screen ----------
    function renderHistory(filter = 'all') {
        const searchInput = $('#history-search-input');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let transactions = APP_DATA.transactions;
        if (filter === 'sent') transactions = transactions.filter(tx => tx.type === 'sent');
        else if (filter === 'received') transactions = transactions.filter(tx => tx.type === 'received');
        else if (filter === 'rewards') transactions = transactions.filter(tx => tx.name === 'Cashback');

        if (query) {
            transactions = transactions.filter(tx => 
                tx.name.toLowerCase().includes(query) || (tx.upiId && tx.upiId.toLowerCase().includes(query))
            );
        }

        renderTransactionList('#history-transactions', transactions, true);

        $$('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
            chip.onclick = () => renderHistory(chip.dataset.filter);
        });

        if (searchInput && !searchInput.dataset.listening) {
            searchInput.dataset.listening = 'true';
            searchInput.addEventListener('input', () => {
                const activeChip = $('.filter-chip.active');
                const currentFilter = activeChip ? activeChip.dataset.filter : 'all';
                renderHistory(currentFilter);
            });
        }
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
        const profileBankCard = $('#bank-card');
        if (profileBankCard) {
            profileBankCard.addEventListener('click', () => {
                triggerBankBalancePin();
            });
        }
        const paySheetCheckLink = $('.pay-sheet-check-link');
        if (paySheetCheckLink) {
            paySheetCheckLink.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerBankBalancePin();
            });
        }
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

            hidePaymentError();

            // Flex input hug
            e.target.style.width = (Math.max(1, val.length) + 0.2) + 'ch';

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

        $('#btn-pay').addEventListener('click', async () => {
            const amount = parseFloat(payAmount);
            if (!payAmount || amount <= 0) return;

            if (amount > 1000) {
                showPaymentError('Maximum transaction limit is ₹1,000.');
                return;
            }

            const currentBalance = await SupabaseDB.fetchBalance();
            if (amount > currentBalance) {
                showPaymentError('Insufficient balance. Check your account balance.');
                return;
            }

            showPinScreen();
        });

        $('#btn-payment-back').addEventListener('click', () => {
            hideOverlay('payment');
        });

        // Color Dropdown Data
        const colorOptions = [
            { id: '#AA47BD', name: 'Deep Orchid' }, { id: '#7B1FA2', name: 'Royal Purple' },
            { id: '#77919D', name: 'Slate Gray' }, { id: '#455A65', name: 'Charcoal Blue' },
            { id: '#EC417A', name: 'Neon Pink' }, { id: '#C1175C', name: 'Crimson Rose' },
            { id: '#5D6AC0', name: 'Indigo Blue' }, { id: '#0388D2', name: 'Sky Blue' },
            { id: '#00579B', name: 'Navy' }, { id: '#0098A7', name: 'Teal Blue' },
            { id: '#00897B', name: 'Deep Teal' }, { id: '#004D40', name: 'Forest Green' },
            { id: '#68A039', name: 'Leaf Green' }, { id: '#34691E', name: 'Olive Green' },
            { id: '#8C6E63', name: 'Taupe Brown' }, { id: '#5D4138', name: 'Cocoa' },
            { id: '#7D57C1', name: 'Violet' }, { id: '#512DA7', name: 'Royal Indigo' },
            { id: '#EF6C00', name: 'Vivid Orange' }, { id: '#F6511E', name: 'Fiery Coral' },
            { id: '#BE360B', name: 'Brick Red' }
        ];

        const colorDropdown = $('#color-select-dropdown');
        const colorBtn = $('#color-select-btn');
        const colorPreview = $('#color-select-preview');
        const colorLabel = $('#color-select-label');
        const colorInput = $('#edit-payee-color');

        // Render custom options
        colorDropdown.innerHTML = colorOptions.map(c => `
            <div class="color-option ripple" data-value="${c.id}" data-name="${c.name}" style="padding: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background: ${c.id}; box-shadow: 0 0 2px rgba(255,255,255,0.2);"></div>
                <span style="color: #fff; font-size: 14px;">${c.name}</span>
            </div>
        `).join('');

        // Handle dropdown toggle
        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = colorDropdown.style.display === 'none';
            colorDropdown.style.display = isHidden ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            colorDropdown.style.display = 'none';
        });

        // Handle option click
        colorDropdown.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = opt.getAttribute('data-value');
                const name = opt.getAttribute('data-name');
                colorInput.value = val;
                colorPreview.style.background = val;
                colorLabel.textContent = name;
                colorDropdown.style.display = 'none';
            });
        });

        // Edit Payee feature
        $('#btn-edit-payee').addEventListener('click', () => {
            if (!currentPayee) return;

            // Clear values so placeholders show
            $('#edit-payee-name').value = '';
            $('#edit-payee-bank').value = '';
            $('#edit-payee-upi').value = '';
            $('#edit-payee-initials').value = '';

            // Set placeholders to current values
            $('#edit-payee-name').placeholder = currentPayee.name || 'Name';
            $('#edit-payee-bank').placeholder = $('#payee-banking-name').textContent || 'Banking Name';
            $('#edit-payee-upi').placeholder = currentPayee.upiId || 'UPI ID';
            $('#edit-payee-initials').placeholder = currentPayee.initials || 'IN';

            // Sync custom dropdown logic
            const targetColor = (currentPayee.color || '#AA47BD').toUpperCase();
            const matchedColor = colorOptions.find(c => c.id.toUpperCase() === targetColor) || colorOptions[0];
            colorInput.value = matchedColor.id;
            colorPreview.style.background = matchedColor.id;
            colorLabel.textContent = matchedColor.name;
            colorDropdown.style.display = 'none'; // reset just in case

            $('#modal-edit-payee').style.display = 'flex';
        });

        $('#btn-edit-payee-cancel').addEventListener('click', () => {
            $('#modal-edit-payee').style.display = 'none';
        });

        $('#btn-edit-payee-save').addEventListener('click', () => {
            if (!currentPayee) return;
            currentPayee.name = $('#edit-payee-name').value.trim() || currentPayee.name;
            currentPayee.upiId = $('#edit-payee-upi').value.trim() || currentPayee.upiId;
            currentPayee.initials = $('#edit-payee-initials').value.trim().toUpperCase() || currentPayee.initials;
            currentPayee.color = $('#edit-payee-color').value;

            const bankingName = $('#edit-payee-bank').value.trim() || $('#payee-banking-name').textContent;

            $('#payee-name').textContent = currentPayee.name;
            $('#payee-banking-name').textContent = bankingName;
            $('#payee-upi-display').textContent = currentPayee.upiId;
            $('#payee-initials').textContent = currentPayee.initials;
            $('#payee-avatar').style.background = currentPayee.color;

            $('#modal-edit-payee').style.display = 'none';
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
            if (isProcessingPayment) return;
            $('#btn-confirm-pin').disabled = true;
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

        if (activePinIntent === 'check-balance') {
            $('#pin-pay-amount').textContent = 'Check Balance';
            $('#pin-payee-name').textContent = APP_DATA.user.bank.name + ' ' + APP_DATA.user.bank.account;
            $('#pin-bank-name').textContent = APP_DATA.user.bank.name;
        } else {
            const amount = parseFloat(payAmount);
            $('#pin-pay-amount').textContent = '₹' + amount.toFixed(2);
            $('#pin-payee-name').textContent = currentPayee ? currentPayee.name : 'Payee';
            $('#pin-bank-name').textContent = APP_DATA.user.bank.name;
        }

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

    // ---------- Process Payment / Check Balance ----------
    async function processPayment() {
        if (isProcessingPayment) return;
        isProcessingPayment = true;

        if (activePinIntent === 'check-balance') {
            const currentBal = await SupabaseDB.fetchBalance();
            closeOverlayDirectly('pin');
            isProcessingPayment = false;
            activePinIntent = 'payment';

            const formatted = formatCurrency(currentBal);
            const balAmtEl = $('#bal-page-amount');
            if (balAmtEl) balAmtEl.textContent = formatted;
            const balNameEl = $('#bal-page-bank-name');
            if (balNameEl) balNameEl.textContent = APP_DATA.user.bank.name + ' ••••' + APP_DATA.user.bank.account.slice(-4);
            const balTypeEl = $('#bal-page-bank-type');
            if (balTypeEl) balTypeEl.textContent = 'Savings account';

            // Render recent transactions preview under balance card matching real GPay
            const txContainer = $('#bal-page-transactions');
            if (txContainer) {
                renderTransactionList('#bal-page-transactions', APP_DATA.transactions.slice(0, 5), false);
            }

            // Cleanly replace history hash with #overlay-bank-balance
            history.replaceState(null, '', '#overlay-bank-balance');
            overlayStack = overlayStack.filter(item => item !== 'pin' && item !== 'bank-balance');
            overlayStack.push('bank-balance');

            const balEl = $('#screen-bank-balance');
            if (balEl) {
                balEl.style.zIndex = 70;
                balEl.style.display = 'flex';
                balEl.classList.remove('hidden');
                slideIn(balEl, 'right');
            }

            const bottomNav = $('#bottom-nav');
            if (bottomNav) bottomNav.style.display = 'none';

            return;
        }

        // Capture everything BEFORE any resets
        const amount = parseFloat(payAmount);
        const enteredPin = pinValue;
        const payee = currentPayee;
        const noteVal = $('#note-input').value || '';

        const currentBalance = await SupabaseDB.fetchBalance();
        const isSuccess = (enteredPin === '111927') && (amount <= currentBalance) && (amount <= 1000);

        const resultScreen = $('#screen-result');
        const resultContent = $('#result-content');

        // Reset immediately
        pinValue = '';
        payAmount = '';

        // Close pin and payment overlays directly without history desync
        closeOverlayDirectly('pin');
        closeOverlayDirectly('payment');
        history.replaceState(null, '', '#result');

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
                    <div class="result-upi-badge" style="margin-bottom: 24px;">
                        <img src="upi.jpg" alt="UPI" class="result-upi-logo" style="height: 32px; opacity: 1;">
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
                    } finally {
                        isProcessingPayment = false;
                    }
                })();

            } else {
                isProcessingPayment = false;
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
                        history.replaceState(null, '', '#home');
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

    // ---------- User Profile ----------
    function renderUserProfile() {
        if (!APP_DATA.user) return;

        const user = APP_DATA.user;

        // Home Screen
        const homeAvatar = $('#btn-profile-home');
        if (homeAvatar) homeAvatar.textContent = user.initials;

        // Profile Screen
        const profileAvatar = $('#profile-avatar');
        const profileName = $('#profile-name');
        const profilePhone = $('#profile-phone');
        const profileUpi = $('#profile-upi');

        if (profileAvatar) profileAvatar.textContent = user.initials;
        if (profileName) profileName.textContent = user.name;
        if (profilePhone) profilePhone.textContent = user.phone;
        if (profileUpi) profileUpi.textContent = user.upiId;

        // Bank Card in Profile
        const bankCardName = $('#bank-card-name');
        const bankCardAccount = $('#bank-card-account');
        if (bankCardName) bankCardName.textContent = user.bank.name;
        if (bankCardAccount) bankCardAccount.textContent = user.bank.account;
    }

    // ---------- Transaction Detail ----------
    function generateUpiTxnId() {
        let id = '';
        for (let i = 0; i < 14; i++) id += Math.floor(Math.random() * 10);
        return id;
    }

    function generateGoogleTxnId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 12; i++) {
            if (i > 0 && Math.random() < 0.15) {
                id += '_';
            } else {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        return id;
    }

    function openTransactionDetail(tx) {
        const isFailed = tx.status === 'failed';

        const avatar = $('#txd-avatar');
        avatar.style.background = tx.color || '#EF6C00';
        $('#txd-initials').textContent = tx.initials || '?';
        $('#txd-name').textContent = tx.name;
        $('#txd-amount').textContent = '₹' + tx.amount;

        // Status: tick+Completed or cross+Failed
        const statusIcon = $('#txd-status-icon');
        const statusText = $('#txd-status-text');
        if (isFailed) {
            // Replace img with a cross icon span
            statusIcon.style.display = 'none';
            const existingCross = document.getElementById('txd-cross-icon');
            if (existingCross) existingCross.remove();
            const crossEl = document.createElement('span');
            crossEl.className = 'material-symbols-rounded';
            crossEl.id = 'txd-cross-icon';
            crossEl.style.cssText = 'font-size: 20px; color: #f28b82;';
            crossEl.textContent = 'cancel';
            statusIcon.parentElement.insertBefore(crossEl, statusIcon);
            statusText.textContent = 'Failed';
            statusText.style.color = '#f28b82';
            // Make name red
            $('#txd-name').style.color = '#f28b82';
            // Make amount red
            $('#txd-amount').style.color = '#f28b82';
        } else {
            statusIcon.style.display = '';
            const existingCross = document.getElementById('txd-cross-icon');
            if (existingCross) existingCross.remove();
            statusText.textContent = 'Completed';
            statusText.style.color = '#34A853';
            $('#txd-name').style.color = '';
            $('#txd-amount').style.color = '';
        }

        // Date/time
        const dateObj = new Date(tx.date);
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            + ', ' + dateObj.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
        $('#txd-datetime').textContent = dateStr;

        // Bank info
        const bankName = APP_DATA.user.bank.name;
        const bankLast4 = APP_DATA.user.bank.account.slice(-4);
        $('#txd-bank-name').textContent = bankName + ' ••' + bankLast4;

        // UPI transaction ID (14 digits)
        $('#txd-upi-txn-id').textContent = generateUpiTxnId();

        // To section
        $('#txd-to-name2').textContent = tx.name;
        $('#txd-to-upi').textContent = tx.upiId || '';

        // From section
        $('#txd-from-name').textContent = APP_DATA.user.name.toUpperCase();
        $('#txd-from-bank').textContent = bankName;
        $('#txd-from-upi').textContent = 'Google Pay · ' + APP_DATA.user.upiId;

        // Google transaction ID (12 alphanumeric with _)
        $('#txd-google-txn-id').textContent = generateGoogleTxnId();

        showOverlay('transaction-detail');
        initRipples();
    }

    // Back button for transaction detail
    function setupTransactionDetail() {
        $('#btn-txd-back').addEventListener('click', () => {
            hideOverlay('transaction-detail');
        });
    }

    // ---------- Boot ----------
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupTransactionDetail();
    });

})();
