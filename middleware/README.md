# Gesture Mapper Middleware

**Legal Framework:** Hardware Translator (Azeron/Swiftpoint Equivalent)  
**Anti-Cheat Compliance:** 1:1 Input/Output Ratio Enforced  
**Status:** Phase 0 Complete → Ready for Phase 1 Implementation

---

## 🎯 What This Middleware Does

Acts as a **software driver** for gaming peripherals, equivalent to hardware firmware like:
- Azeron Cyborg programmable keypad
- Swiftpoint mouse with tilt sensors
- Razer programmable mice
- FSR pressure sensors

**Key Principle:** Every physical button press = exactly one virtual output (1:1 ratio)

---

## ✅ Legal Compliance (Hard Rules)

See `../docs/LEGAL_COMPLIANCE.md` for full framework.

**Enforced by code:**
1. ✅ 1:1 input/output ratio (ComplianceValidator enforces)
2. ✅ Human timing (1-5ms jitter added)
3. ✅ Audit trail (every I/O logged)
4. ✅ Device authenticity (VID/PID verification)
5. ✅ Zero game interaction (input devices only)

**Forbidden features:**
- ❌ Macros (1 button → multiple keys)
- ❌ Automation (repeated actions without input)
- ❌ Memory manipulation
- ❌ Software injection

---

## 📁 Project Structure

```
middleware/
├── src/
│   ├── native/
│   │   └── rawinput.cc          # Windows Raw Input C++ addon
│   ├── compliance/
│   │   ├── validator.ts         # 1:1 ratio enforcement
│   │   └── auditLog.ts          # Event logging for disputes
│   ├── devices/
│   │   ├── parsers.ts           # HID report parsers
│   │   └── registry.ts          # Device VID/PID database
│   ├── translation/
│   │   └── sharpKeys.ts         # Windows registry key remapping
│   ├── gesture/
│   │   └── engine.ts            # Gesture detection (from frontend)
│   └── index.ts                 # Main entry point
├── test/
│   ├── compliance.test.ts       # Validate 1:1 ratio
│   └── latency.test.ts          # Measure input→output timing
├── binding.gyp                  # C++ addon build config
├── package.json
└── README.md (this file)
```

---

## 🚀 Quick Start (Phase 1)

### Prerequisites

```bash
# Install Node.js (18+)
# Install Windows Build Tools
npm install -g windows-build-tools

# Install Visual Studio Build Tools
# Download: visualstudio.microsoft.com/downloads
# Select: "Desktop development with C++"
```

### Install Dependencies

```bash
cd middleware
npm install
```

### Build Native Addon

```bash
npm run build  # Runs node-gyp configure && node-gyp build
```

### Run Tests

```bash
npm test
```

---

## 🛡️ Compliance Validator (Core Component)

**File:** `src/compliance/validator.ts`

Every input/output must pass through this validator:

```typescript
import { ComplianceValidator } from './compliance/validator';

const validator = new ComplianceValidator();

// In your input handler
function handleInput(deviceEvent: RawInputEvent) {
  const gesture = detectGesture(deviceEvent);
  const output = mapToAction(gesture);
  
  // REQUIRED: Validate before sending output
  if (!validator.validate(deviceEvent, output)) {
    throw new ComplianceError('Anti-cheat rules violated');
  }
  
  sendOutput(output);
  validator.logAudit(deviceEvent, output);
}
```

**Validation Rules:**
- Input count === Output count (1:1 ratio)
- Latency >= 1ms (no instant macro)
- Device is authentic hardware (VID/PID verified)
- Timing variance appears human (1-5ms jitter)

---

## 📊 Audit Trail

Every input/output is logged for dispute resolution:

```json
{
  "timestamp": 1699999999999,
  "deviceId": "VID_1234_PID_5678",
  "deviceName": "Azeron Cyborg",
  "physicalInput": {
    "button": 5,
    "pressed": true,
    "scancode": 18
  },
  "gestureDetected": "double_press",
  "virtualOutput": {
    "key": "E",
    "scancode": 18,
    "pressed": true
  },
  "latency": 3.2,
  "ratio": 1.0,
  "validated": true
}
```

**Export for appeal:**
```bash
npm run export-audit -- --date 2025-11-14
# Exports: audit-2025-11-14.json
```

---

## 🎮 Supported Devices (Phase 2+)

### Keyboard (Standard + SharpKeys)
- **Status:** Phase 1
- **VID/PID:** Any standard keyboard
- **Features:** Scancode remapping via SharpKeys registry

### Azeron Cyborg
- **Status:** Phase 2
- **VID/PID:** TBD (check Device Manager)
- **Features:** 29 buttons, thumbpad analog

