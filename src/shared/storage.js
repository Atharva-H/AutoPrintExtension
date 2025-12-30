/**
 * AutoPrint Extension - Storage Manager
 * Handles all chrome.storage operations with cross-browser compatibility
 */

import { CONFIG, validateSettings, getDefaultSettings } from './config.js';

/**
 * Get the storage API (works for Chrome and other browsers)
 * @returns {Object} Browser storage API
 */
function getStorageAPI() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local;
  }
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage.local;
  }
  throw new Error('No compatible storage API found');
}

/**
 * Load settings from storage
 * @returns {Promise<Object>} Current settings
 */
export async function loadSettings() {
  try {
    const storage = getStorageAPI();
    const result = await storage.get(CONFIG.STORAGE_KEYS.SETTINGS);
    const settings = result[CONFIG.STORAGE_KEYS.SETTINGS] || {};
    return validateSettings(settings);
  } catch (error) {
    console.error('[AutoPrint] Error loading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save settings to storage
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    const storage = getStorageAPI();
    const validatedSettings = validateSettings(settings);
    await storage.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: validatedSettings });
    console.log('[AutoPrint] Settings saved:', validatedSettings);
    return validatedSettings;
  } catch (error) {
    console.error('[AutoPrint] Error saving settings:', error);
    throw error;
  }
}

/**
 * Update specific settings without overwriting others
 * @param {Object} partialSettings - Partial settings to update
 * @returns {Promise<Object>} Updated settings
 */
export async function updateSettings(partialSettings) {
  const currentSettings = await loadSettings();
  const newSettings = { ...currentSettings, ...partialSettings };
  return saveSettings(newSettings);
}

/**
 * Load print history
 * @returns {Promise<Array>} Print history array
 */
export async function loadPrintHistory() {
  try {
    const storage = getStorageAPI();
    const result = await storage.get(CONFIG.STORAGE_KEYS.PRINT_HISTORY);
    return result[CONFIG.STORAGE_KEYS.PRINT_HISTORY] || [];
  } catch (error) {
    console.error('[AutoPrint] Error loading print history:', error);
    return [];
  }
}

/**
 * Add item to print history
 * @param {Object} item - History item to add
 * @returns {Promise<void>}
 */
export async function addToPrintHistory(item) {
  try {
    const settings = await loadSettings();
    const history = await loadPrintHistory();
    
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item
    };
    
    history.unshift(newItem);
    
    // Trim history if it exceeds max items
    while (history.length > settings.maxHistoryItems) {
      history.pop();
    }
    
    const storage = getStorageAPI();
    await storage.set({ [CONFIG.STORAGE_KEYS.PRINT_HISTORY]: history });
    
    return newItem;
  } catch (error) {
    console.error('[AutoPrint] Error adding to print history:', error);
    throw error;
  }
}

/**
 * Clear print history
 * @returns {Promise<void>}
 */
export async function clearPrintHistory() {
  try {
    const storage = getStorageAPI();
    await storage.set({ [CONFIG.STORAGE_KEYS.PRINT_HISTORY]: [] });
  } catch (error) {
    console.error('[AutoPrint] Error clearing print history:', error);
    throw error;
  }
}

/**
 * Listen for storage changes
 * @param {Function} callback - Callback function for changes
 * @returns {Function} Unsubscribe function
 */
export function onSettingsChange(callback) {
  const listener = (changes, areaName) => {
    if (areaName === 'local' && changes[CONFIG.STORAGE_KEYS.SETTINGS]) {
      const newSettings = validateSettings(changes[CONFIG.STORAGE_KEYS.SETTINGS].newValue);
      callback(newSettings);
    }
  };
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener(listener);
  } else if (typeof browser !== 'undefined' && browser.storage) {
    browser.storage.onChanged.addListener(listener);
  }
  
  return () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.removeListener(listener);
    } else if (typeof browser !== 'undefined' && browser.storage) {
      browser.storage.onChanged.removeListener(listener);
    }
  };
}

