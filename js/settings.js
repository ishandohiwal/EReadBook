/* ==========================================
   AuraRead - Settings Module
   Application settings and preferences
   ========================================== */

const SettingsModule = (() => {
    const DEFAULT_SETTINGS = {
        theme: 'oled-dark',
        accentColor: '#7c5cff',
        interfaceDensity: 'comfortable',
        animationIntensity: 'normal',
        font: 'sans',
        fontSize: 100,
        lineHeight: 1.5,
        readingWidth: 'comfortable',
        readingMode: 'paginated',
        ttsVoice: 0,
        ttsSpeed: 1,
        autoSave: true,
        screenWake: false,
        tapZones: true,
        swipeNavigation: true
    };

    // Initialize settings
    const init = async () => {
        const stored = await StorageModule.getAllSettings();
        Object.assign(DEFAULT_SETTINGS, stored);
        applySettings();
    };

    // Get setting
    const getSetting = async (key) => {
        const value = await StorageModule.getSetting(key);
        return value !== null ? value : DEFAULT_SETTINGS[key];
    };

    // Set setting
    const setSetting = async (key, value) => {
        DEFAULT_SETTINGS[key] = value;
        await StorageModule.saveSetting(key, value);
        applySettings();
    };

    // Apply settings to UI
    const applySettings = () => {
        // Apply theme
        document.documentElement.setAttribute('data-theme', DEFAULT_SETTINGS.theme);
        
        // Apply accent color
        document.documentElement.style.setProperty('--color-accent', DEFAULT_SETTINGS.accentColor);
    };

    // Render settings page
    const renderSettings = async () => {
        const container = document.getElementById('settingsContainer');
        if (!container) return;

        const settings = await StorageModule.getAllSettings();

        container.innerHTML = `
            <!-- Appearance -->
            <div class="settings-section">
                <h3>Appearance</h3>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Theme</div>
                        <div class="settings-label-description">Choose your reading environment</div>
                    </div>
                    <select class="filter-select" id="themeSelect">
                        <option value="oled-dark" ${settings.theme === 'oled-dark' ? 'selected' : ''}>OLED Dark</option>
                        <option value="midnight" ${settings.theme === 'midnight' ? 'selected' : ''}>Midnight</option>
                        <option value="sepia" ${settings.theme === 'sepia' ? 'selected' : ''}>Sepia</option>
                        <option value="paper" ${settings.theme === 'paper' ? 'selected' : ''}>Paper</option>
                    </select>
                </div>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Accent Color</div>
                    </div>
                    <input type="color" class="color-input" id="accentColorPicker" value="${settings.accentColor || '#7c5cff'}">
                </div>
            </div>

            <!-- Reading -->
            <div class="settings-section">
                <h3>Reading</h3>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Font Family</div>
                    </div>
                    <select class="filter-select" id="fontSelect">
                        <option value="sans" ${settings.font === 'sans' ? 'selected' : ''}>Sans Serif</option>
                        <option value="serif" ${settings.font === 'serif' ? 'selected' : ''}>Serif</option>
                        <option value="mono" ${settings.font === 'mono' ? 'selected' : ''}>Monospace</option>
                    </select>
                </div>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Font Size</div>
                    </div>
                    <input type="range" class="range-slider" id="fontSizeSlider" min="80" max="150" value="${settings.fontSize || 100}">
                </div>
            </div>

            <!-- Text-to-Speech -->
            <div class="settings-section">
                <h3>Text-to-Speech</h3>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Default Speed</div>
                    </div>
                    <input type="range" class="range-slider" id="ttsSpeedSlider" min="0.5" max="2" step="0.25" value="${settings.ttsSpeed || 1}">
                </div>
            </div>

            <!-- Behavior -->
            <div class="settings-section">
                <h3>Behavior</h3>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Tap Navigation</div>
                        <div class="settings-label-description">Navigate by tapping sides</div>
                    </div>
                    <div class="toggle ${settings.tapZones ? 'active' : ''}" id="tapZonesToggle">
                        <div class="toggle-dot"></div>
                    </div>
                </div>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Swipe Navigation</div>
                        <div class="settings-label-description">Swipe to change pages</div>
                    </div>
                    <div class="toggle ${settings.swipeNavigation ? 'active' : ''}" id="swipeToggle">
                        <div class="toggle-dot"></div>
                    </div>
                </div>
                <div class="settings-group">
                    <div class="settings-label">
                        <div class="settings-label-title">Auto-Save Progress</div>
                        <div class="settings-label-description">Automatically save reading position</div>
                    </div>
                    <div class="toggle ${settings.autoSave ? 'active' : ''}" id="autoSaveToggle">
                        <div class="toggle-dot"></div>
                    </div>
                </div>
            </div>

            <!-- Data -->
            <div class="settings-section">
                <h3>Data</h3>
                <div class="settings-group">
                    <button class="btn btn-secondary" id="exportDataBtn">Export Library Data</button>
                </div>
                <div class="settings-group">
                    <button class="btn btn-secondary" id="importDataBtn">Import Library Data</button>
                </div>
                <div class="settings-group">
                    <button class="btn btn-secondary" id="clearDataBtn">Clear All Data</button>
                </div>
            </div>
        `;

        attachSettingsListeners();
    };

    // Attach settings listeners
    const attachSettingsListeners = () => {
        // Theme
        document.getElementById('themeSelect')?.addEventListener('change', (e) => {
            setSetting('theme', e.target.value);
        });

        // Accent color
        document.getElementById('accentColorPicker')?.addEventListener('change', (e) => {
            setSetting('accentColor', e.target.value);
        });

        // Font
        document.getElementById('fontSelect')?.addEventListener('change', (e) => {
            setSetting('font', e.target.value);
        });

        // Font size
        document.getElementById('fontSizeSlider')?.addEventListener('change', (e) => {
            setSetting('fontSize', parseInt(e.target.value));
        });

        // TTS Speed
        document.getElementById('ttsSpeedSlider')?.addEventListener('change', (e) => {
            setSetting('ttsSpeed', parseFloat(e.target.value));
        });

        // Toggles
        document.getElementById('tapZonesToggle')?.addEventListener('click', async (e) => {
            const current = await getSetting('tapZones');
            setSetting('tapZones', !current);
            e.target.classList.toggle('active');
        });

        document.getElementById('swipeToggle')?.addEventListener('click', async (e) => {
            const current = await getSetting('swipeNavigation');
            setSetting('swipeNavigation', !current);
            e.target.classList.toggle('active');
        });

        document.getElementById('autoSaveToggle')?.addEventListener('click', async (e) => {
            const current = await getSetting('autoSave');
            setSetting('autoSave', !current);
            e.target.classList.toggle('active');
        });

        // Data operations
        document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
        document.getElementById('importDataBtn')?.addEventListener('click', importData);
        document.getElementById('clearDataBtn')?.addEventListener('click', clearData);
    };

    // Export data
    const exportData = async () => {
        try {
            const data = await StorageModule.exportData();
            const json = JSON.stringify(data, null, 2);
            Utils.downloadFile(json, 'auraread-backup.json', 'application/json');
            Utils.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Utils.showToast('Failed to export data', 'error');
        }
    };

    // Import data
    const importData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', async (e) => {
            try {
                const file = e.target.files[0];
                const content = await Utils.readFileAs(file, 'text');
                const data = JSON.parse(content);
                const success = await StorageModule.importData(data);
                if (success) {
                    Utils.showToast('Data imported successfully', 'success');
                    location.reload();
                } else {
                    Utils.showToast('Failed to import data', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                Utils.showToast('Invalid data file', 'error');
            }
        });
        input.click();
    };

    // Clear data
    const clearData = async () => {
        if (confirm('Are you sure? This will delete all your books and progress.')) {
            try {
                await StorageModule.clearAll();
                Utils.showToast('All data cleared', 'success');
                location.reload();
            } catch (error) {
                console.error('Clear error:', error);
                Utils.showToast('Failed to clear data', 'error');
            }
        }
    };

    return {
        init,
        getSetting,
        setSetting,
        renderSettings,
        applySettings
    };
})();
