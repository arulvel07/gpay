// ============================================================
// Google Pay Replica — Mock Data
// ============================================================

const APP_DATA = {
    user: {
        name: "Mohit Kumr",
        phone: "+91 98765 43210",
        email: "mohit.kumar@gmail.com",
        upiId: "mohit@okaxis",
        avatar: null,
        initials: "MK",
        bank: {
            name: "Axis Bank",
            account: "XXXX XXXX 4521",
            ifsc: "UTIB0001234",
            balance: 4532.00
        }
    },

    contacts: [
        { id: 1, name: "THE ULTIMATE ENTERPR", initials: "T", upiId: "paytm.s21ifxp@pty", phone: "+91 99887 76655", color: "#5F6368" },
        { id: 2, name: "Ayyas Vishnu Varthan K", initials: "A", upiId: "6369120907@fam", phone: "+91 6369120907", color: "#9AA0A6" },
        { id: 3, name: "Rahul Verma", initials: "RV", upiId: "rahul@paytm", phone: "+91 87654 32109", color: "#FBBC04" },
        { id: 4, name: "Sneha Gupta", initials: "SG", upiId: "sneha@oksbi", phone: "+91 76543 21098", color: "#34A853" },
        { id: 5, name: "Vikram Singh", initials: "VS", upiId: "vikram@ybl", phone: "+91 65432 10987", color: "#8E24AA" },
        { id: 6, name: "Ananya Reddy", initials: "AR", upiId: "ananya@okaxis", phone: "+91 54321 09876", color: "#E91E63" },
        { id: 7, name: "Karan Mehta", initials: "KM", upiId: "karan@okicici", phone: "+91 43210 98765", color: "#00BCD4" },
        { id: 8, name: "Divya Nair", initials: "DN", upiId: "divya@oksbi", phone: "+91 32109 87654", color: "#FF5722" },
        { id: 9, name: "Arjun Das", initials: "AD", upiId: "arjun@ybl", phone: "+91 21098 76543", color: "#607D8B" },
        { id: 10, name: "Meera Iyer", initials: "MI", upiId: "meera@paytm", phone: "+91 10987 65432", color: "#795548" },
    ],

    transactions: [],

    businesses: [
        { id: 1, name: "Swiggy", initials: "SW", upiId: "swiggy@hdfcbank", color: "#FC8019", category: "Food" },
        { id: 2, name: "Zomato", initials: "ZO", upiId: "zomato@icici", color: "#CB202D", category: "Food" },
        { id: 3, name: "Amazon", initials: "AM", upiId: "amazon@apl", color: "#FF9900", category: "Shopping" },
        { id: 4, name: "Flipkart", initials: "FK", upiId: "flipkart@axisbank", color: "#2874F0", category: "Shopping" },
        { id: 5, name: "Uber", initials: "UB", upiId: "uber@hdfcbank", color: "#000000", category: "Travel" },
        { id: 6, name: "Ola", initials: "OL", upiId: "ola@icici", color: "#35B44A", category: "Travel" },
        { id: 7, name: "Jio Recharge", initials: "JR", upiId: "jio@sbi", color: "#0A1172", category: "Recharge" },
        { id: 8, name: "Airtel", initials: "AT", upiId: "airtel@icici", color: "#ED1C24", category: "Recharge" },
    ],

    offers: [
        { id: 1, title: "₹100 Cashback", desc: "On first UPI payment", color: "#1a73e8", icon: "redeem" },
        { id: 2, title: "Scratch Card", desc: "Pay ₹500+ to win", color: "#34A853", icon: "card_giftcard" },
        { id: 3, title: "Recharge Offer", desc: "5% off on mobile recharge", color: "#EA4335", icon: "phone_android" },
        { id: 4, title: "Bill Pay Reward", desc: "₹50 cashback on bills", color: "#FBBC04", icon: "receipt_long" },
    ],

    quickActions: [
        { id: "scan", label: "Scan any\nQR code", icon: "qr_code_scanner", color: "#1a73e8" },
        { id: "pay-phone", label: "Pay phone\nnumber", icon: "contact_phone", color: "#34A853" },
        { id: "pay-self", label: "Pay self\naccount", icon: "account_balance", color: "#EA4335" },
        { id: "pay-contacts", label: "Pay\ncontacts", icon: "people", color: "#FBBC04" },
    ],

    billCategories: [
        { id: "mobile", label: "Mobile\nrecharge", icon: "phone_android", color: "#4285F4" },
        { id: "dth", label: "DTH", icon: "tv", color: "#EA4335" },
        { id: "electricity", label: "Electricity", icon: "bolt", color: "#FBBC04" },
        { id: "postpaid", label: "Postpaid\nmobile", icon: "sim_card", color: "#34A853" },
        { id: "broadband", label: "Broadband", icon: "wifi", color: "#8E24AA" },
    ]
};

// Helper functions
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Yesterday, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
        return date.toLocaleDateString('en-IN', { weekday: 'long' }) + ', ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}

function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ============================================================
// Supabase Database Functions
// ============================================================

