# Gesture Mapper - Input Configuration System

## Overview
A comprehensive web-based configuration management system for designing, testing, and exporting gesture mappings and input profiles for gaming peripherals. This application serves as a frontend control center for hardware middleware integration.

## Purpose
- Configure multiple gaming input devices (Azeron Cyborg, keyboards with SharpKeys, Razer MMO mouse, Swiftpoint mouse, FSR pressure sensors)
- Design and test gesture patterns (single/double/triple/quadruple press, long press, cancel-and-hold)
- Create visual input-to-action mappings for game controls
- Export profiles as JSON/JavaScript config files for middleware integration
- Real-time gesture simulation and timing visualization

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **UI**: Shadcn UI + Tailwind CSS
- **State**: React Query + Local Storage
- **Backend**: Express.js + In-memory storage
- **Styling**: Inter font (UI), JetBrains Mono (code/technical)

## Project Structure

### Frontend Components
- **AppSidebar**: Navigation with device list and profile selector
- **Device Configurations**: Individual panels for each device type (keyboard, Azeron, Razer, Swiftpoint, FSR)
- **GestureSettings**: Fine-tune timing windows and detection thresholds
- **GestureSimulator**: Real-time pattern testing with timeline visualizer
- **MappingDesigner**: Visual input-to-action binding system
- **ProfileExport/Import**: JSON/JavaScript config file management
- **ThemeToggle**: Light/dark mode support

### Data Models
- **Profile**: Complete configuration including all devices, gesture settings, and mappings
- **Device Configs**: Keyboard, Azeron, RazerMMO, Swiftpoint, FSRSensor
- **GestureSettings**: Timing parameters for pattern detection
- **InputMapping**: Device input → game action bindings

## Key Features

