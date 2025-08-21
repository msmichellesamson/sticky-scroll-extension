
# Sticky Scroll Chrome Extension

A Chrome extension with **two powerful modes** for keeping important content visible while browsing. Perfect for reading long documents, PDFs, research, and comparing information across different parts of a page.

## ✨ Two Modes

### 📝 Sticky Notes Mode
Create **draggable floating notes** that copy content from any element on the page. Perfect for:
- Taking quick notes while reading
- Keeping reference information visible
- Comparing content from different parts of a page

### 📌 Sticky Scroll Mode  
Pin elements **to the top of your viewport** while the rest of the page scrolls underneath - just like function headers in code editors! Perfect for:
- Keeping headings visible while reading long sections
- Pinning important paragraphs during research
- Maintaining context while scrolling through documents

## Features

- 🎯 **Dual Mode System**: Choose between floating notes or top-pinned elements
- 🖱️ **Easy Selection**: Hover and click interface with visual highlighting
- 🖱️ **Drag & Drop**: Move sticky notes anywhere on screen
- 📏 **Smart Management**: Individual close buttons and clear all options
- 🌐 **Universal**: Works on all websites including PDFs
- 📱 **Responsive**: Adapts to different screen sizes
- 🎨 **Visual Indicators**: See which elements are pinned with emoji badges

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the folder containing the extension files
5. The extension will appear in your extensions list

### Method 2: Create Icons (Required)

Before installing, you need to add icon files to the `icons/` folder:

1. Create 4 icon files with these exact names:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels) 
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. You can:
   - Use an online icon generator
   - Create simple PNG files with a pin emoji (📌)
   - Download from icon websites like [Icons8](https://icons8.com) or [Flaticon](https://flaticon.com)

## How to Use

### Basic Usage

1. **Activate Selection Mode**:
   - Click the 🎯 button in the control panel (top-right corner)
   - OR click the extension icon and press "Toggle Selection Mode"

2. **Choose Your Mode**:
   - **📝 Sticky Notes**: Creates draggable floating notes
   - **📌 Sticky Scroll**: Pins elements to the top of the page

3. **Select an Element**:
   - Hover over any element on the page (it will highlight in green)
   - Click the element to pin it in your chosen mode

4. **Manage Elements**:
   - **Sticky Notes**: Drag, minimize, or close individual notes
   - **Sticky Scroll**: Elements appear at top of page with close buttons
   - **Clear All**: Use the extension popup or "Clear All" buttons
   - **Exit Selection**: Press ESC or click the 🎯 button again

### Extension Popup

Click the extension icon in Chrome's toolbar to access:

- View number of currently pinned elements
- Toggle selection mode on/off
- Clear all pinned elements at once
- View usage instructions

### Keyboard Shortcuts

- **ESC**: Exit selection mode
- **Ctrl/Cmd + Space**: Toggle selection mode (when popup is open)
- **Ctrl/Cmd + Delete**: Clear all pins (when popup is open)

## Use Cases

### 📝 Sticky Notes Mode
- **Research**: Copy important quotes or references into floating notes
- **Comparison**: Create multiple notes to compare information side-by-side
- **Note-taking**: Extract key points and keep them visible while reading
- **Learning**: Copy definitions or explanations for quick reference

### 📌 Sticky Scroll Mode
- **Reading Long Documents**: Keep section headers visible while scrolling through content
- **Code Review**: Pin function signatures at top while reading implementation
- **PDF Reading**: Keep important paragraphs pinned while exploring other sections
- **Article Reading**: Pin key statements while scrolling through supporting details
- **Form Filling**: Keep instructions visible while scrolling through long forms

## Technical Details

### Files Structure

```
sticky_scroll_extension/
├── manifest.json          # Extension configuration
├── content.js            # Main functionality script
├── content.css           # Styling for pinned elements
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── icons/                # Extension icons (you need to add these)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Permissions

The extension requests minimal permissions:

- `activeTab`: To interact with the current webpage
- `storage`: To save user preferences (planned for future versions)

### Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)
- Does not work in Firefox (uses Manifest V3)

## Development

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension card
4. Reload any open webpages to see changes

### Debugging

- Open Chrome DevTools on any webpage to see content script logs
- Right-click the extension popup and select "Inspect" to debug popup code
- Check `chrome://extensions/` for any error messages

## Troubleshooting

### Extension Not Working

1. **Refresh the page**: Content scripts only load when the page loads
2. **Check permissions**: Make sure the extension has access to the current site
3. **Reload extension**: Go to `chrome://extensions/` and reload the extension

### Elements Not Pinning

1. **Try a different element**: Some elements may have click event conflicts
2. **Check for errors**: Open DevTools and look for JavaScript errors
3. **Exit and re-enter selection mode**: Press ESC and try again

### Styling Issues

1. **Some websites may override styles**: The extension tries to use `!important` rules
2. **Try pinning a different element**: Some elements may not display well when pinned

## Planned Features

- 📄 **PDF Support**: Better integration with PDF viewers
- 💾 **Persistent Pins**: Save pins across page reloads
- 🎨 **Custom Styling**: User-configurable pin appearance
- ⌨️ **Global Shortcuts**: System-wide keyboard shortcuts
- 📱 **Mobile Support**: Better responsive design
- 🔗 **Pin Sharing**: Share pinned content between devices

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License - Feel free to modify and distribute.

---

**Made with ❤️ for better browsing experiences**

