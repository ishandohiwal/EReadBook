/* ==========================================
   AuraRead - Library Module
   Manages book library and library view
   ========================================== */

const LibraryModule = (() => {
    let books = [];
    let filteredBooks = [];
    let currentFilter = 'all';
    let currentSort = 'recent';

    // Initialize library
    const init = async () => {
        await loadBooks();
        renderLibrary();
        attachEventListeners();
    };

    // Load books from storage
    const loadBooks = async () => {
        try {
            books = await StorageModule.getAllBooks();
            filteredBooks = books;
            return books;
        } catch (error) {
            console.error('Error loading books:', error);
            return [];
        }
    };

    // Add book
    const addBook = async (book) => {
        try {
            const savedBook = await StorageModule.saveBook(book);
            books.push(savedBook);
            applyFiltersAndSort();
            renderLibrary();
            return savedBook;
        } catch (error) {
            console.error('Error adding book:', error);
            throw error;
        }
    };

    // Get book by ID
    const getBook = async (bookId) => {
        return books.find(b => b.id === bookId);
    };

    // Delete book
    const deleteBook = async (bookId) => {
        try {
            // Delete associated data
            const bookmarks = await StorageModule.getBookmarks(bookId);
            const highlights = await StorageModule.getHighlights(bookId);
            const quotes = await StorageModule.getQuotesByBook(bookId);

            for (const bookmark of bookmarks) {
                await StorageModule.deleteBookmark(bookmark.id);
            }
            for (const highlight of highlights) {
                await StorageModule.deleteHighlight(highlight.id);
            }
            for (const quote of quotes) {
                await StorageModule.deleteQuote(quote.id);
            }

            // Delete progress
            await StorageModule.saveProgress(bookId, { bookId, progress: 0 });

            // Delete book
            await StorageModule.deleteBook(bookId);
            books = books.filter(b => b.id !== bookId);
            applyFiltersAndSort();
            renderLibrary();
            Utils.showToast('Book removed from library', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting book:', error);
            Utils.showToast('Failed to remove book', 'error');
            return false;
        }
    };

    // Apply filters
    const applyFiltersAndSort = () => {
        // Apply filter
        filteredBooks = books.filter(book => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'reading') return book.status === 'reading';
            if (currentFilter === 'unread') return book.status === 'unread';
            if (currentFilter === 'completed') return book.status === 'completed';
            if (currentFilter === 'epub') return book.format === 'epub';
            if (currentFilter === 'pdf') return book.format === 'pdf';
            return true;
        });

        // Apply sort
        filteredBooks.sort((a, b) => {
            switch(currentSort) {
                case 'recent':
                    return (b.lastOpened || 0) - (a.lastOpened || 0);
                case 'added':
                    return (b.dateAdded || 0) - (a.dateAdded || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'author':
                    return (a.author || '').localeCompare(b.author || '');
                case 'progress':
                    return (b.progress || 0) - (a.progress || 0);
                default:
                    return 0;
            }
        });
    };

    // Set filter
    const setFilter = (filter) => {
        currentFilter = filter;
        applyFiltersAndSort();
        renderLibrary();
    };

    // Set sort
    const setSort = (sort) => {
        currentSort = sort;
        applyFiltersAndSort();
        renderLibrary();
    };

    // Search books
    const searchBooks = (query) => {
        const q = query.toLowerCase();
        filteredBooks = books.filter(book => {
            return (
                (book.title && book.title.toLowerCase().includes(q)) ||
                (book.author && book.author.toLowerCase().includes(q))
            );
        });
        renderLibrary();
    };

    // Get continue reading books
    const getContinueReadingBooks = () => {
        return books
            .filter(b => b.status === 'reading' && b.progress > 0 && b.progress < 100)
            .sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0))
            .slice(0, 4);
    };

    // Render library
    const renderLibrary = () => {
        const libraryGrid = document.getElementById('libraryGrid');
        const continueContainer = document.getElementById('continueReadingContainer');
        const continueSection = document.getElementById('continueReading');
        const emptyState = document.getElementById('emptyState');

        // Clear grids
        libraryGrid.innerHTML = '';
        continueContainer.innerHTML = '';

        if (books.length === 0) {
            emptyState.style.display = 'block';
            continueSection.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';

        // Render continue reading
        const continueBooks = getContinueReadingBooks();
        if (continueBooks.length > 0) {
            continueSection.style.display = 'block';
            continueBooks.forEach(book => {
                continueContainer.appendChild(createBookCard(book));
            });
        } else {
            continueSection.style.display = 'none';
        }

        // Render library grid
        if (filteredBooks.length === 0) {
            libraryGrid.innerHTML = '<div class="empty-state"><p>No books found</p></div>';
            return;
        }

        filteredBooks.forEach(book => {
            libraryGrid.appendChild(createBookCard(book, true));
        });
    };

    // Create book card
    const createBookCard = (book, clickable = true) => {
        const card = Utils.createElement('div', 'book-card');
        
        const cover = Utils.createElement('div', 'book-cover');
        if (book.coverUrl) {
            const img = document.createElement('img');
            img.src = book.coverUrl;
            img.alt = book.title;
            cover.appendChild(img);
        } else {
            cover.innerHTML = `<span>📖</span>`;
        }
        card.appendChild(cover);

        const info = Utils.createElement('div', 'book-info');
        
        const title = Utils.createElement('div', 'book-title', book.title || 'Untitled');
        info.appendChild(title);

        const author = Utils.createElement('div', 'book-author', book.author || 'Unknown Author');
        info.appendChild(author);

        const progressBar = Utils.createElement('div', 'book-progress-bar');
        const progressFill = Utils.createElement('div', 'book-progress-fill');
        progressFill.style.width = `${book.progress || 0}%`;
        progressBar.appendChild(progressFill);
        info.appendChild(progressBar);

        const progressText = Utils.createElement('div', 'book-progress-text', `${Math.round(book.progress || 0)}%`);
        info.appendChild(progressText);

        card.appendChild(info);

        if (clickable) {
            card.addEventListener('click', () => {
                ReaderModule.openBook(book);
            });
        }

        return card;
    };

    // Attach event listeners
    const attachEventListeners = () => {
        // Filter
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                setFilter(e.target.value);
            });
        }

        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                setSort(e.target.value);
            });
        }

        // Search
        const searchInput = document.getElementById('librarySearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                if (e.target.value.trim()) {
                    searchBooks(e.target.value);
                } else {
                    applyFiltersAndSort();
                    renderLibrary();
                }
            }, 300));
        }

        // Import buttons
        const importButtons = document.querySelectorAll('#importButton, #emptyImportButton');
        importButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                ImportModule.showImportModal();
            });
        });
    };

    return {
        init,
        loadBooks,
        addBook,
        getBook,
        deleteBook,
        setFilter,
        setSort,
        searchBooks,
        getContinueReadingBooks,
        renderLibrary,
        getBooks: () => books,
        getFilteredBooks: () => filteredBooks
    };
})();
