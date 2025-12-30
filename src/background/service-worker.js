/**
 * AutoPrint Extension - Background Service Worker
 * Handles download detection and automatic printing
 */

import { loadSettings, addToPrintHistory, onSettingsChange } from '../shared/storage.js';
import { CONFIG, getNotificationIconUrl } from '../shared/config.js';

// Current settings cache
let currentSettings = null;
let isInitialized = false;

/**
 * Initialize the service worker
 */
async function initialize() {
  if (isInitialized) return;
  
  console.log('[AutoPrint] Service worker initializing...');
  
  try {
    // Load initial settings
    currentSettings = await loadSettings();
    console.log('[AutoPrint] Initial settings loaded:', currentSettings);
    
    // Listen for settings changes
    onSettingsChange((newSettings) => {
      console.log('[AutoPrint] Settings updated:', newSettings);
      currentSettings = newSettings;
      updateBadge();
    });
    
    // Update badge on startup
    updateBadge();
    
    isInitialized = true;
    console.log('[AutoPrint] Service worker initialized successfully');
  } catch (error) {
    console.error('[AutoPrint] Initialization error:', error);
  }
}

/**
 * Update the extension badge to show enabled/disabled status
 */
function updateBadge() {
  try {
    const badgeText = currentSettings?.enabled ? 'ON' : '';
    const badgeColor = currentSettings?.enabled ? '#22c55e' : '#6b7280';
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  } catch (error) {
    console.error('[AutoPrint] Badge update error:', error);
  }
}

/**
 * Extract filename from download item
 * @param {Object} downloadItem - Chrome download item
 * @returns {string} Filename
 */
function getFilename(downloadItem) {
  if (downloadItem.filename) {
    // Extract just the filename from the full path
    const parts = downloadItem.filename.split(/[/\\]/);
    return parts[parts.length - 1];
  }
  return '';
}

/**
 * Extract file extension from filename
 * @param {string} filename - Filename
 * @returns {string} Extension without dot, lowercase
 */
function getFileExtension(filename) {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return '';
}

/**
 * Check if a file matches the current filter settings
 * @param {string} filename - Filename to check
 * @returns {Object} Match result with details
 */
function checkFilters(filename) {
  const result = {
    matches: true,
    prefixMatch: true,
    extensionMatch: true,
    details: []
  };
  
  if (!currentSettings) {
    result.matches = false;
    result.details.push('Settings not loaded');
    return result;
  }
  
  const { prefixFilter, extensionFilter } = currentSettings;
  
  // Check prefix filter
  if (prefixFilter && prefixFilter.trim()) {
    result.prefixMatch = filename.toLowerCase().startsWith(prefixFilter.toLowerCase());
    if (!result.prefixMatch) {
      result.matches = false;
      result.details.push(`Prefix "${prefixFilter}" not matched`);
    }
  }
  
  // Check extension filter
  if (extensionFilter && extensionFilter.trim()) {
    const fileExt = getFileExtension(filename);
    const filterExt = extensionFilter.toLowerCase().replace(/^\./, '');
    result.extensionMatch = fileExt === filterExt;
    if (!result.extensionMatch) {
      result.matches = false;
      result.details.push(`Extension ".${filterExt}" not matched (file has ".${fileExt}")`);
    }
  }
  
  return result;
}

/**
 * Show a notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'success' or 'error'
 */
function showNotification(title, message, type = 'success') {
  if (!currentSettings?.showNotifications) {
    return;
  }
  
  try {
    const notificationId = type === 'success' 
      ? CONFIG.NOTIFICATIONS.PRINT_SUCCESS 
      : CONFIG.NOTIFICATIONS.PRINT_ERROR;
    
    chrome.notifications.create(notificationId + '_' + Date.now(), {
      type: 'basic',
      iconUrl: getNotificationIconUrl(),
      title: title,
      message: message,
      priority: 1
    });
  } catch (error) {
    console.error('[AutoPrint] Notification error:', error);
  }
}

/**
 * Print a downloaded file
 * @param {Object} downloadItem - Chrome download item
 * @returns {Promise<boolean>} Success status
 */
