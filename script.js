// Schedule Data
const timeSlots = [
    { start: "07:00", end: "07:40" },
    { start: "07:40", end: "08:20" },
    { start: "08:20", end: "09:00" },
    { start: "09:00", end: "09:40" },
    // Istirahat 09:40 - 10:00
    { start: "10:00", end: "10:40" },
    { start: "10:40", end: "11:20" },
    { start: "11:20", end: "12:00" },
    { start: "12:00", end: "12:40" },
];

const schedule = {
    // 6 = Saturday, 0 = Sunday, 1 = Monday, ...
    6: ["Upacara", "Shorof", "KMD", "PJOK", "PJOK", "Faroidh", "Fisika", "BK"],
    0: ["Fiqh", "Fiqh", "Qurhad", "Qurhad", "Tahfidz", "Tahfidz", "Biologi", "Biologi"],
    1: ["Kimia", "Kimia", "MTK", "MTK", "B.indo", "B.indo", "B.ing", "B.ing"],
    2: ["Tahfidz", "Tahfidz", "SBD", "PKWU", "TIK", "TIK", "Nahwu", "Fisika"],
    3: ["Aqidah", "Aqidah", "PPKN", "PPKN", "Tahfidz", "Tahfidz", "MTK TL", "MTK TL"],
    4: ["B.arab", "B.arab", "Sejarah", "Sejarah", "TIK", "TIK", "SKI", "SKI"],
    5: [] // Friday Libur
};

const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];


// Application Logic
function getFormattedTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function getFormattedDate() {
    const now = new Date();
    const day = dayNames[now.getDay()];
    const date = now.getDate();
    const month = now.toLocaleDateString('id-ID', { month: 'long' });
    const year = now.getFullYear();
    return { day, fullDate: `${date} ${month} ${year}` };
}

function getCurrentTimeMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function parseTimeMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function updateClock() {
    const clockEl = document.getElementById('clock');
    const dayEl = document.getElementById('current-day');
    const dateEl = document.getElementById('current-date');

    if (clockEl) clockEl.textContent = getFormattedTime();
    const { day, fullDate } = getFormattedDate();
    if (dayEl) dayEl.textContent = day;
    if (dateEl) dateEl.textContent = fullDate;
}

function getSubjectAtSlot(dayIndex, slotIndex) {
    const daySchedule = schedule[dayIndex];
    if (!daySchedule) return null;

    // Slot 4 is always Istirahat (09:40 - 10:00)
    if (slotIndex === 4) return "ISTIRAHAT";

    // For slots after break (index > 4), shift index back by 1
    // Slot 5 -> Subject 4, Slot 6 -> Subject 5, etc.
    if (slotIndex > 4) {
        return daySchedule[slotIndex - 1];
    }

    return daySchedule[slotIndex];
}

const fullTimeSlots = [
    { start: "07:00", end: "07:40" },
    { start: "07:40", end: "08:20" },
    { start: "08:20", end: "09:00" },
    { start: "09:00", end: "09:40" },
    { start: "09:40", end: "10:00", isBreak: true },
    { start: "10:00", end: "10:40" },
    { start: "10:40", end: "11:20" },
    { start: "11:20", end: "12:00" },
    { start: "12:00", end: "12:40" },
];

