# Hardware Middleware Integration Roadmap

> **Current Status:** Configuration tool complete ✅  
> **Next Goal:** Build hardware input capture and device communication layer

---

## 🎯 Phase 0: Foundation & Architecture Decisions (Week 1)

**Goal:** Make critical architecture decisions before writing code

### Tasks
1. ✅ Document current device support requirements
2. ⬜ Choose runtime environment (Browser WebHID vs Electron vs Native Service)
3. ⬜ Create `docs/DECISIONS.md` file to track technical choices
4. ⬜ Research anti-cheat policies for target games

### AI Research Prompts

Copy-paste these prompts to **Claude** or **ChatGPT**:

```
PROMPT 1: Runtime Environment Comparison
---
I'm building a gesture mapping middleware for gaming peripherals (Azeron Cyborg, Razer MMO mouse, Swiftpoint, FSR sensors) that needs to:
- Capture raw keyboard/mouse input with <10ms latency
- Access USB HID devices directly
- Run on Windows primarily, Linux secondary
- Work alongside anti-cheat software (Riot Vanguard, EasyAntiCheat)

Compare these approaches:
1. Browser WebHID API
2. Electron with node-hid
3. Native Node.js service with C++ addon

For each approach, provide:
- Latency characteristics
- Device access limitations
- Anti-cheat compatibility risks
- Development complexity (1-10 scale)
- Deployment/distribution challenges

Recommend the best option for a solo developer prioritizing low latency and anti-cheat compliance.
```

```
PROMPT 2: Anti-Cheat Policy Research
---
I'm building input remapping middleware for competitive gaming. I need to understand anti-cheat policies for:
- Riot Vanguard (Valorant, League of Legends)
- EasyAntiCheat (Apex Legends, Fortnite)
- BattlEye (Rainbow Six Siege)

Specific questions:
1. Do they allow custom HID input drivers/middleware?
2. What triggers macro detection? (timing patterns, 1:N input ratios)
3. Are hardware-level inputs treated differently than software injection?
4. What's the 1:1 input/output requirement exactly?
5. Can I add <5ms random timing jitter to appear more human?

Provide concrete rules I must follow to avoid bans.
```

```
PROMPT 3: SharpKeys Registry Integration
---
SharpKeys remaps keys at the Windows registry level (HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Keyboard Layout).

I need to:
1. Read the scancode mapping table at app startup
2. Translate remapped keys in my middleware
3. Optionally: detect real-time registry changes (or just scan on startup?)

Provide:
- Sample Node.js code to read this registry key
- Scancode → Virtual Key translation logic
- Whether real-time registry watching is worth the complexity
- How to handle user permission issues (admin rights needed?)

Keep it practical for a gaming input middleware that needs <10ms latency.
```

### How to Use the Research

1. **Run each prompt** through Claude/ChatGPT
2. **Save responses** to `docs/research/phase0-{topic}.md`
3. **Make decisions** and document in `docs/DECISIONS.md`
4. **Create decision template:**

```markdown
# Architecture Decisions

## Decision 1: Runtime Environment
**Date:** [Today's date]
**Status:** [Proposed/Accepted/Rejected]

**Context:**
[Paste summary from AI research]

**Decision:**
We chose [Electron/Browser/Native] because...

**Consequences:**
- Latency: ...
- Device access: ...
- Anti-cheat: ...
```

---

## 🚀 Phase 1: Raw Input Capture MVP (Weeks 2-4)

**Goal:** Capture keyboard and mouse events from Windows Raw Input API

### Prerequisites
- Phase 0 decisions documented
- Runtime environment chosen

### Tasks
1. ⬜ Set up Electron/Native Node.js project structure
2. ⬜ Implement Windows Raw Input API binding
3. ⬜ Create event dispatcher that pipes to gesture engine
4. ⬜ Add latency measurement instrumentation
5. ⬜ Build test harness with timing validation

### AI Research Prompts

```
PROMPT 4: Windows Raw Input API Implementation
---
I need to implement Windows Raw Input API in [Electron/Node.js] to capture keyboard and mouse events with <10ms latency.

Requirements:
- Register for WM_INPUT messages
- Capture keyboard scancodes (not virtual keys)
- Capture mouse raw delta movements
- Differentiate between devices (keyboard vs mouse vs gaming peripheral)
- Pass events to JavaScript/TypeScript gesture detection engine

Provide:
1. Sample C++ addon code for Node-API (N-API) binding
2. JavaScript/TypeScript interface definition
3. Event structure format { deviceId, timestamp, scancode, pressed }
4. How to register/unregister listeners
5. Performance considerations for gaming (avoid GC pauses)

Keep it production-ready for a gesture mapping middleware.
```

```
PROMPT 5: HID Device Identification
---
I'm capturing raw input from multiple devices simultaneously:
- Standard keyboard
- Azeron Cyborg (USB HID gaming keypad)
- Razer Naga (MMO mouse with 12 side buttons)
- Swiftpoint mouse (tilt sensors)

How do I:
1. Identify which device sent each input event?
2. Get device VID/PID (Vendor/Product ID) from Raw Input?
3. Differentiate multiple keyboards/mice?
4. Handle hot-plug events (USB device connect/disconnect)?

Provide Windows Raw Input API code examples and best practices.
```

