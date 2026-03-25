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
        { id: 1, name: "THE ULTIMATE ENTERPR", initials: "T", upiId: "paytm.s21ifxp@pty", phone: "+91 99887 76655", color: "#9AA0A6" },
        { id: 2, name: "Priya Patel", initials: "PP", upiId: "priya@okicici", phone: "+91 98776 54321", color: "#EA4335" },
        { id: 3, name: "Rahul Verma", initials: "RV", upiId: "rahul@paytm", phone: "+91 87654 32109", color: "#FBBC04" },
        { id: 4, name: "Sneha Gupta", initials: "SG", upiId: "sneha@oksbi", phone: "+91 76543 21098", color: "#34A853" },
        { id: 5, name: "Vikram Singh", initials: "VS", upiId: "vikram@ybl", phone: "+91 65432 10987", color: "#8E24AA" },
        { id: 6, name: "Ananya Reddy", initials: "AR", upiId: "ananya@okaxis", phone: "+91 54321 09876", color: "#E91E63" },
        { id: 7, name: "Karan Mehta", initials: "KM", upiId: "karan@okicici", phone: "+91 43210 98765", color: "#00BCD4" },
        { id: 8, name: "Divya Nair", initials: "DN", upiId: "divya@oksbi", phone: "+91 32109 87654", color: "#FF5722" },
        { id: 9, name: "Arjun Das", initials: "AD", upiId: "arjun@ybl", phone: "+91 21098 76543", color: "#607D8B" },
        { id: 10, name: "Meera Iyer", initials: "MI", upiId: "meera@paytm", phone: "+91 10987 65432", color: "#795548" },
    ],

    transactions: [

    ],

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
