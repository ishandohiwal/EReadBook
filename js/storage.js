/* ==========================================
   AuraRead - Storage Module
   Handles all local persistence using IndexedDB
   ========================================== */

const StorageModule = (() => {
    const DB_NAME = 'AuraReadDB';
    const DB_VERSION = 1;
    let db = null;

    // Store names
    const STORES = {
        books: 'books',
        progress: 'progress',
        bookmarks: 'bookmarks',
        highlights: 'highlights',
        quotes: 'quotes',
        settings: 'settings',
        statistics: 'statistics'
    };

    // Initialize database
    const init = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                // Books store
                if (!database.objectStoreNames.contains(STORES.books)) {
                    database.createObjectStore(STORES.books, { keyPath: 'id' });
                }

                // Progress store
                if (!database.objectStoreNames.contains(STORES.progress)) {
                    database.createObjectStore(STORES.progress, { keyPath: 'bookId' });
                }

                // Bookmarks store
                if (!database.objectStoreNames.contains(STORES.bookmarks)) {
                    const bookmarkStore = database.createObjectStore(STORES.bookmarks, { keyPath: 'id', autoIncrement: true });
                    bookmarkStore.createIndex('bookId', 'bookId', { unique: false });
                }

                // Highlights store
                if (!database.objectStoreNames.contains(STORES.highlights)) {
                    const highlightStore = database.createObjectStore(STORES.highlights, { keyPath: 'id', autoIncrement: true });
                    highlightStore.createIndex('bookId', 'bookId', { unique: false });
                }

                // Quotes store
                if (!database.objectStoreNames.contains(STORES.quotes)) {
                    const quoteStore = database.createObjectStore(STORES.quotes, { keyPath: 'id', autoIncrement: true });
                    quoteStore.createIndex('bookId', 'bookId', { unique: false });
                }

                // Settings store
                if (!database.objectStoreNames.contains(STORES.settings)) {
                    database.createObjectStore(STORES.settings, { keyPath: 'key' });
                }

                // Statistics store
                if (!database.objectStoreNames.contains(STORES.statistics)) {
                    database.createObjectStore(STORES.statistics, { keyPath: 'key' });
                }
            };
        });
    };

    // Transaction helper
    const transaction = (storeNames, mode = 'readonly') => {
        return db.transaction(storeNames, mode);
    };

    // Books
    const saveBook = (book) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.books, 'readwrite');
            const store = tx.objectStore(STORES.books);
            const request = store.put(book);
            request.onsuccess = () => resolve(book);
            request.onerror = () => reject(request.error);
        });
    };

    const getBook = (bookId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.books);
            const store = tx.objectStore(STORES.books);
            const request = store.get(bookId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const getAllBooks = () => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.books);
            const store = tx.objectStore(STORES.books);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const deleteBook = (bookId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.books, 'readwrite');
            const store = tx.objectStore(STORES.books);
            const request = store.delete(bookId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    // Progress
    const saveProgress = (bookId, progress) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.progress, 'readwrite');
            const store = tx.objectStore(STORES.progress);
            const data = {
                bookId,
                ...progress,
                lastSaved: new Date().toISOString()
            };
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    };

    const getProgress = (bookId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.progress);
            const store = tx.objectStore(STORES.progress);
            const request = store.get(bookId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    };

    // Bookmarks
    const saveBookmark = (bookmark) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.bookmarks, 'readwrite');
            const store = tx.objectStore(STORES.bookmarks);
            const data = {
                ...bookmark,
                createdAt: new Date().toISOString()
            };
            const request = store.add(data);
            request.onsuccess = () => resolve({ ...data, id: request.result });
            request.onerror = () => reject(request.error);
        });
    };

    const getBookmarks = (bookId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.bookmarks);
            const store = tx.objectStore(STORES.bookmarks);
            const index = store.index('bookId');
            const request = index.getAll(bookId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const deleteBookmark = (bookmarkId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.bookmarks, 'readwrite');
            const store = tx.objectStore(STORES.bookmarks);
            const request = store.delete(bookmarkId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    // Highlights
    const saveHighlight = (highlight) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.highlights, 'readwrite');
            const store = tx.objectStore(STORES.highlights);
            const data = {
                ...highlight,
                createdAt: new Date().toISOString()
            };
            const request = store.add(data);
            request.onsuccess = () => resolve({ ...data, id: request.result });
            request.onerror = () => reject(request.error);
        });
    };

    const getHighlights = (bookId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.highlights);
            const store = tx.objectStore(STORES.highlights);
            const index = store.index('bookId');
            const request = index.getAll(bookId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const deleteHighlight = (highlightId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.highlights, 'readwrite');
            const store = tx.objectStore(STORES.highlights);
            const request = store.delete(highlightId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    // Quotes
    const saveQuote = (quote) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.quotes, 'readwrite');
            const store = tx.objectStore(STORES.quotes);
            const data = {
                ...quote,
                createdAt: new Date().toISOString()
            };
            const request = store.add(data);
            request.onsuccess = () => resolve({ ...data, id: request.result });
            request.onerror = () => reject(request.error);
        });
    };

    const getAllQuotes = () => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.quotes);
            const store = tx.objectStore(STORES.quotes);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const getQuotesByBook = (bookId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.quotes);
            const store = tx.objectStore(STORES.quotes);
            const index = store.index('bookId');
            const request = index.getAll(bookId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const deleteQuote = (quoteId) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.quotes, 'readwrite');
            const store = tx.objectStore(STORES.quotes);
            const request = store.delete(quoteId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    // Settings
    const saveSetting = (key, value) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.settings, 'readwrite');
            const store = tx.objectStore(STORES.settings);
            const request = store.put({ key, value });
            request.onsuccess = () => resolve(value);
            request.onerror = () => reject(request.error);
        });
    };

    const getSetting = (key) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.settings);
            const store = tx.objectStore(STORES.settings);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value || null);
            request.onerror = () => reject(request.error);
        });
    };

    const getAllSettings = () => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.settings);
            const store = tx.objectStore(STORES.settings);
            const request = store.getAll();
            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    };

    // Statistics
    const saveStatistic = (key, value) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.statistics, 'readwrite');
            const store = tx.objectStore(STORES.statistics);
            const request = store.put({ key, value });
            request.onsuccess = () => resolve(value);
            request.onerror = () => reject(request.error);
        });
    };

    const getStatistic = (key) => {
        return new Promise((resolve, reject) => {
            const tx = transaction(STORES.statistics);
            const store = tx.objectStore(STORES.statistics);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value || null);
            request.onerror = () => reject(request.error);
        });
    };

    // Export data
    const exportData = async () => {
        const [books, progress, bookmarks, highlights, quotes, settings, statistics] = await Promise.all([
            getAllBooks(),
            new Promise(resolve => {
                const tx = transaction(STORES.progress);
                const store = tx.objectStore(STORES.progress);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
            }),
            new Promise(resolve => {
                const tx = transaction(STORES.bookmarks);
                const store = tx.objectStore(STORES.bookmarks);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
            }),
            new Promise(resolve => {
                const tx = transaction(STORES.highlights);
                const store = tx.objectStore(STORES.highlights);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
            }),
            getAllQuotes(),
            getAllSettings(),
            new Promise(resolve => {
                const tx = transaction(STORES.statistics);
                const store = tx.objectStore(STORES.statistics);
                const request = store.getAll();
                request.onsuccess = () => {
                    const stats = {};
                    request.result.forEach(item => {
                        stats[item.key] = item.value;
                    });
                    resolve(stats);
                };
            })
        ]);

        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            books: books.map(b => ({ ...b, file: undefined })),
            progress,
            bookmarks,
            highlights,
            quotes,
            settings,
            statistics
        };
    };

    // Import data
    const importData = async (data) => {
        try {
            if (data.books) {
                for (const book of data.books) {
                    await saveBook(book);
                }
            }
            if (data.progress) {
                for (const prog of data.progress) {
                    await saveProgress(prog.bookId, prog);
                }
            }
            if (data.bookmarks) {
                for (const bookmark of data.bookmarks) {
                    await saveBookmark(bookmark);
                }
            }
            if (data.highlights) {
                for (const highlight of data.highlights) {
                    await saveHighlight(highlight);
                }
            }
            if (data.quotes) {
                for (const quote of data.quotes) {
                    await saveQuote(quote);
                }
            }
            if (data.settings) {
                for (const [key, value] of Object.entries(data.settings)) {
                    await saveSetting(key, value);
                }
            }
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    };

    // Clear all data
    const clearAll = () => {
        return new Promise((resolve, reject) => {
            const tx = transaction(
                Object.values(STORES),
                'readwrite'
            );

            let completed = 0;
            const onSuccess = () => {
                completed++;
                if (completed === Object.values(STORES).length) {
                    resolve();
                }
            };

            Object.values(STORES).forEach(storeName => {
                const store = tx.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = onSuccess;
                request.onerror = () => reject(request.error);
            });
        });
    };

    return {
        init,
        // Books
        saveBook,
        getBook,
        getAllBooks,
        deleteBook,
        // Progress
        saveProgress,
        getProgress,
        // Bookmarks
        saveBookmark,
        getBookmarks,
        deleteBookmark,
        // Highlights
        saveHighlight,
        getHighlights,
        deleteHighlight,
        // Quotes
        saveQuote,
        getAllQuotes,
        getQuotesByBook,
        deleteQuote,
        // Settings
        saveSetting,
        getSetting,
        getAllSettings,
        // Statistics
        saveStatistic,
        getStatistic,
        // Data
        exportData,
        importData,
        clearAll
    };
})();
