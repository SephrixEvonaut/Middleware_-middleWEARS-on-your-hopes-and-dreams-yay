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
1. **Keyboard** - Standard keyboard with SharpKeys registry remapping detection
2. **Azeron Cyborg** - 29-button gaming keypad with thumbpad
3. **Razer MMO Mouse** - 12 programmable side buttons with DPI stages
4. **Swiftpoint Mouse** - Advanced tilt sensor configuration
5. **FSR Sensors** - Analog pressure-sensitive input

### Gesture Detection
- Single press (< 80ms)
- Double press (within 300-500ms window)
- Triple press
- Quadruple press
- Long press (80-140ms hold)
- Cancel-and-hold pattern

### Testing & Visualization
- Real-time gesture simulator using keyboard input (SPACE key)
- Timeline visualizer showing last 1000ms of events
- Detection window zones overlay
- Event history log with millisecond precision

## Development Status

### Completed (Phase 1 - Frontend)
✅ Complete data schema and TypeScript interfaces
✅ Design system configuration (fonts, colors, spacing)
✅ All device configuration panels
✅ Gesture settings interface
✅ Real-time gesture simulator with timeline
✅ Input mapping designer
✅ Profile export/import functionality
✅ Sidebar navigation
✅ Theme toggle (light/dark mode)
✅ Local storage persistence

### In Progress
- Backend API implementation
- Profile CRUD operations
- Data validation and persistence

### Future Enhancements
- WebSocket server for live hardware communication
- Profile versioning and rollback
- Advanced macro builder
- FSR calibration wizard
- Conflict detection for overlapping patterns
- Usage analytics dashboard

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
