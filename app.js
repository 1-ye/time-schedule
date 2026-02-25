// ===== Schedule Data =====
const SCHEDULE_ITEMS = [
    {
        id: 'wakeup',
        time: '7:00',
        title: '起床 · 拉伸 + 洗漱',
        icon: '🌅',
        accent: '#64748b'
    },
    {
        id: 'work',
        time: '8:30 – 17:30',
        title: '工作',
        icon: '💼',
        accent: '#3b82f6'
    },
    {
        id: 'dinner',
        time: '18:30 – 19:00',
        title: '晚饭 + 放松（不刷短视频）',
        icon: '🟠',
        accent: '#f97316'
    },
    {
        id: 'study',
        time: '19:00 – 19:40',
        title: '深度学习 40min（运维/安全）',
        icon: '🔵',
        accent: '#06b6d4'
    },
    {
        id: 'workout',
        time: '19:40 – 20:10',
        title: '力量训练 30min（俯卧撑+深蹲+核心）',
        icon: '🟢',
        accent: '#22c55e'
    },
    {
        id: 'gaming',
        time: '20:10 – 21:10',
        title: '游戏奖励 1小时（封顶）',
        icon: '🎮',
        accent: '#a855f7'
    },
    {
        id: 'relax',
        time: '21:10 – 22:00',
        title: '放松（聊天/阅读/轻松内容）',
        icon: '🟡',
        accent: '#eab308'
    },
    {
        id: 'screenoff',
        time: '22:30',
        title: '停止电子设备',
        icon: '📵',
        accent: '#ef4444'
    },
    {
        id: 'sleep',
        time: '23:00',
        title: '睡觉',
        icon: '🌙',
        accent: '#6366f1'
    }
];

const STORAGE_KEY = 'timeScheduleData';
const PASS_THRESHOLD = 0.8; // 80% to count as a "completed" day

// ===== Utility Functions =====
function getTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(date) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 · ${weekday}`;
}

function formatShortDate(dateStr) {
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

// ===== Data Layer =====
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayItems() {
    const data = loadData();
    const today = getTodayStr();
    if (!data[today]) {
        data[today] = { items: new Array(SCHEDULE_ITEMS.length).fill(false) };
        saveData(data);
    }
    return data[today].items;
}

function toggleItem(index) {
    const data = loadData();
    const today = getTodayStr();
    if (!data[today]) {
        data[today] = { items: new Array(SCHEDULE_ITEMS.length).fill(false) };
    }
    data[today].items[index] = !data[today].items[index];
    saveData(data);
    return data[today].items;
}

// ===== Streak Calculation =====
function calculateStreak() {
    const data = loadData();
    let streak = 0;
    const today = new Date();

    // Check if today passes — if so, include it
    const todayStr = getDateStr(today);
    const todayData = data[todayStr];
    let startFromYesterday = true;
    if (todayData) {
        const completed = todayData.items.filter(Boolean).length;
        if (completed / SCHEDULE_ITEMS.length >= PASS_THRESHOLD) {
            streak = 1;
            startFromYesterday = true;
        }
    }

    // Count backwards from yesterday
    let d = new Date(today);
    d.setDate(d.getDate() - 1);

    while (true) {
        const dateStr = getDateStr(d);
        const dayData = data[dateStr];
        if (!dayData) break;
        const completed = dayData.items.filter(Boolean).length;
        if (completed / SCHEDULE_ITEMS.length >= PASS_THRESHOLD) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function calculateBestStreak() {
    const data = loadData();
    const dates = Object.keys(data).sort();
    if (dates.length === 0) return 0;

    let best = 0;
    let current = 0;

    // Iterate through all days from first record to today
    const start = new Date(dates[0]);
    const end = new Date();
    const d = new Date(start);

    while (d <= end) {
        const dateStr = getDateStr(d);
        const dayData = data[dateStr];
        if (dayData) {
            const completed = dayData.items.filter(Boolean).length;
            if (completed / SCHEDULE_ITEMS.length >= PASS_THRESHOLD) {
                current++;
                best = Math.max(best, current);
            } else {
                current = 0;
            }
        } else {
            current = 0;
        }
        d.setDate(d.getDate() + 1);
    }

    return best;
}

function calculateTotalDays() {
    const data = loadData();
    let count = 0;
    for (const key of Object.keys(data)) {
        const dayData = data[key];
        const completed = dayData.items.filter(Boolean).length;
        if (completed / SCHEDULE_ITEMS.length >= PASS_THRESHOLD) {
            count++;
        }
    }
    return count;
}

function calculateAvgCompletion() {
    const data = loadData();
    const dates = Object.keys(data);
    if (dates.length === 0) return 0;

    let totalPercent = 0;
    for (const key of dates) {
        const dayData = data[key];
        const completed = dayData.items.filter(Boolean).length;
        totalPercent += (completed / SCHEDULE_ITEMS.length) * 100;
    }
    return Math.round(totalPercent / dates.length);
}

// ===== Rendering =====
function createCheckSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'white');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', '4 12 9 17 20 6');
    svg.appendChild(path);
    return svg;
}

function renderSchedule() {
    const list = document.getElementById('scheduleList');
    const items = getTodayItems();
    list.innerHTML = '';

    SCHEDULE_ITEMS.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `schedule-card${items[index] ? ' completed' : ''}`;
        card.style.setProperty('--card-accent', item.accent);
        card.id = `card-${item.id}`;

        card.innerHTML = `
            <div class="card-checkbox">
                ${createCheckSVG().outerHTML}
            </div>
            <div class="card-icon">${item.icon}</div>
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-time">${item.time}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            const newItems = toggleItem(index);
            card.classList.toggle('completed', newItems[index]);
            updateProgress(newItems);
            updateStats();
        });

        list.appendChild(card);
    });

    updateProgress(items);
}