### Device Support
1. **Keyboard** - Complete keyboard coverage (79 keys total):
   - All letters (A-Z) - 26 keys
   - All numbers (0-9) - 10 keys
   - All punctuation (` ~ ! @ # $ % ^ & * ( ) - _ = + [ ] { } \ | ; : ' " , . < > / ?) - 11 keys
   - Special keys (Space, Enter, Tab, Backspace, Delete, Escape, Caps Lock) - 7 keys
   - Function keys (F1-F12) - 12 keys
   - Navigation (Arrows, Home, End, Page Up/Down, Insert) - 9 keys
   - Modifiers (Ctrl, Shift, Alt, Win/Cmd - for toggle system) - 4 keys
   - SharpKeys registry remapping detection
2. **Azeron Cyborg** - 29-button gaming keypad with thumbpad
3. **Razer MMO Mouse** - 12 programmable side buttons with DPI stages
4. **Swiftpoint Mouse** - Advanced tilt sensor configuration
5. **FSR Sensors** - Analog pressure-sensitive input

### Gesture Detection
- Single press (< 150ms)
- Double press (within 350ms window)
- Triple press
- Quadruple press
- Long press (150-500ms hold, optimized for human timing)
- Cancel-and-hold pattern
- Debounce filtering (10ms) for switch bounce elimination

### Testing & Visualization
- Real-time gesture simulator using keyboard input (SPACE key)
- Timeline visualizer showing last 1000ms of events
- Detection window zones overlay
- Event history log with millisecond precision
- Debug mode with comprehensive console logging
- Visual feedback for active gesture detection windows
- Ref-based architecture preventing stale closures

## Recent Updates (November 16, 2025)

### ✅ Phase 3: Enhanced Modifier Toggle System (Completed)
- **ModifierContext** - Two-layer state management (profile defaults + runtime state)
- **ModifierToggle Component** - Individual toggles + 7 quick mode presets (Normal, Ctrl, Shift, Alt, Ctrl+Shift, Ctrl+Alt, Shift+Alt)
- **Save/Reset UX** - Explicit Save as Default button, Reset to defaults
- **UI Integration** - Embedded in Test Gestures tab, status pill in Mapping Designer header
- **Legal Compliance** - Like Windows Sticky Keys, maintains 1:1 input/output ratio
- **State Synchronization** - Auto-hydrates from profile defaults, prevents drift

### ✅ Phase 4: Hold Timer Visualization (Completed)
- **Real-time Progress Bar** - 0-2000ms scale with smooth transitions
- **Threshold Markers** - Visual indicators at 150ms (long press min), 500ms, 1000ms
- **Color Transitions** - Orange (0-150ms) → Yellow (150-500ms) → Green (500-1000ms) → Blue (1000ms+)
- **Dark Mode Support** - Tailwind tokens for proper contrast in light/dark themes
- **Performance** - Optimized interval cleanup, 10ms update rate

### ✅ Complete Keyboard Coverage Added
- Expanded from 10 keys to **79 comprehensive keyboard keys**
- Organized by category: Letters, Numbers, Punctuation, Special, Function, Navigation, Modifiers
- Tab-based interface: "Keyboard" tab (all 79 keys) + "Devices" tab (Azeron, Razer, etc.)
- Compact display for efficient space usage

### ✅ Legal Compliance Framework Established
- **docs/LEGAL_COMPLIANCE.md** - Complete legal framework following Azeron/Swiftpoint model
- **docs/MODIFIER_TOGGLE_LEGAL.md** - Modifier toggle system (like Windows Sticky Keys)
- **middleware/README.md** - Implementation guide with compliance safeguards
- 1:1 input/output ratio enforcement architecture designed
- Anti-cheat compliance strategy documented (Vanguard, EAC, BattlEye)

## Development Status

### ✅ Completed - Configuration Frontend with Four Legal Hold Mechanics
**Phase 1: Charge-Release Gesture System**
- Charge bar visualization (0-100% charge level)
- Configurable hold window (300ms-2000ms default)
- Real-time charge tracking during hold
- Released charge level display
- 1:1 ratio compliance (one hold+release cycle → one output with charge metadata)

**Phase 2: Rapid-Tap Analytics**
- TPS (Taps Per Second) tracking with 1-second rolling window
- Peak TPS recording
- Tap interval visualization (last 10 taps)
- Average interval calculation
- Detection-only design (no automation, no turbo mode)
- First-interval overflow bug fixed

**Phase 3: Enhanced Modifier Toggle System**
- ModifierContext with two-layer state (defaults + runtime)
- Individual modifier toggles (Ctrl, Shift, Alt)
- 7 quick mode presets (Normal, Ctrl, Shift, Alt, combinations)
- Save as Default / Reset functionality
- Embedded in Test Gestures tab
- Status pill in Mapping Designer header
- Legal compliance like Windows Sticky Keys

**Phase 4: Hold Timer Visualization**
- Real-time progress bar (0-2000ms scale)
- Threshold markers at 150ms, 500ms, 1000ms
- Color transitions (Orange → Yellow → Green → Blue)
- Dark mode support with Tailwind tokens
- Optimized 10ms update rate with proper cleanup

**Core Features:**
- Complete data schema and TypeScript interfaces
- Design system configuration (fonts, colors, spacing)
- All device configuration panels (Keyboard, Azeron, Razer, Swiftpoint, FSR)
- **Complete keyboard key coverage (79 keys)** - Letters, numbers, punctuation, special, function, navigation, modifiers
- Gesture settings interface with timing controls
- Real-time gesture simulator with debug mode
- Timeline visualizer with 1000ms event history
- Input mapping designer with drag-and-drop
- Categorized keyboard input selection (organized by key type)
- Profile export/import (JSON/JavaScript)
- Sidebar navigation with profile selector
- Theme toggle (light/dark mode)
- Local storage persistence
- Backend API with CRUD operations
- Gesture detection engine (single/double/triple/quad/long press/charge-release)
- Debounce filtering and stale closure prevention

### 🚧 Next Phase: Hardware Middleware Integration (See MIDDLEWARE_ROADMAP.md)
**Phase 0 - Architecture Decisions (Current)**
- Choose runtime environment (Browser WebHID vs Electron vs Native)
- Research anti-cheat policies for target games
- Document architecture decisions
- Plan raw input capture strategy

**Phase 1 - Raw Input Capture MVP**
- Windows Raw Input API integration
- Keyboard/mouse event capture (<10ms latency)
- Device identification (VID/PID)
- Event dispatcher pipeline

**Phase 2 - Device Parsers & Translation**
- SharpKeys registry reader and scancode translation
- Azeron Cyborg HID protocol parser
- Razer MMO mouse parser
- Swiftpoint tilt sensor parser
- FSR analog sensor integration (USB HID or Serial)

**Phase 3 - Anti-Cheat Compliance**
- 1:1 input/output ratio validation
- Audit trail logging
- Macro detection prevention
- Game-specific certification

**Phase 4 - Cross-Platform Support**
- Linux libevdev integration
- macOS IOHIDManager support
- Deployment and packaging

### Future Enhancements (Post-Middleware)
- Profile versioning and rollback
- Advanced macro builder (anti-cheat compliant)
- FSR calibration wizard
- Conflict detection for overlapping patterns
- Usage analytics dashboard
- WebSocket server for live hardware monitoring

## Design Guidelines
- **Typography**: Inter (400-700) for UI, JetBrains Mono for technical values
- **Spacing**: Tailwind units (2, 3, 4, 6, 8)
- **Colors**: Professional blue primary (hsl(217 91% 48%)) with high information density
- **Layout**: Sidebar (20rem) + Main content (flex-1)
- **Interaction**: Smooth transitions, subtle hover/active elevations
- **Accessibility**: Full keyboard navigation, clear focus states

## User Workflows

1. **Profile Management**
   - Create new profile or select existing
   - Mark profiles as favorites
   - Import/export profiles

2. **Device Configuration**
   - Enable/disable individual devices
   - Configure device-specific parameters
   - Adjust gesture timing settings

3. **Gesture Testing**
   - Use simulator to test pattern detection
   - View timeline of events
   - Validate timing windows

4. **Input Mapping**
   - Create input-to-action bindings
   - Assign gesture types to inputs
   - Manage mapping priorities

5. **Export for Middleware**
   - Export as JSON or JavaScript
   - Copy to clipboard or download file
   - Ready for hardware integration

## Notes
- Profiles stored in localStorage for persistence
- All timing values in milliseconds
- SharpKeys compatibility detects Windows registry key remapping
- Gesture simulator uses SPACE key for testing
- Export format compatible with planned middleware integration
