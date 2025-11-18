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
- **Mapping Designer**: Visual system for binding device inputs to game actions.
- **Profile Management**: Creation, selection, import, and export of configuration profiles (JSON/JavaScript).
- **Modifier Toggle System**: Two-layer state management for modifiers (Ctrl, Shift, Alt) with presets and legal compliance.
- **Hold Timer Visualization**: Real-time progress bar for hold duration with color-coded thresholds.
- **Practice Range**: Inline timing controls with MS-precision sliders, timing presets (Competitive, Balanced, Learning), and real-time statistics (attempts, successes, accuracy).
- **SWTOR Keybind Export System**: Generates valid SWTOR KeyBindings XML files with safe key translation and collision detection.

The architecture is designed for 1:1 input/output ratio compliance, essential for anti-cheat systems.

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