function updateProgress(items) {
    const completed = items.filter(Boolean).length;
    const total = SCHEDULE_ITEMS.length;
    const percent = Math.round((completed / total) * 100);

    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `${completed} / ${total} 已完成`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
}

function updateStats() {
    const streak = calculateStreak();
    document.getElementById('streakCount').textContent = streak;
    document.getElementById('totalDays').textContent = calculateTotalDays();
    document.getElementById('bestStreak').textContent = calculateBestStreak();
    document.getElementById('avgCompletion').textContent = `${calculateAvgCompletion()}%`;
}

function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    container.innerHTML = '';
    const data = loadData();
    const today = new Date();

    // Show last 28 days (4 rows of 7)
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getDateStr(d);
        const dayData = data[dateStr];

        let level = 0;
        if (dayData) {
            const completed = dayData.items.filter(Boolean).length;
            const ratio = completed / SCHEDULE_ITEMS.length;
            if (ratio > 0 && ratio < 0.25) level = 1;
            else if (ratio >= 0.25 && ratio < 0.5) level = 2;
            else if (ratio >= 0.5 && ratio < 0.8) level = 3;
            else if (ratio >= 0.8) level = 4;
        }

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.style.background = `var(--heat-${level})`;

        const completedCount = dayData ? dayData.items.filter(Boolean).length : 0;
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = `${formatShortDate(dateStr)} · ${completedCount}/${SCHEDULE_ITEMS.length} 完成`;
        cell.appendChild(tooltip);

        container.appendChild(cell);
    }
}

// ===== History Toggle =====
function initHistoryToggle() {
    const toggle = document.getElementById('historyToggle');
    const content = document.getElementById('historyContent');
    const arrow = document.getElementById('toggleArrow');

    toggle.addEventListener('click', () => {
        content.classList.toggle('open');
        arrow.classList.toggle('open');
    });
}

// ===== Date Display =====
function updateDateDisplay() {
    document.getElementById('currentDate').textContent = formatDisplayDate(new Date());
}

// ===== Auto-refresh at midnight =====
function scheduleRefreshAtMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
        updateDateDisplay();
        renderSchedule();
        renderHeatmap();
        updateStats();
        scheduleRefreshAtMidnight();
    }, msUntilMidnight);
}

// ===== Init =====
function init() {
    updateDateDisplay();
    renderSchedule();
    renderHeatmap();
    updateStats();
    initHistoryToggle();
    scheduleRefreshAtMidnight();
}

document.addEventListener('DOMContentLoaded', init);
