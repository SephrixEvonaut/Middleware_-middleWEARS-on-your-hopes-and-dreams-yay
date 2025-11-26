# SWTOR Macro Agent

A local Node.js application for per-key gesture detection and macro execution for SWTOR. Runs on your gaming PC and sends real keypresses to the game.

## Features

- **22 Input Keys**: W, A, S, D, B, I, T, C, H, Y, U, P, 1-6, mouse buttons
- **9 Gesture Types**: single, long, double, double_long, triple, triple_long, quadruple_long, super_long, cancel
- **Human-Like Timing**: Randomized delays between keypresses (25ms minimum)
- **Per-Key Isolation**: Each key has independent gesture detection
- **Anti-Cheat Friendly**: Configurable timing variance for natural patterns

## Sequence Constraints

| Constraint | Value |
|------------|-------|
| Minimum delay between presses | 25ms |
| Minimum variance (max - min) | 4ms |
| Maximum unique keys per sequence | 4 |
| Maximum repeats per key | 6 |

## Installation

### Prerequisites
- Node.js 18+ (Download from https://nodejs.org/)
- Windows, macOS, or Linux
- Visual Studio Build Tools (Windows) for native dependencies

### Step 1: Copy Files to Your PC

Copy the entire `local-macro-agent` folder to your gaming PC.

### Step 2: Install Dependencies

```bash
cd local-macro-agent
npm install
```

**Note**: If `robotjs` fails to install, you may need:
- **Windows**: Visual Studio Build Tools with C++ workload
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: `sudo apt install libxtst-dev libpng++-dev`

### Step 3: Configure Your Macros

Edit `profiles/example.json` or create your own profile:

```json
{
  "name": "My SWTOR Macros",
  "macros": [
    {
      "name": "Crushing Blow Combo",
      "trigger": {
        "key": "1",
        "gesture": "double"
      },
      "sequence": [
        { "key": "a", "minDelay": 25, "maxDelay": 30 },
        { "key": "a", "minDelay": 25, "maxDelay": 30 },
        { "key": "b", "minDelay": 30, "maxDelay": 40 },
        { "key": "c", "minDelay": 25, "maxDelay": 35 }
      ],
      "enabled": true
    }
  ]
}
```

### Step 4: Run the Agent

```bash
npm start
```

Or for development (auto-restart on changes):
```bash
npm run dev
```

## Usage

1. **Start the agent** in a terminal window
2. **Open SWTOR** and start playing
3. **Perform gestures** on configured keys:
   - Double-tap "1" → Executes "Crushing Blow Combo"
   - Hold "3" for 80-140ms → Executes "Force Choke CC"
   - etc.

4. **Press Ctrl+C** to stop the agent

## Gesture Types

| Gesture | How to Trigger |
|---------|----------------|
| `single` | Press and release once |
| `long` | Hold for 80-140ms |
| `double` | Press twice quickly (<350ms) |
| `double_long` | Double-tap, hold 2nd press |
| `triple` | Press three times quickly |
| `triple_long` | Triple-tap, hold 3rd press |
| `quadruple_long` | Four presses, hold 4th |
| `super_long` | Hold for 300-2000ms |
| `cancel` | Hold for >3000ms (cancels pending macros) |

## Timing Configuration

Each step in a sequence has:
- `minDelay`: Minimum milliseconds before next keypress
- `maxDelay`: Maximum milliseconds before next keypress

The actual delay is **randomized** between min and max for human-like behavior.

### Example: Fast but Safe

```json
{ "key": "a", "minDelay": 25, "maxDelay": 29 }
```
Result: 25-29ms delay (4ms variance, very fast)

### Example: Moderate Timing

```json
{ "key": "b", "minDelay": 30, "maxDelay": 50 }
```
Result: 30-50ms delay (20ms variance, more natural)

## Global Input Hooks (Production)

The default `InputListener` uses stdin for testing. For **global hotkeys** that work even when SWTOR is focused:

### Option A: Install iohook (Recommended)

```bash
npm install iohook
```

Then uncomment the `ProductionInputListener` in `src/inputListener.ts`.

### Option B: Use node-global-key-listener

```bash
npm install node-global-key-listener
```

Update `inputListener.ts` to use this library.

## File Structure

```
local-macro-agent/
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # Type definitions
│   ├── gestureDetector.ts    # Gesture detection engine
│   ├── sequenceExecutor.ts   # Keypress sender
│   ├── inputListener.ts      # Keyboard/mouse hooks
│   └── profileLoader.ts      # JSON profile loader
├── profiles/
│   └── example.json      # Your macro configurations
└── README.md
```

## Troubleshooting

### "Cannot find module 'robotjs'"

Install native build tools:
- **Windows**: Install Visual Studio Build Tools
- **macOS**: `xcode-select --install`
- **Linux**: `sudo apt install build-essential`

Then run `npm install` again.

### Keys Not Detected

The stdin-based listener only works when the terminal is focused. For global hooks, install `iohook` and use the production listener.

### SWTOR Not Receiving Keypresses

- Make sure robotjs installed correctly
- Run the agent as Administrator (Windows)
- Check that SWTOR isn't blocking synthetic input

## Executor Backends

The agent supports multiple execution backends with different detection levels:

| Backend | Detection Risk | How It Works |
|---------|---------------|--------------|
| `robotjs` | Medium | Uses Windows SendInput API |
| `interception` | Low | Kernel-level driver injection |
| `mock` | N/A | Testing only (no keypresses) |

### Backend Selection

```bash
# Auto-select best available (prefers Interception > RobotJS > Mock)
npm start

# Force specific backend
npm start -- --backend=robotjs
npm start -- --backend=interception
npm start -- --backend=mock

# Show available backends
npm start -- --backends

# Set default via environment
set MACRO_BACKEND=interception
npm start
```

### Upgrading to Interception Driver

For much harder-to-detect input, install the Interception driver:

1. Read `INTERCEPTION_SETUP.md` for full instructions
2. Download driver from https://github.com/oblitum/Interception
3. Install driver (requires admin + reboot)
4. Install FFI modules: `npm install ffi-napi ref-napi`
5. Run with: `npm start -- --backend=interception`

## Anti-Cheat Considerations

**RobotJS (Default):**
- ✅ Sends real keypresses to the OS
- ⚠️ Sets LLKHF_INJECTED flag (detectable)
- ✅ Uses randomized timing for human-like behavior

**Interception Driver (Recommended):**
- ✅ Kernel-level injection
- ✅ No software injection flags
- ✅ Input appears as hardware
- ⚠️ Requires driver installation

**Tips for safety:**
- Use realistic timing (30-50ms delays)
- Add variance (at least 4ms between min/max)
- Don't execute macros at superhuman speed
- Upgrade to Interception for better stealth

## License

MIT - Use at your own risk. The author is not responsible for any game bans or ToS violations.