### Implementation Steps

1. **Create new directory:** `middleware/` in project root
2. **Install dependencies:**
   ```bash
   npm install ffi-napi ref-napi ref-struct-napi
   # OR for Electron native addon:
   npm install node-gyp
   ```

3. **Stub out event pipeline:**
   ```typescript
   // middleware/src/inputCapture.ts
   import { EventEmitter } from 'events';

   export interface RawInputEvent {
     deviceId: string;
     timestamp: number; // high-resolution timer
     type: 'keyboard' | 'mouse' | 'hid';
     scancode?: number;
     pressed?: boolean;
     deltaX?: number;
     deltaY?: number;
   }

   export class InputCapture extends EventEmitter {
     start() {
       // TODO: Register Windows Raw Input
       console.log('Input capture started');
     }

     stop() {
       // TODO: Unregister listeners
       console.log('Input capture stopped');
     }
   }
   ```

4. **Connect to gesture engine:**
   - Import existing gesture detection logic from `client/src/components/gesture-simulator.tsx`
   - Refactor into shared library
   - Feed RawInputEvents into gesture detector

5. **Test with metrics:**
   ```typescript
   const capture = new InputCapture();
   
   capture.on('input', (event: RawInputEvent) => {
     const latency = Date.now() - event.timestamp;
     if (latency > 10) {
       console.warn(`High latency detected: ${latency}ms`);
     }
   });
   ```

---

## 🔧 Phase 2: Device Parsers & SharpKeys (Weeks 5-8)

**Goal:** Parse device-specific data and translate SharpKeys remappings

### Tasks
1. ⬜ Implement SharpKeys registry reader (startup scan)
2. ⬜ Build Azeron HID report parser
3. ⬜ Build Razer mouse parser
4. ⬜ Build Swiftpoint tilt sensor parser
5. ⬜ Integrate FSR sensors (USB HID or Serial/Arduino)
6. ⬜ Create device parser registry system

### AI Research Prompts

```
PROMPT 6: Azeron Cyborg HID Protocol
---
The Azeron Cyborg is a 29-button gaming keypad. I need to parse its USB HID reports.

Provide:
1. HID report descriptor structure (if known)
2. Byte offsets for button states
3. How to identify the device by VID/PID
4. Thumbpad analog stick data format (X/Y axis ranges)
5. Sample code to parse HID reports in Node.js

If exact protocol unknown, suggest:
- Tools to reverse-engineer HID reports (Wireshark USB, USB Descriptor Tool)
- Generic HID parsing strategies
- How to request descriptor from device
```

```
PROMPT 7: Razer Synapse API Access
---
I need to capture input from a Razer Naga MMO mouse (12 side buttons) WITHOUT Synapse macro interference.

Questions:
1. Can I bypass Razer Synapse and read raw HID?
2. What's the VID/PID for Razer Naga series?
3. Are side buttons reported as standard mouse buttons or custom HID?
4. How to detect DPI stage switches?
5. Any anti-cheat concerns with Razer device drivers?

Provide parsing strategy that works with or without Synapse installed.
```

```
PROMPT 8: FSR Pressure Sensor Integration
---
I want to integrate Force Sensitive Resistor (FSR) pressure sensors for analog input.

Two approaches:
1. Arduino reading analog pins → Serial/USB to PC
2. Custom USB HID device with ADC

Compare:
- Latency (which is faster?)
- Calibration complexity
- Driver requirements
- Cost and DIY feasibility

Provide sample Arduino code for approach 1 and USB HID descriptor for approach 2.
```

```
PROMPT 9: SharpKeys Scancode Translation
---
SharpKeys stores key remappings in Windows registry as scancode pairs.

Example registry data (hex):
00 00 00 00 00 00 00 00
02 00 00 00 1D 00 3A 00  // Map CapsLock (0x3A) to LCtrl (0x1D)
00 00 00 00

I need to:
1. Parse this binary format in Node.js
2. Build a translation map: { 0x3A: 0x1D }
3. Apply translations to incoming scancodes before gesture detection
4. Handle edge cases (unmapped keys, multiple remappings)

Provide complete parsing code and integration strategy.
```

### Implementation Template

```typescript
// middleware/src/deviceParsers.ts

export interface DeviceParser {
  vendorId: number;
  productId: number;
  name: string;
  parse(report: Buffer): InputEvent[];
}

export const AZERON_PARSER: DeviceParser = {
  vendorId: 0x1234, // TODO: Get from research
  productId: 0x5678,
  name: 'Azeron Cyborg',
  parse(report: Buffer): InputEvent[] {
    const events: InputEvent[] = [];
    
    // TODO: Parse HID report based on research
    // Example structure:
    // Byte 0-3: Button states (bit flags)
    // Byte 4: Thumbpad X axis
    // Byte 5: Thumbpad Y axis
    
    const buttonState = report.readUInt32LE(0);
    for (let i = 0; i < 29; i++) {
      if (buttonState & (1 << i)) {
        events.push({
          device: 'azeron',
          button: i,
          pressed: true,
          timestamp: Date.now()
        });
      }
    }
    
    return events;
  }
};

// Register parsers
export const DEVICE_REGISTRY = new Map<string, DeviceParser>([
  ['azeron', AZERON_PARSER],
  // Add more parsers from research
]);
```