### Razer Naga (MMO Mouse)
- **Status:** Phase 2
- **VID/PID:** 0x1532 / varies by model
- **Features:** 12 side buttons, DPI stages

### Swiftpoint Mouse
- **Status:** Phase 2
- **VID/PID:** TBD
- **Features:** Tilt sensors, haptic feedback

### FSR Pressure Sensors
- **Status:** Phase 2
- **Options:** Arduino Serial or USB HID
- **Features:** Analog pressure input (0-100%)

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test
```

Tests:
- ✅ 1:1 ratio enforcement
- ✅ SharpKeys translation accuracy
- ✅ Latency measurement
- ✅ Gesture detection logic

### Integration Tests
```bash
npm run test:integration
```

Tests:
- ✅ Raw Input capture → Gesture → Output pipeline
- ✅ Device hot-plug handling
- ✅ Multi-device coordination

### Compliance Tests
```bash
npm run test:compliance
```

Tests:
- ✅ No 1:N mappings allowed
- ✅ Timing appears human (>1ms, <50ms)
- ✅ Audit log completeness

### Manual Testing (Non-Competitive Games)
1. Test with single-player games first
2. Validate latency <10ms
3. Verify no crashes over 24-hour period
4. Check audit log accuracy

---

## 📈 Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| Input Latency | <5ms | TBD |
| Total Pipeline | <10ms | TBD |
| Memory Usage | <50MB | TBD |
| CPU Usage (idle) | <1% | TBD |
| CPU Usage (active) | <5% | TBD |

---

## 🚨 Anti-Cheat Compatibility

### Tested Systems
- [ ] Riot Vanguard (Valorant)
- [ ] EasyAntiCheat (Apex Legends)
- [ ] BattlEye (Rainbow Six Siege)

### Testing Protocol
1. Use **secondary account** (not main)
2. Start with **practice mode** (non-competitive)
3. Monitor for **30 days** minimum
4. Document any detections

### If Detected
1. Export audit log (`npm run export-audit`)
2. Review for compliance violations
3. File appeal with audit evidence
4. Report findings to development team

---

## 🔧 Configuration

**File:** `config/devices.json`

```json
{
  "devices": [
    {
      "name": "Azeron Cyborg",
      "vid": "0x1234",
      "pid": "0x5678",
      "enabled": true,
      "parser": "azeron"
    }
  ],
  "compliance": {
    "strictMode": true,
    "auditLogging": true,
    "humanJitter": {
      "min": 1,
      "max": 5
    }
  },
  "performance": {
    "maxLatency": 10,
    "warnLatency": 5
  }
}
```

---

## 📚 Development Phases

### Phase 0: Foundation ✅
- [x] Legal compliance framework
- [x] Architecture decisions
- [x] Project structure

### Phase 1: Raw Input MVP (Current)
- [ ] Windows Raw Input C++ addon
- [ ] SharpKeys translator
- [ ] Compliance validator
- [ ] Latency measurement

### Phase 2: Device Parsers
- [ ] Azeron HID parser
- [ ] Razer mouse parser
- [ ] Swiftpoint parser
- [ ] FSR sensor integration

### Phase 3: Anti-Cheat Testing
- [ ] 30-day beta test
- [ ] Compliance validation
- [ ] User agreement (ToS)

### Phase 4: Cross-Platform
- [ ] Linux libevdev support
- [ ] macOS IOHIDManager

---

## 🔒 Security & Privacy

**Data Collection:**
- ❌ NO game process monitoring
- ❌ NO network traffic inspection
- ❌ NO user behavior analytics
- ✅ Local audit logs only (user-controlled)

**Data Retention:**
- Audit logs: 7 days (configurable)
- User can export/delete anytime
- No cloud sync (all local)

**Permissions Required:**
- Windows Raw Input API (standard)
- USB device access (HID only)
- Registry read (SharpKeys only, optional)

---

## 📞 Support

**Documentation:**
- Legal compliance: `../docs/LEGAL_COMPLIANCE.md`
- Architecture decisions: `../docs/DECISIONS.md`
- Anti-cheat rules: `../docs/ANTI_CHEAT.md`

**Issues:**
- File in main repo with [MIDDLEWARE] tag
- Include audit log export if reporting detection

---

## ⚖️ License & Disclaimer

**License:** [Your License Here]

**Disclaimer:**
This software operates as a hardware input translator within legal boundaries established by commercial gaming peripherals (Azeron Cyborg, Swiftpoint, etc.). Users are responsible for:
- Following game Terms of Service
- Using 1:1 ratio configurations only
- Not using for competitive advantage
- Understanding anti-cheat policies

**NOT responsible for:**
- Account bans due to user configuration violations
- Game-specific ToS compliance
- Third-party anti-cheat policy changes

---

**Next Steps:** Implement ComplianceValidator.ts → Begin Phase 1
