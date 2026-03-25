// ============================================================
// Google Pay Replica — Animations & Visual Effects
// ============================================================

// Ripple effect on click/tap
function createRipple(event) {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

// Apply ripple to all elements with .ripple class
function initRipples() {
    document.querySelectorAll('.ripple').forEach(el => {
        el.addEventListener('click', createRipple);
    });
}

// Page transition
function slideIn(element, direction = 'right') {
    element.style.display = '';
    element.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');

    requestAnimationFrame(() => {
        element.classList.add(`slide-in-${direction}`);
        element.addEventListener('animationend', () => {
            element.classList.remove(`slide-in-${direction}`);
        }, { once: true });
    });
}

function slideOut(element, direction = 'left') {
    element.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');

    requestAnimationFrame(() => {
        element.classList.add(`slide-out-${direction}`);
        element.addEventListener('animationend', () => {
            element.style.display = 'none';
            element.classList.remove(`slide-out-${direction}`);
        }, { once: true });
    });
}

// Bottom sheet animation
function openBottomSheet(sheetId) {
    const sheet = document.getElementById(sheetId);
    const overlay = sheet.querySelector('.sheet-overlay');
    const content = sheet.querySelector('.sheet-content');

    sheet.style.display = 'flex';
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        content.classList.add('active');
    });
}

function closeBottomSheet(sheetId) {
    const sheet = document.getElementById(sheetId);
    const overlay = sheet.querySelector('.sheet-overlay');
    const content = sheet.querySelector('.sheet-content');

    overlay.classList.remove('active');
    content.classList.remove('active');
    setTimeout(() => {
        sheet.style.display = 'none';
    }, 300);
}

// Success checkmark animation
function showSuccessAnimation(container) {
    container.innerHTML = `
        <div class="success-animation">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <div class="success-text">Payment Successful!</div>
        </div>
    `;
}

// Failure animation
function showFailureAnimation(container) {
    container.innerHTML = `
        <div class="failure-animation">
            <svg class="crossmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="crossmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="crossmark-x" fill="none" d="M16 16 36 36 M36 16 16 36"/>
            </svg>
            <div class="failure-text">Payment Failed</div>
        </div>
    `;
}

// Pulse animation for scan button
function addPulse(element) {
    element.classList.add('pulse');
}

function removePulse(element) {
    element.classList.remove('pulse');
}

// Staggered list animation
function animateListItems(container, selector = '.list-item') {
    const items = container.querySelectorAll(selector);
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 60);
    });
}

// Number counter animation
function animateNumber(element, target, duration = 1000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * eased);
        element.textContent = formatCurrency(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatCurrency(target);
        }
    }

    requestAnimationFrame(update);
}

// Shake animation for errors
function shake(element) {
    element.classList.add('shake');
    element.addEventListener('animationend', () => {
        element.classList.remove('shake');
    }, { once: true });
}

// Fade in
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = '';
    element.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
}

// Fade out
function fadeOut(element, duration = 300) {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
}