---

## 🛡️ Phase 3: Anti-Cheat Compliance Layer (Weeks 9-10)

**Goal:** Ensure 1:1 input/output ratio and macro detection avoidance

### Tasks
1. ⬜ Design audit trail logger (every input → output)
2. ⬜ Implement 1:1 validation (no macro expansion)
3. ⬜ Add configurable rate limiting
4. ⬜ Create compliance test suite
5. ⬜ Document per-game certification checklist

### AI Research Prompts

```
PROMPT 10: Anti-Cheat Validation Logic
---
I need to validate that my gesture mapping middleware maintains 1:1 input/output ratio for anti-cheat compliance.

Requirements:
1. One physical button press = One virtual output (no macros)
2. Timing must appear human (20-500ms variance acceptable)
3. Multi-press gestures (double-click) should still be 1:1 per press
4. Long-press = hold the output key for same duration

Questions:
1. How do anti-cheats detect macros programmatically?
2. Should I add random 1-5ms jitter to output timing?
3. Can gesture patterns (double-press → different action) trigger detection?
4. How to log audit trail for dispute resolution?

Provide validation algorithm and compliance checklist.
```

### Implementation

```typescript
// middleware/src/antiCheat.ts

export class ComplianceValidator {
  private auditLog: AuditEntry[] = [];

  validate(input: InputEvent, output: OutputAction): boolean {
    // Rule 1: Every input must have exactly one output
    const ratio = this.calculateRatio(input, output);
    if (ratio !== 1.0) {
      console.warn('[ANTI-CHEAT] 1:1 ratio violation', { ratio, input, output });
      return false;
    }

    // Rule 2: Timing must be realistic
    const latency = output.timestamp - input.timestamp;
    if (latency < 1 || latency > 50) {
      console.warn('[ANTI-CHEAT] Suspicious latency', { latency });
      return false;
    }

    // Log for audit
    this.auditLog.push({
      timestamp: Date.now(),
      input,
      output,
      validated: true
    });

    return true;
  }

  exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }
}
```

---

## 🌐 Phase 4: Cross-Platform Support (Ongoing)

**Goal:** Extend beyond Windows if needed

### AI Research Prompts

```
PROMPT 11: Linux Input Handling
---
Port Windows Raw Input middleware to Linux using libevdev/evdev.

Compare approaches:
1. libevdev (high-level)
2. Direct /dev/input/eventX reading
3. X11 XInput2 vs Wayland

Provide:
- Sample code to capture keyboard/mouse on Linux
- How to get device VID/PID
- Permission requirements (udev rules)
- Performance comparison to Windows approach
```

---

## 📋 Quick Reference: Feedback Loop Process

After **every research session**:

1. **Save AI response** → `docs/research/phase{N}-{topic}.md`
2. **Extract code samples** → `middleware/src/{module}.ts`
3. **Update decisions** → `docs/DECISIONS.md`
4. **Test implementation** → Create unit test
5. **Update schema** if needed → `shared/schema.ts`
6. **Document in replit.md** → Add to "Development Status"

---

## 🎯 Next Immediate Actions

**TODAY:**
1. Create `docs/` folder structure
2. Run **PROMPT 1** (Runtime Environment) through Claude
3. Run **PROMPT 2** (Anti-Cheat Policies) through ChatGPT
4. Create `docs/DECISIONS.md` and log findings
5. Choose Electron vs Native service based on research

**THIS WEEK:**
1. Complete all Phase 0 research prompts
2. Make architecture decisions
3. Set up middleware project structure
4. Begin Phase 1 (Raw Input Capture)

---

## 📚 Resource Files to Create

```
project/
├── docs/
│   ├── DECISIONS.md           # Architecture decisions
│   ├── ANTI_CHEAT.md          # Game-specific compliance rules
│   └── research/
│       ├── phase0-runtime.md
│       ├── phase0-anticheat.md
│       ├── phase0-sharpkeys.md
│       ├── phase1-rawinput.md
│       ├── phase2-azeron.md
│       └── ...
├── middleware/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── inputCapture.ts     # Raw input from Windows
│       ├── deviceParsers.ts    # HID protocol handlers
│       ├── sharpKeysTranslator.ts
│       ├── gestureEngine.ts    # Refactored from frontend
│       ├── antiCheat.ts        # Compliance validator
│       └── index.ts            # Main entry point
└── shared/
    └── schema.ts               # Shared types (already exists)
```

---

## ⚡ Success Metrics

- **Phase 0:** All decisions documented, runtime chosen
- **Phase 1:** <10ms input latency measured
- **Phase 2:** All 5 devices parsing correctly
- **Phase 3:** 100% 1:1 ratio compliance in tests
- **Phase 4:** Multi-platform support (if needed)

---

**Ready to start?** Run PROMPT 1 and PROMPT 2 now! 🚀
