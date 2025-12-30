/**
 * AutoPrint Extension - Options Page Script
 * Handles advanced settings configuration
 */

import { loadSettings, saveSettings, loadPrintHistory, clearPrintHistory } from '../shared/storage.js';

// DOM Elements
const elements = {
  enableToggle: document.getElementById('enableToggle'),
  notificationsToggle: document.getElementById('notificationsToggle'),
  prefixFilter: document.getElementById('prefixFilter'),
  extensionFilter: document.getElementById('extensionFilter'),
  filterPreview: document.getElementById('filterPreview'),
  maxHistory: document.getElementById('maxHistory'),
  viewHistoryBtn: document.getElementById('viewHistoryBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  historyCard: document.getElementById('historyCard'),
  historyTableBody: document.getElementById('historyTableBody'),
  saveBtn: document.getElementById('saveBtn'),
  saveStatus: document.getElementById('saveStatus')
};

// Current settings
let currentSettings = null;

/**
 * Initialize the options page
 */
async function initialize() {
  try {
    currentSettings = await loadSettings();
    applySettingsToUI(currentSettings);
    setupEventListeners();
    updatePreview();
    console.log('[AutoPrint Options] Initialized:', currentSettings);
  } catch (error) {
    console.error('[AutoPrint Options] Init error:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Apply settings to UI
 */
function applySettingsToUI(settings) {
  elements.enableToggle.checked = settings.enabled;
  elements.notificationsToggle.checked = settings.showNotifications;
  elements.prefixFilter.value = settings.prefixFilter || '';
  elements.extensionFilter.value = settings.extensionFilter || '';
  elements.maxHistory.value = settings.maxHistoryItems || 100;
}

/**
 * Update filter preview
 */
function updatePreview() {
  const prefix = elements.prefixFilter.value.trim();
  const extension = elements.extensionFilter.value.trim().replace(/^\./, '');
  
  let text = '';
  
  if (!prefix && !extension) {
    text = 'Printing all downloaded files';
  } else if (prefix && !extension) {
    text = `Printing files starting with "${prefix}"`;
  } else if (!prefix && extension) {
    text = `Printing all .${extension} files`;
  } else {
    text = `Printing .${extension} files starting with "${prefix}"`;
  }
  
  elements.filterPreview.textContent = text;
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = 'save-status ' + type;
  
  setTimeout(() => {
    elements.saveStatus.textContent = '';
    elements.saveStatus.className = 'save-status';
  }, 3000);
}

/**
 * Get settings from form
 */
function getFormSettings() {
  return {
    enabled: elements.enableToggle.checked,
    showNotifications: elements.notificationsToggle.checked,
    prefixFilter: elements.prefixFilter.value.trim(),
    extensionFilter: elements.extensionFilter.value.trim().replace(/^\./, ''),
    maxHistoryItems: parseInt(elements.maxHistory.value, 10) || 100
  };
}

/**
 * Save settings
 */
async function handleSave() {
  try {
    elements.saveBtn.disabled = true;
    const settings = getFormSettings();
    await saveSettings(settings);
    currentSettings = settings;
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('[AutoPrint Options] Save error:', error);
    showStatus('Failed to save settings', 'error');
  } finally {
    elements.saveBtn.disabled = false;
  }
}

/**
 * Toggle history view
 */
async function toggleHistoryView() {
  const isHidden = elements.historyCard.style.display === 'none';
  
  if (isHidden) {
    await loadHistoryTable();
    elements.historyCard.style.display = 'block';
    elements.viewHistoryBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12A18.45 18.45 0 0 1 5.06 5.06" stroke="currentColor" stroke-width="2"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
      </svg>
      Hide History
    `;
  } else {
    elements.historyCard.style.display = 'none';
    elements.viewHistoryBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      </svg>
      View History
    `;
  }
}

/**
 * Load history into table
 */
async function loadHistoryTable() {
  try {
    const history = await loadPrintHistory();
    
    if (history.length === 0) {
      elements.historyTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state">No print history yet</td>
        </tr>
      `;
      return;
    }
    
    elements.historyTableBody.innerHTML = history.map(item => `
      <tr>
        <td><code>${escapeHtml(item.filename)}</code></td>
        <td>
          <span class="status-badge ${item.status}">
            ${item.status === 'printed' ? '✓ Printed' : '✗ Error'}
          </span>
        </td>
        <td>${formatDate(item.timestamp)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('[AutoPrint Options] Load history error:', error);
  }
}

/**
 * Clear history with confirmation
 */
async function handleClearHistory() {
  if (!confirm('Are you sure you want to clear all print history?')) {
    return;
  }
  
  try {
    await clearPrintHistory();
    await loadHistoryTable();
    showStatus('History cleared', 'success');
  } catch (error) {
    console.error('[AutoPrint Options] Clear history error:', error);
    showStatus('Failed to clear history', 'error');
  }
}

/**
 * Escape HTML for safe rendering
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  elements.prefixFilter.addEventListener('input', updatePreview);
  elements.extensionFilter.addEventListener('input', updatePreview);
  elements.saveBtn.addEventListener('click', handleSave);
  elements.viewHistoryBtn.addEventListener('click', toggleHistoryView);
  elements.clearHistoryBtn.addEventListener('click', handleClearHistory);
  
  // Auto-save on toggle changes
  elements.enableToggle.addEventListener('change', handleSave);
  elements.notificationsToggle.addEventListener('change', handleSave);
}

// Initialize
document.addEventListener('DOMContentLoaded', initialize);

