/**
 * AutoPrint Extension - Background Service Worker
 * Handles download detection and automatic printing
 */

import { loadSettings, addToPrintHistory, onSettingsChange } from '../shared/storage.js';
import { CONFIG } from '../shared/config.js';

// Current settings cache
let currentSettings = null;

/**
 * Initialize the service worker
 */
async function initialize() {
  console.log('[AutoPrint] Service worker initializing...');
  
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
  
  console.log('[AutoPrint] Service worker initialized');
}

/**
 * Update the extension badge to show enabled/disabled status
 */
function updateBadge() {
  const badgeText = currentSettings?.enabled ? 'ON' : '';
  const badgeColor = currentSettings?.enabled ? '#22c55e' : '#6b7280';
  
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
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
  
  const notificationId = type === 'success' 
    ? CONFIG.NOTIFICATIONS.PRINT_SUCCESS 
    : CONFIG.NOTIFICATIONS.PRINT_ERROR;
  
  chrome.notifications.create(notificationId + '_' + Date.now(), {
    type: 'basic',
    iconUrl: CONFIG.NOTIFICATIONS.ICON_URL,
    title: title,
    message: message,
    priority: 1
  });
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
    
    // Open the file in a new tab for printing
    // Chrome doesn't have a direct API to print files, so we open them and trigger print
    const fileUrl = 'file://' + downloadItem.filename;
    
    // Create a tab with the file
    const tab = await chrome.tabs.create({ 
      url: fileUrl,
      active: false 
    });
    
    // Wait a bit for the file to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Execute print command
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.print();
      }
    });
    
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
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('[AutoPrint] Error printing file:', error);
    
    await addToPrintHistory({
      filename: filename,
      fullPath: downloadItem.filename,
      status: 'error',
      error: error.message
    });
    
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
  // We only care about completed downloads
  if (!delta.state || delta.state.current !== 'complete') {
    return;
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
  
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Export for testing (if needed)
export { checkFilters, getFilename, getFileExtension };

