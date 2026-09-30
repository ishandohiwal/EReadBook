/* ==========================================
   AuraRead - EPUB Reader Module
   Handles EPUB rendering using EPUB.js
   ========================================== */

const EPUBReaderModule = (() => {
    let book = null;
    let rendition = null;
    let currentBook = null;
    let highlights = {};
    let ttsActive = false;
    let currentSettings = {};

    // Initialize EPUB reader
    const init = async (epubData, bookMetadata, settings = {}) => {
        try {
            currentBook = bookMetadata;
            currentSettings = settings;

            // Create blob from data
            const blob = new Blob([epubData], { type: 'application/epub+zip' });
            const url = URL.createObjectURL(blob);

            // Create book instance
            book = ePub(url);

            // Get container
            const container = document.getElementById('readerContainer');
            if (!container) throw new Error('Reader container not found');

            // Clear container
            container.innerHTML = '';

            // Create reader structure
            createReaderStructure(container);

            // Render to container
            rendition = book.renderTo(container.querySelector('.epub-viewport'), {
                width: '100%',
                height: '100%',
                flow: settings.readingMode === 'paginated' ? 'paginated' : 'scrolled'
            });

            // Load progress
            const progress = await StorageModule.getProgress(currentBook.id);
            if (progress && progress.location) {
                rendition.display(progress.location);
            } else {
                rendition.display();
            }

            // Load highlights
            await loadHighlights();

            // Attach event listeners
            attachEventListeners();

            // Apply settings
            applySettings(settings);

            return true;
        } catch (error) {
            console.error('Error initializing EPUB reader:', error);
            Utils.showToast('Failed to load book', 'error');
            return false;
        }
    };

    // Create reader structure
    const createReaderStructure = (container) => {
        container.innerHTML = `
            <div class="epub-reader">
                <div class="epub-viewport"></div>
                <div class="reader-top-bar">
                    <div class="reader-top-bar-left">
                        <button class="reader-icon-button" id="epubBack" title="Back">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                    </div>
                    <div class="reader-top-bar-center">
                        <div class="reader-book-title">${currentBook.title}</div>
                        <div class="reader-chapter-title" id="epubChapterTitle"></div>
                    </div>
                    <div class="reader-top-bar-right">
                        <button class="reader-icon-button" id="epubSearch" title="Search">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                        <button class="reader-icon-button" id="epubTOC" title="Contents">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </button>
                        <button class="reader-icon-button" id="epubBookmark" title="Bookmark">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="reader-bottom-bar">
                    <div class="reader-progress-bar">
                        <div class="reader-progress-fill"></div>
                    </div>
                    <div class="reader-controls">
                        <button class="reader-icon-button" id="epubPrev" title="Previous">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <div class="reader-page-info" id="epubPageInfo">1 / 100</div>
                        <button class="reader-icon-button" id="epubNext" title="Next">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                        <button class="reader-icon-button" id="epubTTS" title="Text-to-Speech">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 16a6 6 0 0 1-5.91 6M9 19c-4.02-2.837-5.591-7.699-5-11a5.002 5.002 0 0 1 5-5 6 6 0 0 1 5 2.199"></path>
                                <path d="M9 13a3 3 0 0 1 3 3"></path>
                            </svg>
                        </button>
                        <button class="reader-icon-button" id="epubSettings" title="Settings">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="reader-settings-panel" id="epubSettingsPanel"></div>
                <div class="reader-search-panel" id="epubSearchPanel"></div>
                <div class="tts-panel" id="epubTTSPanel"></div>
                <div class="toc-drawer" id="epubTOCDrawer"></div>
                <div class="reader-overlay" id="readerOverlay"></div>
            </div>
        `;
    };

    // Attach event listeners
    const attachEventListeners = () => {
        const backBtn = document.getElementById('epubBack');
        const prevBtn = document.getElementById('epubPrev');
        const nextBtn = document.getElementById('epubNext');
        const settingsBtn = document.getElementById('epubSettings');
        const ttsBtn = document.getElementById('epubTTS');
        const bookmarkBtn = document.getElementById('epubBookmark');
        const tocBtn = document.getElementById('epubTOC');
        const searchBtn = document.getElementById('epubSearch');

        if (backBtn) backBtn.addEventListener('click', closeReader);
        if (prevBtn) prevBtn.addEventListener('click', () => rendition.prev());
        if (nextBtn) nextBtn.addEventListener('click', () => rendition.next());
        if (settingsBtn) settingsBtn.addEventListener('click', showSettings);
        if (ttsBtn) ttsBtn.addEventListener('click', toggleTTS);
        if (bookmarkBtn) bookmarkBtn.addEventListener('click', toggleBookmark);
        if (tocBtn) tocBtn.addEventListener('click', showTOC);
        if (searchBtn) searchBtn.addEventListener('click', showSearch);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeydown);

        // Rendition events
        rendition.on('rendered', updateProgress);
        rendition.on('relocated', updateProgress);

        // Text selection for highlighting
        rendition.on('selected', handleTextSelection);
    };

    // Handle text selection
    const handleTextSelection = (cfiRange, contentsView) => {
        const text = contentsView.window.getSelection().toString();
        if (!text.trim()) return;

        // Show highlight menu
        showHighlightMenu(cfiRange, text, contentsView);
    };

    // Show highlight menu
    const showHighlightMenu = (cfiRange, text, contentsView) => {
        const menu = Utils.createElement('div', 'highlights-menu visible');
        
        const colors = ['yellow', 'blue', 'green', 'pink'];
        const colorButtons = colors.map(color => {
            const btn = Utils.createElement('div', `highlight-color-option ${color}`);
            btn.addEventListener('click', () => {
                addHighlight(cfiRange, text, color);
                menu.remove();
            });
            return btn;
        });

        const saveQuoteBtn = Utils.createElement('button', 'highlight-action-button', 'Save as Quote');
        saveQuoteBtn.addEventListener('click', () => {
            saveQuoteFromSelection(text);
            menu.remove();
        });

        colorButtons.forEach(btn => menu.appendChild(btn));
        menu.appendChild(saveQuoteBtn);

        // Position menu at selection
        const selection = contentsView.window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = (rect.top - 60) + 'px';
            menu.style.left = (rect.left - 50) + 'px';
        }

        document.body.appendChild(menu);
        setTimeout(() => menu.remove(), 5000);
    };

    // Add highlight
    const addHighlight = async (cfiRange, text, color) => {
        try {
            const highlight = await StorageModule.saveHighlight({
                bookId: currentBook.id,
                cfiRange,
                text,
                color,
                location: rendition.currentLocation().start.cfi
            });

            // Apply highlight visually
            rendition.annotations.highlight(cfiRange, {}, (e) => {
                e.style.backgroundColor = getHighlightColor(color);
            });

            highlights[cfiRange] = highlight;
            Utils.showToast('Highlight saved', 'success');
        } catch (error) {
            console.error('Error adding highlight:', error);
            Utils.showToast('Failed to save highlight', 'error');
        }
    };

    // Save quote from selection
    const saveQuoteFromSelection = async (text) => {
        try {
            const quote = await StorageModule.saveQuote({
                bookId: currentBook.id,
                bookTitle: currentBook.title,
                text,
                location: rendition.currentLocation().start.cfi,
                chapter: document.getElementById('epubChapterTitle')?.textContent || 'Unknown'
            });
            Utils.showToast('Quote saved', 'success');
        } catch (error) {
            console.error('Error saving quote:', error);
            Utils.showToast('Failed to save quote', 'error');
        }
    };

    // Load highlights
    const loadHighlights = async () => {
        try {
            const bookHighlights = await StorageModule.getHighlights(currentBook.id);
            bookHighlights.forEach(h => {
                highlights[h.cfiRange] = h;
                rendition.annotations.highlight(h.cfiRange, {}, (e) => {
                    e.style.backgroundColor = getHighlightColor(h.color);
                });
            });
        } catch (error) {
            console.error('Error loading highlights:', error);
        }
    };

    // Get highlight color
    const getHighlightColor = (color) => {
        const colors = {
            yellow: 'rgba(250, 204, 21, 0.3)',
            blue: 'rgba(96, 165, 250, 0.3)',
            green: 'rgba(74, 222, 128, 0.3)',
            pink: 'rgba(244, 114, 182, 0.3)'
        };
        return colors[color] || colors.yellow;
    };

    // Update progress
    const updateProgress = () => {
        if (!rendition) return;

        const location = rendition.currentLocation();
        if (location) {
            const progress = book.spine.indexOf(location.start.spine.index) / book.spine.length;
            const percent = Math.round(progress * 100);

            // Update UI
            const progressFill = document.querySelector('.reader-progress-fill');
            if (progressFill) progressFill.style.width = percent + '%';

            // Update page info
            const pageInfo = document.getElementById('epubPageInfo');
            if (pageInfo) {
                pageInfo.textContent = `${location.start.spine.index + 1} / ${book.spine.length}`;
            }

            // Save progress
            StorageModule.saveProgress(currentBook.id, {
                bookId: currentBook.id,
                progress: percent,
                location: location.start.cfi,
                currentChapter: location.start.href
            });

            currentBook.progress = percent;
        }
    };

    // Show settings
    const showSettings = () => {
        const panel = document.getElementById('epubSettingsPanel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="reader-settings-group">
                <label class="reader-settings-label">Font</label>
                <div class="reader-settings-options">
                    <button class="reader-settings-option ${currentSettings.font === 'serif' ? 'active' : ''}" data-font="serif">Serif</button>
                    <button class="reader-settings-option ${currentSettings.font === 'sans' ? 'active' : ''}" data-font="sans">Sans</button>
                </div>
            </div>
            <div class="reader-settings-group">
                <label class="reader-settings-label">Font Size</label>
                <input type="range" class="reader-slider" id="fontSizeSlider" min="80" max="200" value="${(currentSettings.fontSize || 100)}" />
            </div>
            <div class="reader-settings-group">
                <label class="reader-settings-label">Line Height</label>
                <input type="range" class="reader-slider" id="lineHeightSlider" min="1" max="2" step="0.1" value="${(currentSettings.lineHeight || 1.5)}" />
            </div>
            <div class="reader-settings-group">
                <label class="reader-settings-label">Reading Width</label>
                <div class="reader-settings-options">
                    <button class="reader-settings-option ${currentSettings.readingWidth === 'narrow' ? 'active' : ''}" data-width="narrow">Narrow</button>
                    <button class="reader-settings-option ${currentSettings.readingWidth === 'comfortable' ? 'active' : ''}" data-width="comfortable">Comfortable</button>
                </div>
            </div>
        `;

        panel.classList.add('visible');

        // Attach listeners
        panel.querySelectorAll('[data-font]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                updateSetting('font', e.target.dataset.font);
            });
        });

        document.getElementById('fontSizeSlider')?.addEventListener('change', (e) => {
            updateSetting('fontSize', parseInt(e.target.value));
        });

        document.getElementById('lineHeightSlider')?.addEventListener('change', (e) => {
            updateSetting('lineHeight', parseFloat(e.target.value));
        });

        panel.querySelectorAll('[data-width]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                updateSetting('readingWidth', e.target.dataset.width);
            });
        });
    };

    // Update setting
    const updateSetting = (key, value) => {
        currentSettings[key] = value;
        applySettings(currentSettings);
        StorageModule.saveSetting(`epubReader_${key}`, value);
    };

    // Apply settings
    const applySettings = (settings) => {
        if (!rendition) return;

        // Font
        if (settings.font) {
            const fontFamily = settings.font === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif';
            rendition.themes.default({
                body: {
                    'font-family': fontFamily
                }
            });
        }

        // Font size
        if (settings.fontSize) {
            rendition.themes.default({
                body: {
                    'font-size': settings.fontSize + '%'
                }
            });
        }

        // Line height
        if (settings.lineHeight) {
            rendition.themes.default({
                body: {
                    'line-height': settings.lineHeight
                }
            });
        }
    };

    // Toggle bookmark
    const toggleBookmark = async () => {
        try {
            const location = rendition.currentLocation();
            const isBookmarked = Object.keys(highlights).some(key => 
                highlights[key].isBookmark === true && highlights[key].location === location.start.cfi
            );

            if (isBookmarked) {
                Utils.showToast('Bookmark removed', 'success');
            } else {
                await StorageModule.saveBookmark({
                    bookId: currentBook.id,
                    location: location.start.cfi,
                    chapter: document.getElementById('epubChapterTitle')?.textContent || 'Unknown'
                });
                Utils.showToast('Bookmark added', 'success');
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    // Toggle TTS
    const toggleTTS = () => {
        ttsActive = !ttsActive;
        if (ttsActive) {
            showTTSPanel();
        } else {
            TTSModule.stop();
        }
    };

    // Show TTS panel
    const showTTSPanel = () => {
        const panel = document.getElementById('epubTTSPanel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="tts-controls">
                <button class="tts-button" id="ttsPlay">Play</button>
                <button class="tts-button secondary" id="ttsPause">Pause</button>
                <button class="tts-button secondary" id="ttsStop">Stop</button>
            </div>
            <div class="tts-setting">
                <label>Voice</label>
                <select class="tts-select" id="ttsVoiceSelect">
                    ${TTSModule.getVoices().map((v, i) => `<option value="${i}">${v.name}</option>`).join('')}
                </select>
            </div>
            <div class="tts-setting">
                <label>Speed</label>
                <input type="range" class="tts-range" id="ttsSpeedSlider" min="0.5" max="2" step="0.25" value="1" />
            </div>
        `;

        panel.classList.add('visible');

        // Attach listeners
        document.getElementById('ttsPlay')?.addEventListener('click', () => {
            const text = rendition.currentLocation()?.start?.textContent || '';
            TTSModule.speak(text, { rate: 1 });
        });

        document.getElementById('ttsPause')?.addEventListener('click', () => TTSModule.pause());
        document.getElementById('ttsStop')?.addEventListener('click', () => TTSModule.stop());

        document.getElementById('ttsSpeedSlider')?.addEventListener('change', (e) => {
            TTSModule.setRate(parseFloat(e.target.value));
        });
    };

    // Show TOC
    const showTOC = () => {
        const drawer = document.getElementById('epubTOCDrawer');
        if (!drawer) return;

        drawer.classList.add('visible');
        drawer.innerHTML = createTOC();
    };

    // Create TOC
    const createTOC = () => {
        let html = `
            <div class="toc-header">
                <h3 class="toc-title">${currentBook.title}</h3>
                <button class="toc-close">&times;</button>
            </div>
            <ul class="toc-list">
        `;

        if (book.navigation && book.navigation.toc) {
            book.navigation.toc.forEach(item => {
                html += `
                    <li class="toc-item">
                        <button class="toc-link" data-href="${item.href}">${item.label}</button>
                    </li>
                `;
            });
        }

        html += `</ul>`;

        // Wait for render then attach listeners
        setTimeout(() => {
            drawer.querySelectorAll('.toc-link').forEach(link => {
                link.addEventListener('click', () => {
                    rendition.display(link.dataset.href);
                    drawer.classList.remove('visible');
                });
            });

            drawer.querySelector('.toc-close')?.addEventListener('click', () => {
                drawer.classList.remove('visible');
            });
        }, 0);

        return html;
    };

    // Show search
    const showSearch = () => {
        const panel = document.getElementById('epubSearchPanel');
        if (!panel) return;

        panel.innerHTML = `
            <input type="text" class="reader-search-input" id="epubSearchInput" placeholder="Search...">
            <div class="reader-search-results" id="epubSearchResults"></div>
            <div class="reader-search-count" id="epubSearchCount"></div>
        `;

        panel.classList.add('visible');

        const searchInput = document.getElementById('epubSearchInput');
        searchInput?.focus();
    };

    // Handle keyboard shortcuts
    const handleKeydown = (e) => {
        if (e.key === 'ArrowLeft') rendition?.prev();
        if (e.key === 'ArrowRight') rendition?.next();
        if (e.key === 'Escape') closeReader();
    };

    // Close reader
    const closeReader = async () => {
        document.removeEventListener('keydown', handleKeydown);
        if (book) book.destroy();
        ReaderModule.closeReader();
    };

    return {
        init,
        closeReader,
        rendition: () => rendition
    };
})();
