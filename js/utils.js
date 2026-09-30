/* ==========================================
   AuraRead - Utilities Module
   Helper functions and common utilities
   ========================================== */

const Utils = (() => {
    // Toast notifications
    const showToast = (message, type = 'info', duration = 3000) => {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = getIcon(type);
        toast.innerHTML = `${icon}<span>${message}</span>`;
        
        container.appendChild(toast);
        
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    };

    const getIcon = (type) => {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
        };
        return icons[type] || icons.info;
    };

    // Generate unique ID
    const generateId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Format bytes to readable size
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
    };

    // Format time duration
    const formatDuration = (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    // Format reading time
    const formatReadingTime = (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        
        if (hours === 0) return `${minutes}m`;
        return `${hours}h ${minutes}m`;
    };

    // Parse time string to milliseconds
    const parseTime = (timeStr) => {
        const parts = timeStr.match(/(\d+)([dhms])/g);
        if (!parts) return 0;
        
        let ms = 0;
        parts.forEach(part => {
            const match = part.match(/(\d+)([dhms])/);
            const value = parseInt(match[1]);
            const unit = match[2];
            
            switch(unit) {
                case 'd': ms += value * 24 * 60 * 60 * 1000; break;
                case 'h': ms += value * 60 * 60 * 1000; break;
                case 'm': ms += value * 60 * 1000; break;
                case 's': ms += value * 1000; break;
            }
        });
        return ms;
    };

    // Debounce function
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Throttle function
    const throttle = (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // Deep clone object
    const deepClone = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    };

    // Check if device is mobile
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Check if device is touch
    const isTouch = () => {
        return () => false;
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {
            return false;
        }
    };

    // Detect dark mode
    const isDarkMode = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    // Detect reduced motion preference
    const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    // Extract text from element
    const getElementText = (element) => {
        return element.innerText || element.textContent || '';
    };

    // Create element helper
    const createElement = (tag, className = '', innerHTML = '') => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    };

    // Add event listener with automatic cleanup
    const on = (element, event, handler) => {
        if (!element) return () => {};
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    };

    // Query selector helper
    const query = (selector, parent = document) => {
        return parent.querySelector(selector);
    };

    const queryAll = (selector, parent = document) => {
        return parent.querySelectorAll(selector);
    };

    // Get scroll position
    const getScrollPosition = (element = window) => {
        if (element === window) {
            return {
                x: window.scrollX || document.documentElement.scrollLeft,
                y: window.scrollY || document.documentElement.scrollTop
            };
        }
        return {
            x: element.scrollLeft,
            y: element.scrollTop
        };
    };

    // Set scroll position
    const setScrollPosition = (x, y, element = window) => {
        if (element === window) {
            window.scrollTo(x, y);
        } else {
            element.scrollLeft = x;
            element.scrollTop = y;
        }
    };

    // Smooth scroll to element
    const smoothScroll = (element, options = {}) => {
        const {
            top = 0,
            behavior = 'smooth'
        } = options;

        element.scrollIntoView({
            behavior,
            block: 'start'
        });
    };

    // Check if element is in viewport
    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // Clipboard operations
    const copyToClipboard = (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                return Promise.resolve();
            } catch (error) {
                return Promise.reject(error);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    // Download file
    const downloadFile = (content, filename, type = 'text/plain') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Read file as
    const readFileAs = (file, type = 'text') => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            
            if (type === 'text') {
                reader.readAsText(file);
            } else if (type === 'binary') {
                reader.readAsArrayBuffer(file);
            } else if (type === 'data') {
                reader.readAsDataURL(file);
            }
        });
    };

    // Format date
    const formatDate = (date, format = 'short') => {
        const d = new Date(date);
        const options = {
            short: { month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        return d.toLocaleDateString('en-US', options[format]);
    };

    // Time since
    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        
        return Math.floor(seconds) + "s ago";
    };

    // Array helpers
    const chunk = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };

    const unique = (array) => {
        return [...new Set(array)];
    };

    const flatten = (array) => {
        return array.reduce((flat, item) => {
            return flat.concat(Array.isArray(item) ? flatten(item) : item);
        }, []);
    };

    // Wait/delay
    const wait = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // Retry logic
    const retry = async (fn, attempts = 3, delay = 1000) => {
        for (let i = 0; i < attempts; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === attempts - 1) throw error;
                await wait(delay);
            }
        }
    };

    // Check storage support
    const isStorageSupported = (type = 'localStorage') => {
        try {
            const storage = window[type];
            const test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Keyboard helpers
    const isKeyPressed = (event, key) => {
        return event.key === key || event.code === key;
    };

    const isModifierPressed = (event, modifier) => {
        const modifiers = {
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey
        };
        return modifiers[modifier] || false;
    };

    return {
        showToast,
        generateId,
        formatBytes,
        formatDuration,
        formatReadingTime,
        parseTime,
        debounce,
        throttle,
        deepClone,
        isMobile,
        isTouch,
        isDarkMode,
        prefersReducedMotion,
        getElementText,
        createElement,
        on,
        query,
        queryAll,
        getScrollPosition,
        setScrollPosition,
        smoothScroll,
        isInViewport,
        copyToClipboard,
        downloadFile,
        readFileAs,
        formatDate,
        timeSince,
        chunk,
        unique,
        flatten,
        wait,
        retry,
        isStorageSupported,
        isKeyPressed,
        isModifierPressed
    };
})();
