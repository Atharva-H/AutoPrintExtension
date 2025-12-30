# AutoPrint - Chrome Extension

> 🖨️ Automatically print downloaded files based on configurable filename prefix and extension filters

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Auto-Print Downloads**: Automatically print files as they finish downloading
- **Prefix Filtering**: Only print files that start with a specific prefix (e.g., `invoice_`, `report-`)
- **Extension Filtering**: Only print files with specific extensions (e.g., `.pdf`, `.docx`)
- **Combined Filters**: Use both prefix AND extension filters together
- **Toggle Control**: Easily enable/disable auto-printing with one click
- **Print History**: Track all automatically printed files
- **Desktop Notifications**: Get notified when files are printed
- **Cross-Browser Ready**: Built with compatibility layer for Firefox/Edge support

## 📋 Requirements

- Google Chrome 88 or later (Manifest V3 support)
- Node.js 16+ (for development/building icons)

## 🚀 Quick Start

### Installation (Development Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AutoPrintExtension.git
   cd AutoPrintExtension
   ```

2. **Generate icon files** (optional, for custom icons)
   ```bash
   node scripts/generate-icons.js
   # Then convert the SVG files to PNG using any image converter
   ```

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `AutoPrintExtension` folder

4. **Configure the extension**
   - Click the AutoPrint icon in your browser toolbar
   - Toggle the extension ON
   - Set your desired prefix and/or extension filters
   - Click **Save Settings**

## 📖 Usage Guide

### Basic Usage

1. **Enable the extension** by clicking the toggle in the popup
2. **Download any file** - if it matches your filters, it will automatically be sent to your default printer

### Filter Configuration

| Setting | Example | Description |
|---------|---------|-------------|
| Prefix Filter | `invoice_` | Only print files starting with "invoice_" |
| Extension Filter | `pdf` | Only print PDF files |
| Both Filters | `report-` + `xlsx` | Only print Excel files starting with "report-" |
| No Filters | *(empty)* | Print ALL downloaded files |

### Examples

| Downloaded File | Prefix: `inv_` | Ext: `pdf` | Both | Prints? |
|-----------------|----------------|------------|------|---------|
| `inv_2024.pdf` | ✅ | ✅ | ✅ | Yes |
| `inv_2024.docx` | ✅ | ❌ | ❌ | Depends |
| `report.pdf` | ❌ | ✅ | ❌ | Depends |
| `random.txt` | ❌ | ❌ | ❌ | Only if no filters |

## 🏗️ Project Structure

```
AutoPrintExtension/
├── manifest.json              # Extension manifest (Manifest V3)
├── README.md                  # This file
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background service worker
│   ├── popup/
│   │   ├── popup.html         # Popup UI
│   │   ├── popup.css          # Popup styles
│   │   └── popup.js           # Popup logic
│   ├── options/
│   │   ├── options.html       # Options page
│   │   ├── options.css        # Options styles
│   │   └── options.js         # Options logic
│   └── shared/
│       ├── config.js          # Shared configuration
│       └── storage.js         # Storage management
├── assets/
│   └── icons/                 # Extension icons
└── scripts/
    └── generate-icons.js      # Icon generation script
```

## 🔧 Development

### Prerequisites

```bash
# Clone the repo
git clone https://github.com/yourusername/AutoPrintExtension.git
cd AutoPrintExtension
```

### Making Changes

1. Edit the source files in `src/`
2. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the AutoPrint extension card

### Building for Production

The extension is ready to use as-is. For production deployment:

1. **Create icons** - Convert SVG icons to PNG:
   ```bash
   # Using ImageMagick
   convert assets/icons/icon-16.svg assets/icons/icon-16.png
   convert assets/icons/icon-32.svg assets/icons/icon-32.png
   convert assets/icons/icon-48.svg assets/icons/icon-48.png
   convert assets/icons/icon-128.svg assets/icons/icon-128.png
   ```

2. **Update manifest** - Add icons back to manifest.json:
   ```json
   "icons": {
     "16": "assets/icons/icon-16.png",
     "32": "assets/icons/icon-32.png",
     "48": "assets/icons/icon-48.png",
     "128": "assets/icons/icon-128.png"
   }
   ```

3. **Package the extension**:
   - Go to `chrome://extensions/`
   - Click **Pack extension**
   - Select the extension directory
   - This generates a `.crx` file

## 🌐 Deploying to Chrome Web Store

1. **Create a developer account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Pay the one-time $5 registration fee

2. **Prepare your package**
   - Create a ZIP file of your extension directory (excluding `.git`)
   ```bash
   zip -r autoprint-extension.zip . -x "*.git*" -x "*.DS_Store" -x "node_modules/*"
   ```

3. **Upload to Chrome Web Store**
   - Click "New Item" in the developer dashboard
   - Upload your ZIP file
   - Fill in the required details:
     - Description
     - Screenshots (1280x800 or 640x400)
     - Category: Productivity
     - Language

4. **Submit for review**
   - Review typically takes 1-3 business days
   - Once approved, your extension will be live

## 🦊 Firefox Support

To port this extension to Firefox:

1. **Update manifest.json**:
   ```json
   {
     "manifest_version": 2,
     "browser_specific_settings": {
       "gecko": {
         "id": "autoprint@yourdomain.com"
       }
     }
   }
   ```

2. **Update API calls** - The storage.js already includes browser compatibility

3. **Test in Firefox**:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the manifest.json file

## 🐛 Troubleshooting

### Extension not printing files

1. **Check if extension is enabled** - Look for "ON" badge on the extension icon
2. **Verify filter settings** - Ensure your filters match the downloaded files
3. **Check Chrome permissions** - The extension needs access to file:// URLs
4. **Try a PDF file first** - These are most reliably printable

### Print dialog not appearing

1. **Allow file access**:
   - Go to `chrome://extensions/`
   - Click "Details" on AutoPrint
   - Enable "Allow access to file URLs"

2. **Check popup blocker** - The extension opens files in new tabs to print

### Files printing multiple times

- This shouldn't happen, but if it does, disable and re-enable the extension

## 📄 API Reference

### Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `autoprint_settings` | Object | Main settings object |
| `autoprint_history` | Array | Print history items |

### Settings Object

```javascript
{
  enabled: boolean,           // Is auto-print enabled
  prefixFilter: string,       // Filename prefix filter
  extensionFilter: string,    // File extension filter (without dot)
  showNotifications: boolean, // Show desktop notifications
  maxHistoryItems: number     // Max history items to keep
}
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome Extensions documentation
- Manifest V3 migration guide
- The open-source community

---

**Made with ❤️ for automatic printing**
