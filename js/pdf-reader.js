/* ==========================================
   AuraRead - PDF Reader Module
   Handles PDF rendering using PDF.js
   ========================================== */

const PDFReaderModule = (() => {
    let pdfDoc = null;
    let currentPage = 1;
    let pageCount = 0;
    let currentBook = null;
    let currentZoom = 100;
    let continuousMode = true;
    let canvas = null;
    let ctx = null;

    // Initialize PDF reader
    const init = async (pdfData, bookMetadata, settings = {}) => {
        try {
            currentBook = bookMetadata;

            // Load PDF
            const blob = new Blob([pdfData], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            pdfDoc = await pdfjsLib.getDocument(url).promise;
            pageCount = pdfDoc.numPages;

            // Create reader structure
            createReaderStructure();

            // Load progress
            const progress = await StorageModule.getProgress(currentBook.id);
            if (progress && progress.currentPage) {
                currentPage = progress.currentPage;
            }

            // Render
            await renderPage(currentPage);
            attachEventListeners();

            return true;
        } catch (error) {
            console.error('Error initializing PDF reader:', error);
            Utils.showToast('Failed to load PDF', 'error');
            return false;
        }
    };

    // Create reader structure
    const createReaderStructure = () => {
        const container = document.getElementById('readerContainer');
        container.innerHTML = `
            <div class="pdf-reader">
                <div class="reader-top-bar">
                    <div class="reader-top-bar-left">
                        <button class="reader-icon-button" id="pdfBack">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                    </div>
                    <div class="reader-top-bar-center">
                        <div class="reader-book-title">${currentBook.title}</div>
                    </div>
                    <div class="reader-top-bar-right">
                        <button class="reader-icon-button" id="pdfSettings">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="pdf-viewport" id="pdfViewport"></div>
                <div class="reader-bottom-bar">
                    <div class="reader-progress-bar">
                        <div class="reader-progress-fill"></div>
                    </div>
                    <div class="reader-controls">
                        <button class="reader-icon-button" id="pdfPrev">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <div class="reader-page-info" id="pdfPageInfo">1 / ${pageCount}</div>
                        <button class="reader-icon-button" id="pdfNext">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                        <button class="reader-icon-button" id="pdfZoomOut">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                        </button>
                        <span class="reader-page-info" id="pdfZoomLevel">100%</span>
                        <button class="reader-icon-button" id="pdfZoomIn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="reader-settings-panel" id="pdfSettingsPanel"></div>
                <div class="reader-overlay" id="readerOverlay"></div>
            </div>
        `;
    };

    // Render page
    const renderPage = async (pageNum) => {
        if (pageNum < 1 || pageNum > pageCount) return;

        currentPage = pageNum;
        const page = await pdfDoc.getPage(pageNum);
        const scale = currentZoom / 100;
        const viewport = page.getViewport({ scale });

        // Create canvas if not exists
        const viewport_element = document.getElementById('pdfViewport');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pdf-canvas';
            viewport_element.appendChild(canvas);
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx = canvas.getContext('2d');

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Update UI
        updateProgress();
        saveProgress();
    };

    // Update progress
    const updateProgress = () => {
        const progressPercent = (currentPage / pageCount) * 100;
        document.querySelector('.reader-progress-fill').style.width = progressPercent + '%';
        document.getElementById('pdfPageInfo').textContent = `${currentPage} / ${pageCount}`;
    };

    // Save progress
    const saveProgress = () => {
        StorageModule.saveProgress(currentBook.id, {
            bookId: currentBook.id,
            progress: (currentPage / pageCount) * 100,
            currentPage
        });
    };

    // Next page
    const nextPage = () => {
        if (currentPage < pageCount) {
            renderPage(currentPage + 1);
        }
    };

    // Previous page
    const prevPage = () => {
        if (currentPage > 1) {
            renderPage(currentPage - 1);
        }
    };

    // Zoom
    const zoomIn = () => {
        currentZoom = Math.min(200, currentZoom + 25);
        document.getElementById('pdfZoomLevel').textContent = currentZoom + '%';
        renderPage(currentPage);
    };

    const zoomOut = () => {
        currentZoom = Math.max(50, currentZoom - 25);
        document.getElementById('pdfZoomLevel').textContent = currentZoom + '%';
        renderPage(currentPage);
    };

    // Show settings
    const showSettings = () => {
        const panel = document.getElementById('pdfSettingsPanel');
        panel.innerHTML = `
            <div class="reader-settings-group">
                <label class="reader-settings-label">Display Mode</label>
                <div class="reader-settings-options">
                    <button class="reader-settings-option ${continuousMode ? 'active' : ''}" id="pdfContinuous">Continuous</button>
                    <button class="reader-settings-option ${!continuousMode ? 'active' : ''}" id="pdfSinglePage">Single</button>
                </div>
            </div>
            <div class="reader-settings-group">
                <label class="reader-settings-label">Zoom</label>
                <div class="reader-settings-options">
                    <button class="reader-settings-option" id="pdfFitWidth">Fit Width</button>
                    <button class="reader-settings-option" id="pdfFitPage">Fit Page</button>
                </div>
            </div>
        `;
        panel.classList.add('visible');

        document.getElementById('pdfContinuous')?.addEventListener('click', () => {
            continuousMode = true;
        });
        document.getElementById('pdfSinglePage')?.addEventListener('click', () => {
            continuousMode = false;
        });
    };

    // Attach event listeners
    const attachEventListeners = () => {
        document.getElementById('pdfBack')?.addEventListener('click', closeReader);
        document.getElementById('pdfNext')?.addEventListener('click', nextPage);
        document.getElementById('pdfPrev')?.addEventListener('click', prevPage);
        document.getElementById('pdfZoomIn')?.addEventListener('click', zoomIn);
        document.getElementById('pdfZoomOut')?.addEventListener('click', zoomOut);
        document.getElementById('pdfSettings')?.addEventListener('click', showSettings);

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'Escape') closeReader();
        });
    };

    // Close reader
    const closeReader = () => {
        ReaderModule.closeReader();
    };

    return {
        init,
        closeReader,
        nextPage,
        prevPage,
        zoomIn,
        zoomOut
    };
})();
