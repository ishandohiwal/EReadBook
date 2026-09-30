/* ==========================================
   AuraRead - Main Application
   Application initialization and orchestration
   ========================================== */

const AuraRead = (() => {
    // Initialize application
    const init = async () => {
        try {
            // Initialize storage
            await StorageModule.init();

            // Initialize settings
            await SettingsModule.init();

            // Initialize TTS
            TTSModule.init();

            // Initialize library
            await LibraryModule.init();

            // Initialize statistics
            await StatisticsModule.renderStats();

            // Initialize settings page
            await SettingsModule.renderSettings();

            // Initialize quotes
            await renderQuotes();

            // Attach main event listeners
            attachEventListeners();

            // Setup keyboard shortcuts
            setupKeyboardShortcuts();

            // Setup command palette
            setupCommandPalette();

            // Show library
            showView('library');

            console.log('✨ AuraRead initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showToast('Failed to initialize application', 'error');
        }
    };

    // Show view
    const showView = (viewName) => {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const viewId = viewName + 'View';
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link, .nav-button').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll(`[data-view="${viewName}"]`).forEach(link => {
            link.classList.add('active');
        });

        // Render view-specific content
        if (viewName === 'stats') {
            StatisticsModule.renderStats();
        } else if (viewName === 'quotes') {
            renderQuotes();
        } else if (viewName === 'settings') {
            SettingsModule.renderSettings();
        }
    };

    // Render quotes
    const renderQuotes = async () => {
        const container = document.getElementById('quotesContainer');
        const emptyState = document.getElementById('quotesEmpty');

        if (!container) return;

        try {
            const quotes = await StorageModule.getAllQuotes();
            container.innerHTML = '';

            if (quotes.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            quotes.forEach(quote => {
                const card = Utils.createElement('div', 'quote-card');

                const text = Utils.createElement('div', 'quote-text', quote.text);
                card.appendChild(text);

                const source = Utils.createElement('div', 'quote-source');
                const book = Utils.createElement('div', 'quote-source-book', quote.bookTitle || 'Unknown');
                source.appendChild(book);
                if (quote.chapter) {
                    const chapter = Utils.createElement('div', 'quote-source', quote.chapter);
                    source.appendChild(chapter);
                }
                card.appendChild(source);

                const actions = Utils.createElement('div', 'quote-actions');

                const copyBtn = Utils.createElement('button', 'quote-action', 'Copy');
                copyBtn.addEventListener('click', () => {
                    Utils.copyToClipboard(quote.text);
                    Utils.showToast('Quote copied', 'success');
                });
                actions.appendChild(copyBtn);

                const deleteBtn = Utils.createElement('button', 'quote-action', 'Delete');
                deleteBtn.addEventListener('click', async () => {
                    await StorageModule.deleteQuote(quote.id);
                    card.remove();
                    Utils.showToast('Quote deleted', 'success');
                });
                actions.appendChild(deleteBtn);

                card.appendChild(actions);
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Error rendering quotes:', error);
        }
    };

    // Attach event listeners
    const attachEventListeners = () => {
        // Navigation
        document.querySelectorAll('.nav-link, .nav-button').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view) showView(view);
            });
        });
    };

    // Setup keyboard shortcuts
    const setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K for command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                showCommandPalette();
            }

            // Escape to close palettes
            if (e.key === 'Escape') {
                closeAllPalettes();
            }
        });
    };

    // Setup command palette
    const setupCommandPalette = () => {
        const palette = document.getElementById('commandPalette');
        const input = document.getElementById('commandInput');
        const list = document.getElementById('commandList');

        if (!palette || !input || !list) return;

        const commands = [
            { name: 'Library', action: () => showView('library'), icon: '📚' },
            { name: 'Import Book', action: () => ImportModule.showImportModal(), icon: '📥' },
            { name: 'Your Quotes', action: () => showView('quotes'), icon: '✨' },
            { name: 'Statistics', action: () => showView('stats'), icon: '📊' },
            { name: 'Settings', action: () => showView('settings'), icon: '⚙️' },
            { name: 'Search Library', action: () => document.getElementById('librarySearch')?.focus(), icon: '🔍' }
        ];

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            list.innerHTML = '';

            const filtered = commands.filter(cmd =>
                cmd.name.toLowerCase().includes(query)
            );

            filtered.forEach((cmd, index) => {
                const item = Utils.createElement('button', 'command-item', `${cmd.icon} ${cmd.name}`);
                if (index === 0) item.classList.add('active');
                item.addEventListener('click', () => {
                    cmd.action();
                    palette.style.display = 'none';
                });
                list.appendChild(item);
            });
        });
    };

    // Show command palette
    const showCommandPalette = () => {
        const palette = document.getElementById('commandPalette');
        const input = document.getElementById('commandInput');
        if (palette) {
            palette.style.display = 'flex';
            input?.focus();
        }
    };

    // Close all palettes
    const closeAllPalettes = () => {
        document.getElementById('commandPalette').style.display = 'none';
        document.getElementById('importModal').style.display = 'none';
        document.querySelectorAll('.reader-settings-panel').forEach(p => p.classList.remove('visible'));
        document.querySelectorAll('.reader-search-panel').forEach(p => p.classList.remove('visible'));
        document.querySelectorAll('.toc-drawer').forEach(d => d.classList.remove('visible'));
    };

    return {
        init
    };
})();

// Import module (book import functionality)
const ImportModule = (() => {
    const showImportModal = () => {
        const modal = document.getElementById('importModal');
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const modalClose = document.querySelector('.modal-close');

        modal.style.display = 'flex';

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--color-accent)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--color-border)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--color-border)';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        // Click to select
        dropZone.addEventListener('click', () => fileInput?.click());

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });

        modalClose?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    };

    const handleFileSelect = async (file) => {
        try {
            const progress = document.getElementById('importProgress');
            const status = document.getElementById('importStatus');
            const progressFill = document.querySelector('.progress-fill');

            progress.style.display = 'block';
            status.textContent = 'Processing...';
            progressFill.style.width = '33%';

            // Read file
            const fileData = await Utils.readFileAs(file, 'binary');

            status.textContent = 'Analyzing...';
            progressFill.style.width = '66%';

            // Get metadata
            const format = file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf';
            const metadata = {
                id: Utils.generateId(),
                title: file.name.replace(/\.[^/.]+$/, ''),
                author: 'Unknown Author',
                format: format,
                fileName: file.name,
                fileSize: file.size,
                dateAdded: Date.now(),
                lastOpened: null,
                progress: 0,
                status: 'unread',
                coverUrl: null,
                fileData: fileData
            };

            status.textContent = 'Saving...';
            progressFill.style.width = '90%';

            // Save to library
            await LibraryModule.addBook(metadata);

            status.textContent = 'Complete!';
            progressFill.style.width = '100%';

            Utils.showToast(`"${metadata.title}" added to library`, 'success');

            setTimeout(() => {
                document.getElementById('importModal').style.display = 'none';
                progress.style.display = 'none';
            }, 1000);
        } catch (error) {
            console.error('Import error:', error);
            Utils.showToast('Failed to import book', 'error');
        }
    };

    return {
        showImportModal
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AuraRead.init);
} else {
    AuraRead.init();
}
