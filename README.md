# Smart Tile

**WinTile** brings **Windows 10–style window snapping and tiling** to your GNOME desktop.  
Quickly organize and resize windows using familiar shortcuts — **Super + Arrow Keys** — to snap windows to halves or corners of your screen.

## Features

- **Snap windows with Super + Arrow Keys** — just like in Windows 10  
- **Half and corner tiling** for efficient multitasking  
- **Multi-monitor support** — windows snap on the active display  

## Installation

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/samuelnovaes/smart-tiling
cd smart-tiling
npm ci
```

### 2. Build the aextension

```bash
npm run build
```

### 3. Install the extension

```bash
gnome-extensions install smarttiling@samuelnovaes.zip
```

### 4. Restart GNOME Shell session

### 5. Enable the extension in the [GNOME Extensions App](https://flathub.org/en/apps/org.gnome.Extensions)

### 5. Enjoy!