const SupabaseDB = {

    // Fetch all transactions from Supabase, newest first
    async fetchTransactions() {
        if (!isSupabaseConfigured()) {
            console.log('Supabase not configured, using local transactions');
            return APP_DATA.transactions;
        }

        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped = (data || []).map(row => ({
                id: row.id,
                type: row.type,
                name: row.name,
                initials: row.initials,
                color: row.color || '#4285F4',
                amount: row.amount,
                upiId: row.upi_id,
                date: row.created_at,
                note: row.note || '',
                status: row.status || 'completed'
            }));

            if (mapped.length > 0) {
                APP_DATA.transactions = mapped;
            }
            console.log('✅ Fetched', mapped.length, 'transactions from Supabase');
            return APP_DATA.transactions;
        } catch (err) {
            console.error('❌ Supabase fetchTransactions error:', err);
            return APP_DATA.transactions;
        }
    },

    // Fetch balance from Supabase
    async fetchBalance() {
        if (!isSupabaseConfigured()) {
            console.log('Supabase not configured, using local balance');
            return APP_DATA.user.bank.balance;
        }

        try {
            const { data, error } = await supabaseClient
                .from('user_balance')
                .select('balance')
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                // Table is empty, insert initial row
                console.log('No balance row found, inserting initial balance');
                await supabaseClient.from('user_balance').insert({ balance: APP_DATA.user.bank.balance });
                return APP_DATA.user.bank.balance;
            }

            APP_DATA.user.bank.balance = data.balance;
            console.log('✅ Fetched balance from Supabase:', data.balance);
            return data.balance;
        } catch (err) {
            console.error('❌ Supabase fetchBalance error:', err);
            return APP_DATA.user.bank.balance;
        }
    },

    // Save a new transaction to Supabase
    async saveTransaction(txn) {
        // Always add to local data first
        APP_DATA.transactions.unshift(txn);

        if (!isSupabaseConfigured()) return txn;

        try {
            const { error } = await supabaseClient
                .from('transactions')
                .insert({
                    type: txn.type,
                    name: txn.name,
                    initials: txn.initials,
                    color: txn.color,
                    amount: txn.amount,
                    upi_id: txn.upiId || '',
                    note: txn.note || '',
                    status: txn.status || 'completed'
                });

            if (error) throw error;
            console.log('✅ Transaction saved to Supabase');
            return txn;
        } catch (err) {
            console.error('❌ Supabase saveTransaction error:', err);
            return txn;
        }
    },

    // Deduct amount from balance in Supabase
    async updateBalance(amountToDeduct) {
        const newBalance = APP_DATA.user.bank.balance - amountToDeduct;
        APP_DATA.user.bank.balance = newBalance;

        if (!isSupabaseConfigured()) return newBalance;

        try {
            const { data: rows, error: fetchErr } = await supabaseClient
                .from('user_balance')
                .select('id')
                .limit(1)
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            if (rows) {
                const { error } = await supabaseClient
                    .from('user_balance')
                    .update({ balance: newBalance, updated_at: new Date().toISOString() })
                    .eq('id', rows.id);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient
                    .from('user_balance')
                    .insert({ balance: newBalance });
                if (error) throw error;
            }

            console.log('✅ Balance updated in Supabase:', newBalance);
            return newBalance;
        } catch (err) {
            console.error('❌ Supabase updateBalance error:', err);
            return newBalance;
        }
    },

    // Fetch contacts from Supabase and merge with local
    async fetchContacts() {
        if (!isSupabaseConfigured()) return APP_DATA.contacts;

        try {
            const { data, error } = await supabaseClient
                .from('contacts')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            const dbContacts = (data || []).map(row => ({
                id: row.id,
                name: row.name,
                initials: row.initials,
                upiId: row.upi_id,
                phone: row.phone || '',
                color: row.color || '#9AA0A6'
            }));

            // Merge: add DB contacts that aren't already in local list (by upiId)
            const localUpiIds = new Set(APP_DATA.contacts.map(c => c.upiId));
            dbContacts.forEach(c => {
                if (!localUpiIds.has(c.upiId)) {
                    APP_DATA.contacts.push(c);
                }
            });

            console.log('✅ Fetched', dbContacts.length, 'contacts from Supabase');
            return APP_DATA.contacts;
        } catch (err) {
            console.error('❌ Supabase fetchContacts error:', err);
            return APP_DATA.contacts;
        }
    },

    // Save a new contact to Supabase (skip if already exists)
    async saveContact(contact) {
        // Check if already in local contacts
        const exists = APP_DATA.contacts.some(c => c.upiId === contact.upiId);
        if (!exists) {
            APP_DATA.contacts.push(contact);
        }

        if (!isSupabaseConfigured()) return contact;

        try {
            // Check if contact already exists in DB by upi_id
            const { data: existing } = await supabaseClient
                .from('contacts')
                .select('id')
                .eq('upi_id', contact.upiId)
                .maybeSingle();

            if (existing) {
                console.log('Contact already exists in Supabase:', contact.upiId);
                return contact;
            }

            const { error } = await supabaseClient
                .from('contacts')
                .insert({
                    name: contact.name,
                    initials: contact.initials,
                    upi_id: contact.upiId,
                    phone: contact.phone || '',
                    color: contact.color || '#9AA0A6'
                });

            if (error) throw error;
            console.log('✅ Contact saved to Supabase:', contact.name);
            return contact;
        } catch (err) {
            console.error('❌ Supabase saveContact error:', err);
            return contact;
        }
    }
};