async function printFile(downloadItem) {
  const filename = getFilename(downloadItem);
  
  try {
    console.log('[AutoPrint] Attempting to print:', filename);
    console.log('[AutoPrint] File path:', downloadItem.filename);
    
    // Open the file in a new tab for printing
    const fileUrl = 'file://' + downloadItem.filename;
    
    // Create a tab with the file
    const tab = await chrome.tabs.create({ 
      url: fileUrl,
      active: false 
    });
    
    console.log('[AutoPrint] Tab created:', tab.id);
    
    // Wait for the tab to load
    await new Promise((resolve) => {
      const listener = (tabId, info) => {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout fallback
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 3000);
    });
    
    // Additional wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Execute print command
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.print();
        }
      });
      console.log('[AutoPrint] Print command executed');
    } catch (scriptError) {
      console.error('[AutoPrint] Script execution error:', scriptError);
      // Try alternative approach - just show notification that file is ready
      showNotification(
        'AutoPrint: File Ready',
        `"${filename}" opened for printing. Press Ctrl+P to print.`,
        'success'
      );
      return true;
    }
    
    // Log success
    await addToPrintHistory({
      filename: filename,
      fullPath: downloadItem.filename,
      status: 'printed',
      fileSize: downloadItem.fileSize
    });
    
    showNotification(
      'AutoPrint: File Sent to Printer',
      `"${filename}" has been sent to the printer.`,
      'success'
    );
    
    // Close the tab after a delay to allow print dialog
    setTimeout(() => {
      chrome.tabs.remove(tab.id).catch(() => {
        // Tab might already be closed
      });
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('[AutoPrint] Error printing file:', error);
    
    try {
      await addToPrintHistory({
        filename: filename,
        fullPath: downloadItem.filename,
        status: 'error',
        error: error.message
      });
    } catch (historyError) {
      console.error('[AutoPrint] History error:', historyError);
    }
    
    showNotification(
      'AutoPrint: Print Failed',
      `Failed to print "${filename}": ${error.message}`,
      'error'
    );
    
    return false;
  }
}

/**
 * Handle download state changes
 * @param {Object} delta - Download delta object
 */
async function handleDownloadChanged(delta) {
  console.log('[AutoPrint] Download changed:', delta);
  
  // We only care about completed downloads
  if (!delta.state || delta.state.current !== 'complete') {
    return;
  }
  
  // Ensure we're initialized
  if (!isInitialized) {
    await initialize();
  }
  
  // Check if extension is enabled
  if (!currentSettings?.enabled) {
    console.log('[AutoPrint] Extension disabled, ignoring download');
    return;
  }
  
  try {
    // Get the full download item
    const downloads = await chrome.downloads.search({ id: delta.id });
    if (downloads.length === 0) {
      console.error('[AutoPrint] Download not found:', delta.id);
      return;
    }
    
    const downloadItem = downloads[0];
    const filename = getFilename(downloadItem);
    
    console.log('[AutoPrint] Download completed:', filename);
    
    // Check filters
    const filterResult = checkFilters(filename);
    
    if (!filterResult.matches) {
      console.log('[AutoPrint] File does not match filters:', filterResult.details.join(', '));
      return;
    }
    
    console.log('[AutoPrint] File matches filters, initiating print');
    
    // Print the file
    await printFile(downloadItem);
    
  } catch (error) {
    console.error('[AutoPrint] Error handling download:', error);
  }
}

// Register download listener
chrome.downloads.onChanged.addListener(handleDownloadChanged);

// Initialize on service worker start
initialize();

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[AutoPrint] Extension installed/updated:', details.reason);
  
  // Re-initialize
  initialize();
  
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Keep service worker alive by listening to messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AutoPrint] Message received:', message);
  
  if (message.type === 'getStatus') {
    sendResponse({
      enabled: currentSettings?.enabled || false,
      initialized: isInitialized
    });
  }
  
  return true;
});

// Export for testing (if needed)
export { checkFilters, getFilename, getFileExtension };
