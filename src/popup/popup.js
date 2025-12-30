/**
 * AutoPrint Extension - Popup Script
 * Handles popup UI interactions and settings management
 */

import { loadSettings, saveSettings } from '../shared/storage.js';

// DOM Elements
const elements = {
  enableToggle: document.getElementById('enableToggle'),
  statusIndicator: document.getElementById('statusIndicator'),
  prefixFilter: document.getElementById('prefixFilter'),
  extensionFilter: document.getElementById('extensionFilter'),
  clearPrefix: document.getElementById('clearPrefix'),
  clearExtension: document.getElementById('clearExtension'),
  filterPreview: document.getElementById('filterPreview'),
  previewSection: document.getElementById('previewSection'),
  saveBtn: document.getElementById('saveBtn'),
  saveStatus: document.getElementById('saveStatus'),
  settingsBtn: document.getElementById('settingsBtn')
};

// Current settings state
let currentSettings = null;

/**
 * Initialize the popup
 */
async function initialize() {
  try {
    // Load current settings
    currentSettings = await loadSettings();
    
    // Apply settings to UI
    applySettingsToUI(currentSettings);
    
    // Set up event listeners
    setupEventListeners();
    
    // Update preview
    updatePreview();
    
    console.log('[AutoPrint Popup] Initialized with settings:', currentSettings);
  } catch (error) {
    console.error('[AutoPrint Popup] Initialization error:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Apply settings to UI elements
 * @param {Object} settings - Settings object
 */
function applySettingsToUI(settings) {
  elements.enableToggle.checked = settings.enabled;
  elements.prefixFilter.value = settings.prefixFilter || '';
  elements.extensionFilter.value = settings.extensionFilter || '';
  
  updateStatusIndicator(settings.enabled);
}

/**
 * Update the status indicator
 * @param {boolean} enabled - Whether extension is enabled
 */
function updateStatusIndicator(enabled) {
  const statusText = elements.statusIndicator.querySelector('.status-text');
  
  if (enabled) {
    elements.statusIndicator.classList.add('active');
    statusText.textContent = 'Active';
  } else {
    elements.statusIndicator.classList.remove('active');
    statusText.textContent = 'Disabled';
  }
}

/**
 * Update the filter preview text
 */
function updatePreview() {
  const prefix = elements.prefixFilter.value.trim();
  const extension = elements.extensionFilter.value.trim().replace(/^\./, '');
  
  let previewText = '';
  
  if (!prefix && !extension) {
    previewText = 'Printing all downloaded files';
  } else if (prefix && !extension) {
    previewText = `Printing files starting with "${prefix}"`;
  } else if (!prefix && extension) {
    previewText = `Printing all .${extension} files`;
  } else {
    previewText = `Printing .${extension} files starting with "${prefix}"`;
  }
  
  elements.filterPreview.textContent = previewText;
}

/**
 * Show save status message
 * @param {string} message - Status message
 * @param {string} type - 'success' or 'error'
 */
function showStatus(message, type = 'success') {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = 'save-status ' + type;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    elements.saveStatus.textContent = '';
    elements.saveStatus.className = 'save-status';
  }, 3000);
}

/**
 * Get current form values as settings object
 * @returns {Object} Settings from form
 */
function getFormSettings() {
  return {
    enabled: elements.enableToggle.checked,
    prefixFilter: elements.prefixFilter.value.trim(),
    extensionFilter: elements.extensionFilter.value.trim().replace(/^\./, ''),
    showNotifications: currentSettings?.showNotifications ?? true,
    maxHistoryItems: currentSettings?.maxHistoryItems ?? 100
  };
}

/**
 * Save current settings
 */
async function handleSave() {
  try {
    elements.saveBtn.disabled = true;
    
    const settings = getFormSettings();
    await saveSettings(settings);
    currentSettings = settings;
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('[AutoPrint Popup] Save error:', error);
    showStatus('Failed to save settings', 'error');
  } finally {
    elements.saveBtn.disabled = false;
  }
}

/**
 * Handle toggle change with auto-save
 */
async function handleToggleChange() {
  const enabled = elements.enableToggle.checked;
  updateStatusIndicator(enabled);
  
  // Auto-save when toggling
  try {
    const settings = getFormSettings();
    await saveSettings(settings);
    currentSettings = settings;
    showStatus(enabled ? 'AutoPrint enabled' : 'AutoPrint disabled', 'success');
  } catch (error) {
    console.error('[AutoPrint Popup] Toggle save error:', error);
    // Revert toggle on error
    elements.enableToggle.checked = !enabled;
    updateStatusIndicator(!enabled);
    showStatus('Failed to update', 'error');
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Toggle change with auto-save
  elements.enableToggle.addEventListener('change', handleToggleChange);
  
  // Filter input changes
  elements.prefixFilter.addEventListener('input', updatePreview);
  elements.extensionFilter.addEventListener('input', updatePreview);
  
  // Clear buttons
  elements.clearPrefix.addEventListener('click', () => {
    elements.prefixFilter.value = '';
    updatePreview();
    elements.prefixFilter.focus();
  });
  
  elements.clearExtension.addEventListener('click', () => {
    elements.extensionFilter.value = '';
    updatePreview();
    elements.extensionFilter.focus();
  });
  
  // Save button
  elements.saveBtn.addEventListener('click', handleSave);
  
  // Settings button - open options page
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Save on Enter key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSave();
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

