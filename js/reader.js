/* ==========================================
   AuraRead - Main Reader Module
   Orchestrates reader experience
   ========================================== */

const ReaderModule = (() => {
    let currentBook = null;
    let currentReader = null;
    let isReaderOpen = false;

    // Open book
    const openBook = async (book) => {
        try {
            currentBook = book;
            const container = document.getElementById('readerContainer');
            const mainContent = document.getElementById('mainContent');

            // Show reader
            container.style.display = 'block';
            mainContent.style.display = 'none';
            isReaderOpen = true;

            // Update last opened
            book.lastOpened = Date.now();
            book.status = 'reading';
            await StorageModule.saveBook(book);

            // Load file
            const fileData = book.fileData;
            if (!fileData) {
                throw new Error('Book file data not found');
            }

            // Initialize reader based on format
            if (book.format === 'epub') {
                const settings = await StorageModule.getAllSettings();
                await EPUBReaderModule.init(fileData, book, settings);
            } else if (book.format === 'pdf') {
                const settings = await StorageModule.getAllSettings();
                await PDFReaderModule.init(fileData, book, settings);
            }

            Utils.showToast(`Reading: ${book.title}`, 'info');
            return true;
        } catch (error) {
            console.error('Error opening book:', error);
            Utils.showToast('Failed to open book', 'error');
            closeReader();
            return false;
        }
    };

    // Close reader
    const closeReader = () => {
        const container = document.getElementById('readerContainer');
        const mainContent = document.getElementById('mainContent');

        container.style.display = 'none';
        mainContent.style.display = 'block';
        isReaderOpen = false;
        currentBook = null;

        // Stop any audio
        TTSModule.stop();

        // Trigger library refresh
        LibraryModule.renderLibrary();
    };

    // Get current book
    const getCurrentBook = () => currentBook;

    // Check if reader is open
    const isOpen = () => isReaderOpen;

    return {
        openBook,
        closeReader,
        getCurrentBook,
        isOpen
    };
})();