function updateDashboard() {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sun, ... 6 = Sat
    const currentMinutes = getCurrentTimeMinutes();

    const subjEl = document.getElementById('current-subject');
    const nextSubjEl = document.getElementById('next-subject');
    const timerangeEl = document.getElementById('current-time-range');
    const remainingEl = document.getElementById('time-remaining');
    const progressEl = document.getElementById('lesson-progress');

    if (!subjEl) return;

    if (dayIndex === 5) { // Friday
        subjEl.textContent = "Libur (Jumat)";
        nextSubjEl.textContent = "-";
        timerangeEl.textContent = "Sepanjang hari";
        progressEl.style.width = '0%';
        return;
    }

    let currentSlot = null;
    let currentSlotIndex = -1;

    for (let i = 0; i < fullTimeSlots.length; i++) {
        const slot = fullTimeSlots[i];
        const startMins = parseTimeMinutes(slot.start);
        const endMins = parseTimeMinutes(slot.end);

        if (currentMinutes >= startMins && currentMinutes < endMins) {
            currentSlot = slot;
            currentSlotIndex = i;
            break;
        }
    }

    if (currentSlot) {
        const subject = getSubjectAtSlot(dayIndex, currentSlotIndex);
        subjEl.textContent = subject || "Tidak ada jadwal";
        timerangeEl.textContent = `${currentSlot.start} - ${currentSlot.end}`;

        // Progress calculation
        const startMins = parseTimeMinutes(currentSlot.start);
        const endMins = parseTimeMinutes(currentSlot.end);
        const totalDuration = endMins - startMins;
        const elapsed = currentMinutes - startMins;
        const progress = (elapsed / totalDuration) * 100;
        progressEl.style.width = `${progress}%`;

        // Next
        if (currentSlotIndex + 1 < fullTimeSlots.length) {
            const nextSubj = getSubjectAtSlot(dayIndex, currentSlotIndex + 1);
            nextSubjEl.textContent = nextSubj;

            const remaining = endMins - currentMinutes;
            remainingEl.textContent = `${remaining} menit lagi`;
        } else {
            nextSubjEl.textContent = "Pulang";
            remainingEl.textContent = "";
        }

    } else {
        // Not in any slot (Before school or After school)
        const firstSlotStart = parseTimeMinutes(fullTimeSlots[0].start);

        if (currentMinutes < firstSlotStart) {
            subjEl.textContent = "Belum Masuk";
            const subject = getSubjectAtSlot(dayIndex, 0);
            nextSubjEl.textContent = subject;
            const diff = firstSlotStart - currentMinutes;
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            remainingEl.textContent = `Masuk dalam ${h > 0 ? h + ' jam ' : ''}${m} menit`;
            progressEl.style.width = `0%`;
        } else {
            subjEl.textContent = "Pulang Sekolah";
            timerangeEl.textContent = "-";
            nextSubjEl.textContent = "Besok";
            remainingEl.textContent = "-";
            progressEl.style.width = `100%`;
        }
    }
}

function renderWeeklySchedule() {
    const tbody = document.getElementById('schedule-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    fullTimeSlots.forEach((slot, index) => {
        const tr = document.createElement('tr');

        // Jam Ke (Index)
        const tdIndex = document.createElement('td');
        if (slot.isBreak) {
            tdIndex.textContent = ''; // Empty for break
        } else {
            // If index < 4 (0,1,2,3) -> 1,2,3,4
            // If index > 4 (5,6,7,8) -> 5,6,7,8 (because index 5 IS the 5th lesson if we skipped one index for break? No.)
            // wait.
            // items: 0(1), 1(2), 2(3), 3(4), 4(Break), 5(5), 6(6)...
            // yes, because we effectively skipped the count on 4. 
            // index 5 is the 6th item. 
            // If we want it to be "5", we need index.
            // 0->1, 1->2, 2->3, 3->4.
            // 5->5, 6->6.
            // So logic: index < 4 ? index + 1 : index
            tdIndex.textContent = index < 4 ? index + 1 : index;
        }
        tr.appendChild(tdIndex);

        const tdTime = document.createElement('td');
        tdTime.textContent = `${slot.start} - ${slot.end}`;
        tr.appendChild(tdTime);

        // Days Columns
        const displayDays = [6, 0, 1, 2, 3, 4];

        displayDays.forEach(dayIdx => {
            const td = document.createElement('td');

            if (slot.isBreak) {
                td.textContent = 'ISTIRAHAT';
                td.style.fontWeight = 'bold';
                td.style.letterSpacing = '1px';
                td.style.textAlign = 'center';
            } else {
                const subject = getSubjectAtSlot(dayIdx, index);
                td.textContent = subject || '-';
            }

            if (slot.isBreak) {
                tr.classList.add('break-row');
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// Dark Mode Logic
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);

    // Update Icon
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

function loadTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = '☀️';
    }
}

function init() {
    loadTheme(); // Load saved theme
    renderWeeklySchedule();

    // Event Listener for Toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleDarkMode);
    }

    setInterval(updateClock, 1000);
    setInterval(updateDashboard, 1000);
    updateClock();
    updateDashboard();
}

// In case script loads before DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
