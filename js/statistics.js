/* ==========================================
   AuraRead - Statistics Module
   Tracks reading statistics
   ========================================== */

const StatisticsModule = (() => {
    let readingSession = {
        startTime: null,
        totalTime: 0,
        isActive: false
    };

    // Start reading session
    const startSession = () => {
        readingSession.startTime = Date.now();
        readingSession.isActive = true;
    };

    // End reading session
    const endSession = async () => {
        if (!readingSession.startTime) return;
        
        const duration = Date.now() - readingSession.startTime;
        readingSession.totalTime += duration;
        readingSession.isActive = false;

        // Save to storage
        const today = new Date().toDateString();
        const todayStats = await StorageModule.getStatistic('readingStats_' + today) || { date: today, duration: 0 };
        todayStats.duration += duration;
        await StorageModule.saveStatistic('readingStats_' + today, todayStats);
    };

    // Get statistics
    const getStats = async () => {
        const books = await StorageModule.getAllBooks();
        const today = new Date().toDateString();
        
        const stats = {
            booksCompleted: books.filter(b => b.status === 'completed').length,
            booksReading: books.filter(b => b.status === 'reading').length,
            totalReadingTime: 0,
            todayReadingTime: 0,
            weekReadingTime: 0,
            monthReadingTime: 0,
            averageSessionLength: 0,
            readingStreak: 0
        };

        // Calculate reading times
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(now - i * dayMs).toDateString();
            const dayStats = await StorageModule.getStatistic('readingStats_' + date);
            
            if (dayStats) {
                stats.totalReadingTime += dayStats.duration || 0;
                
                if (i === 0) stats.todayReadingTime = dayStats.duration || 0;
                if (i < 7) stats.weekReadingTime += dayStats.duration || 0;
                if (i < 30) stats.monthReadingTime += dayStats.duration || 0;
                
                if (i === 0) stats.readingStreak = 1;
                else if (dayStats.duration > 0 && i > 0) stats.readingStreak++;
                else break;
            } else if (i > 0 && stats.readingStreak > 0) break;
        }

        return stats;
    };

    // Render statistics
    const renderStats = async () => {
        const container = document.getElementById('statsContainer');
        if (!container) return;

        const stats = await getStats();
        const books = await StorageModule.getAllBooks();

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.booksCompleted}</div>
                <div class="stat-label">Books Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.booksReading}</div>
                <div class="stat-label">Reading Now</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Utils.formatReadingTime(stats.totalReadingTime)}</div>
                <div class="stat-label">Total Reading Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Utils.formatReadingTime(stats.todayReadingTime)}</div>
                <div class="stat-label">Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.readingStreak}</div>
                <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Utils.formatReadingTime(stats.weekReadingTime)}</div>
                <div class="stat-label">This Week</div>
            </div>
            <div class="activity-chart">
                <h3>Reading Activity (Last 7 Days)</h3>
                <div class="activity-bars" id="activityBars"></div>
            </div>
        `;

        // Render activity chart
        const activityBars = document.getElementById('activityBars');
        const maxActivity = 100;
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
            const dayStats = await StorageModule.getStatistic('readingStats_' + date);
            const duration = dayStats?.duration || 0;
            const height = (duration / maxActivity) * 100;
            
            const bar = Utils.createElement('div', 'activity-bar');
            bar.style.height = Math.max(5, height) + '%';
            
            const label = Utils.createElement('div', 'activity-bar-label', new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }));
            bar.appendChild(label);
            
            activityBars.appendChild(bar);
        }
    };

    return {
        startSession,
        endSession,
        getStats,
        renderStats
    };
})();
