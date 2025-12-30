/**
 * AutoPrint Extension - Shared Configuration
 * Central configuration and constants for the extension
 */

export const CONFIG = {
  // Storage keys
  STORAGE_KEYS: {
    ENABLED: 'autoprint_enabled',
    PREFIX_FILTER: 'autoprint_prefix_filter',
    EXTENSION_FILTER: 'autoprint_extension_filter',
    PRINT_HISTORY: 'autoprint_history',
    SETTINGS: 'autoprint_settings'
  },

  // Default settings
  DEFAULTS: {
    enabled: false,
    prefixFilter: '',
    extensionFilter: '',
    showNotifications: true,
    maxHistoryItems: 100
  },

  // Notification settings
  NOTIFICATIONS: {
    PRINT_SUCCESS: 'autoprint_success',
    PRINT_ERROR: 'autoprint_error'
  },

  // Supported file extensions for printing
  PRINTABLE_EXTENSIONS: [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'rtf', 'odt', 'ods', 'odp', 'csv',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
    'html', 'htm', 'xml', 'json'
  ]
};

/**
 * Get the notification icon URL (must be called at runtime)
 * @returns {string} Icon URL
 */
export function getNotificationIconUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL('assets/icons/icon-128.png');
  }
  return 'assets/icons/icon-128.png';
}

/**
 * Get default settings object
 * @returns {Object} Default settings
 */
export function getDefaultSettings() {
  return { ...CONFIG.DEFAULTS };
}

/**
 * Validate settings object
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validated settings with defaults for missing fields
 */
export function validateSettings(settings) {
  const defaults = getDefaultSettings();
  
  return {
    enabled: typeof settings?.enabled === 'boolean' ? settings.enabled : defaults.enabled,
    prefixFilter: typeof settings?.prefixFilter === 'string' ? settings.prefixFilter.trim() : defaults.prefixFilter,
    extensionFilter: typeof settings?.extensionFilter === 'string' ? settings.extensionFilter.trim().toLowerCase().replace(/^\./, '') : defaults.extensionFilter,
    showNotifications: typeof settings?.showNotifications === 'boolean' ? settings.showNotifications : defaults.showNotifications,
    maxHistoryItems: typeof settings?.maxHistoryItems === 'number' ? settings.maxHistoryItems : defaults.maxHistoryItems
  };
}
