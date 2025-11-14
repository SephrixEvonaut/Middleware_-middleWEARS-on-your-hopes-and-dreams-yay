# Design Guidelines: Gesture Mapping Configuration System

## Design Approach
**System-Based Approach** drawing from technical productivity tools:
- **Primary Reference**: Linear (clean, technical precision)
- **Secondary**: Figma (configuration/design tools), Material Design (structured forms)
- **Principles**: Information density, visual hierarchy through structure, real-time feedback clarity, technical precision

## Typography

**Font Family**: Inter (via Google Fonts CDN)
- **Headings**: 600 weight for section titles, 500 for subsections
- **Body**: 400 weight for standard text, 500 for emphasis
- **Code/Technical**: Mono font for timing values, keybindings (JetBrains Mono)

**Scale**:
- Panel Headers: text-lg (18px)
- Section Titles: text-base (16px)
- Body/Labels: text-sm (14px)
- Technical Data: text-xs (12px)
- Large Display Values: text-2xl for timing readouts

## Layout System

**Spacing Units**: Tailwind units of 2, 3, 4, 6, 8
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Tight groupings: gap-2 to gap-3
- Panel margins: m-4 or m-6

**Grid Structure**:
- Main layout: Sidebar (280px fixed) + Main Content (flex-1)
- Configuration panels: 2-column grid on desktop (grid-cols-2), single column on mobile
- Device cards: 3-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

## Core Components

### Navigation & Structure
**Left Sidebar**:
- Fixed navigation panel with device list
- Active state indicators for selected device
- Profile selector at top
- Export/Import actions at bottom

**Main Content Area**:
- Tabbed interface for: Configure | Test | Export
- Breadcrumb navigation showing current device/section
- Action bar with Save/Reset buttons (top right)

### Device Configuration Panels
**Panel Cards**:
- Bordered containers with header + content sections
- Device icon + name in header
- Enable/disable toggle (top right of card)
- Collapsible sections for advanced settings
- Input groups with labels + controls arranged vertically

**Form Controls**:
- Range sliders for timing values (with numeric readout)
- Number inputs with increment/decrement buttons
- Dropdown selects for device-specific options
- Toggle switches for boolean settings
- Color-coded status indicators (enabled/disabled/active)

### Gesture Pattern Simulator
**Timeline Visualizer**:
- Horizontal timeline showing 0-1000ms range
- Vertical bars representing press events
- Shaded zones showing detection windows
- Real-time cursor following simulated input
- Millisecond markers every 100ms

**Pattern Display**:
- Large central area showing current gesture state
- Press count indicator (1x, 2x, 3x, 4x badges)
- Timer display showing hold duration
- Visual feedback animations (pulse on detection)

**Testing Controls**:
- Keyboard event simulator (spacebar or custom key)
- Mouse click simulator
- Reset/Clear history button
- Pattern history log (last 10 gestures)

### Mapping Designer
**Visual Builder**:
- Left column: Available inputs (draggable chips)
- Center area: Mapping connections (flow diagram)
- Right column: Game actions (drop targets)
- Connection lines showing active mappings
- Delete/edit buttons on hover over connections

**Input Chips**:
- Device icon + button label
- Gesture type badge (single/double/long)
- Drag handle indicator

**Action Cards**:
- Game action name + description
- Currently mapped input display
- Priority/order indicator for multi-bindings

### Profile Management
**Profile Selector**:
- Dropdown with profile names
- Star icon for favorited profiles
- Duplicate/Delete actions
- "New Profile" button prominent

**Export Interface**:
- Format selection (JSON/JavaScript)
- Preview code block with syntax highlighting
- Copy to clipboard button
- Download file button
- Shareable URL generator

### Status & Feedback
**Toast Notifications**:
- Success: Profile saved
- Warning: Invalid timing configuration
- Error: Export failed
- Info: SharpKeys conflict detected

**Live Indicators**:
- Device connection status dots
- Active gesture detection badge
- Configuration validation checkmarks
- Unsaved changes indicator

## Images
**No hero images needed** - this is a utility application focused on functionality. Use icons throughout:
- Device icons for Azeron, keyboard, mouse types
- Gesture pattern icons (press types)
- Action/ability icons (generic gaming icons)
- Status icons (checkmarks, warnings, info)

Use **Heroicons** via CDN for all interface icons.

## Special Considerations
- **High information density**: Multiple panels visible simultaneously
- **Real-time updates**: Smooth transitions for timing visualization (60fps target)
- **Technical precision**: Monospace fonts for all numeric/timing values
- **Accessibility**: Keyboard navigation between all configuration fields, clear focus states
- **Responsive**: Sidebar collapses to hamburger menu on mobile, panels stack vertically