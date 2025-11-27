# Gesture Mapper - Input Configuration System

## Overview
Gesture Mapper is a web-based configuration management system for designing, testing, and exporting gesture mappings and input profiles for gaming peripherals. It acts as a frontend control center for hardware middleware integration, allowing users to configure multiple input devices, create visual input-to-action mappings, and export profiles for use with custom middleware. The project aims to provide precise control over gaming inputs, enhancing user experience and competitive performance.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application is built with React, Vite, and TypeScript for the frontend, utilizing Shadcn UI and Tailwind CSS for a professional and highly customizable user interface. State management is handled with React Query and local storage for persistence. An Express.js backend with in-memory storage supports profile management.

Key UI/UX decisions include using the Inter font for UI elements and JetBrains Mono for technical values, a professional blue primary color scheme, and a layout featuring a 20rem sidebar and flexible main content area. The design emphasizes high information density, smooth transitions, and accessibility with full keyboard navigation.

The system supports a wide range of input devices including keyboards (79 keys), Azeron Cyborg, Razer MMO Mouse, Swiftpoint Mouse, and FSR pressure sensors. It features a sophisticated gesture detection engine capable of identifying single, double, triple, quadruple, long press, and cancel-and-hold patterns, with debounce filtering and dynamic wait windows.

Core features include:
- **Device Configuration Panels**: Dedicated interfaces for each supported device type.
- **Gesture Settings**: Fine-grained control over timing parameters for gesture detection.
- **Gesture Simulator**: Real-time testing with a timeline visualizer, event history, and debug mode.
- **Mapping Designer**: Visual system for binding device inputs to game actions with modifier-aware mapping identity.
- **Profile Management**: Creation, selection, import, and export of configuration profiles (JSON/JavaScript).
- **Modifier Toggle System**: Two-layer state management for modifiers (Ctrl, Shift, Alt) with presets and legal compliance.
- **Modifier-Aware Mapping System**: Each mapping includes a `modifierHash` field that identifies which modifier combination was active when the mapping was created. Supports all 8 modifier combinations: normal, ctrl, shift, alt, ctrl_shift, ctrl_alt, shift_alt, ctrl_shift_alt. This allows the same physical input + gesture to map to different outputs depending on modifier mode.
- **Hold Timer Visualization**: Real-time progress bar for hold duration with color-coded thresholds.
- **Practice Range**: Inline timing controls with MS-precision sliders, timing presets (Competitive, Balanced, Learning), and real-time statistics (attempts, successes, accuracy).
- **SWTOR Keybind Export System**: Generates valid SWTOR KeyBindings XML files with modifier-mode filtering. Each modifier mode exports independently with unique safe key assignments. Validates that only 68 "bare naked keys" (excludes Alt/Shift/Ctrl/Win/Tab/Caps/Esc/Del/PrtScrn/Enter/Backspace/Insert) are used in final outputs for anti-cheat compliance.
- **Sequence Builder**: UI for creating macro sequences with precise timing controls:
  - Per-step min/max delay configuration (enforces 25ms minimum, 4ms variance)
  - Echo hits (repetitions) per key (max 6 per key)
  - Maximum 4 unique keys per sequence
  - Visual timeline showing keypress sequence
  - Global timing defaults with "Apply to All" functionality
  - Validation prevents export of invalid sequences
  - Export to JSON format for Local Macro Agent
- **Ability Registry**: Centralized management of game abilities with:
  - Canonical name + aliases for input normalization (typos, nicknames → canonical name)
  - Category and description fields for organization
  - Keybind assignment with conflict detection (visual indicators when multiple abilities share the same key)
  - Profile-level ability selection: each profile can pick which ability is "active" for each conflicting keybind
  - Search and filter by name, alias, category, or assigned key
  - Full CRUD operations via REST API (/api/abilities endpoints)

The architecture is designed for 1:1 input/output ratio compliance, essential for anti-cheat systems. **Critical requirement fulfilled**: Modifiers operate at detection layer only - final game inputs never contain Alt/Shift/Ctrl to prevent interference with game keybinds.

## Local Macro Agent

A standalone Node.js application in `local-macro-agent/` that runs on the user's gaming PC:

**Features:**
- 22 input keys for gesture detection (WASD, B, I, T, C, H, Y, U, P, 1-6, mouse buttons)
- 9 gesture types: single, long, double, double_long, triple, triple_long, quadruple_long, super_long, cancel
- Per-key isolated gesture state machines
- Human-like timing with configurable min/max delays and randomization
- Sequence constraints: min 25ms delay, 4ms+ variance, max 4 unique keys, max 6 repeats per key
- **Multi-backend support**: RobotJS, Interception Driver, or Mock

**Files:**
- `local-macro-agent/src/index.ts` - Main entry point with backend selection
- `local-macro-agent/src/types.ts` - Shared type definitions
- `local-macro-agent/src/gestureDetector.ts` - 22 independent gesture state machines
- `local-macro-agent/src/sequenceExecutor.ts` - RobotJS keypress sender (Phase 1)
- `local-macro-agent/src/interceptionExecutor.ts` - Kernel-level keypress sender (Phase 2)
- `local-macro-agent/src/executorFactory.ts` - Backend selection factory
- `local-macro-agent/src/inputListener.ts` - Global keyboard/mouse hooks
- `local-macro-agent/src/profileLoader.ts` - JSON profile validation and loading
- `local-macro-agent/profiles/example.json` - Example SWTOR macro profile
- `local-macro-agent/INTERCEPTION_SETUP.md` - Interception driver installation guide

**Detection Hierarchy (Implemented):**
1. **RobotJS** (Phase 1) - Uses SendInput(), sets LLKHF_INJECTED flag (medium detection)
2. **Interception Driver** (Phase 2) - Kernel-level injection, no injection flags (hard to detect)
3. Hardware emulator (Phase 3, future) - Arduino/USB HID, completely undetectable

**Backend Selection:**
```bash
npm start                           # Auto-select best available
npm start -- --backend=robotjs      # Force RobotJS
npm start -- --backend=interception # Force Interception (requires driver)
npm start -- --backend=mock         # Testing mode (no keypresses)
npm start -- --backends             # Show available backends
```

## External Dependencies
- **React**: Frontend library.
- **Vite**: Build tool.
- **TypeScript**: Language for type-safe code.
- **Shadcn UI**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **React Query**: Data fetching and state management library.
- **Express.js**: Backend web framework.
- **Local Storage**: For client-side data persistence.
- **SharpKeys**: Integration for detecting Windows registry key remapping.
- **SWTOR (Star Wars: The Old Republic)**: Specific XML export functionality for game keybinds.