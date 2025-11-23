# Macro Sequencer - SWTOR Ability Combo System

A per-key gesture detection and macro sequencing application for SWTOR ability combos. Detects 9 gesture patterns per key and executes precise timed ability sequences.

## Project Structure

This macro app is built as a standalone application forked from Gesture Mapper concepts:

```
macro-shared/          # Shared types and schemas
  ├── schema.ts        # Data models (MacroProfile, MacroBinding, etc.)
  └── abilities.ts     # Ability catalog from requirements

macro-server/          # Express backend
  ├── index.ts         # Server entry point
  ├── routes.ts        # API routes
  └── storage.ts       # In-memory storage

macro-client/          # React frontend  
  ├── src/
  │   ├── lib/         # Core logic
  │   │   ├── perKeyGestureManager.ts  # 22 independent state machines
  │   │   └── macroExecutor.ts         # High-precision sequence executor
  │   ├── components/  # UI components
  │   ├── pages/       # App pages
  │   └── contexts/    # React contexts
  └── ...
```

## Key Features

### Per-Key Gesture Detection (22 Keys)
- **Movement**: W, A, S, D
- **Actions**: B, I, T, C, H, Y, U, P
- **Numbers**: 1, 2, 3, 4, 5, 6
- **Mouse**: LEFT_CLICK, RIGHT_CLICK

### 9 Gesture Types Per Key
1. **Single** - Single press
2. **Long** - Long press (80-140ms)
3. **Double** - Double press
4. **Double Long** - Double press, 2nd is long
5. **Triple** - Triple press
6. **Triple Long** - Triple press, 3rd is long
7. **Quadruple Long** - Quadruple press, 4th is long
8. **Super Long** - Super long hold (300-2000ms) for alternative sequences
9. **Cancel** - Very long hold (>3000ms) aborts sequence + optional cancel macro

### Macro Execution
- **MS-Accurate Timing**: Uses `performance.now()` + `requestAnimationFrame`
- **Per-Key FIFO Queues**: No cross-key interference
- **Ability Sequences**: Multi-step combos with precise timing
- **Target Modifiers**: nearest_enemy, target_of_target, group members, etc.
- **Cancellation**: Very long holds cancel pending macros

### Ability Catalog
Pre-loaded with SWTOR abilities:
- **Damage**: Crushing Blow, Force Scream, Smash, Vicious Throw
- **Crowd Control**: Force Choke, Backhand, Force Push, Ravage
- **Defensive**: Aegis, Retaliate, Saber Ward, Invincible
- **Healing**: Kolto Shot, Trauma Probe, Bacta Infusion
- **Utility**: Leap, Intercede, Guard, Phase Walk, Taunts
- **Targeting**: Nearest Enemy, Target of Target, etc.

## Architecture Highlights

### Isolated State Machines
Each of the 22 input keys has its own independent `KeyGestureStateMachine`:
- No cross-key interference
- Independent timing windows
- Separate press history tracking
- Per-key cancellation

### High-Precision Executor
The `MacroExecutor` uses:
- `requestAnimationFrame` for smooth 60fps loop
- `performance.now()` for microsecond-accurate timing
- Per-key execution queues (FIFO)
- Cancellation without affecting other keys

### Example Macro Sequences

**From PDF Requirements:**

```typescript
// Nearest enemy → Crushing Blow (6x @ 25ms) → Previous enemy
{
  inputKey: "1",
  gestureType: "double",
  sequence: [
    { ability: "nearest_enemy", pressCount: 1, pressInterval: 50, waitAfter: 0 },
    { ability: "crushing_blow", pressCount: 6, pressInterval: 25, waitAfter: 40 },
    { ability: "previous_enemy", pressCount: 1, pressInterval: 37, waitAfter: 0 },
    { ability: "target_of_target", pressCount: 1, pressInterval: 30, waitAfter: 0 },
  ]
}

// Leap (7x @ 26ms) → Previous target
{
  inputKey: "2",
  gestureType: "triple",
  sequence: [
    { ability: "leap", pressCount: 7, pressInterval: 26, waitAfter: 0 },
    { ability: "previous_enemy", pressCount: 1, pressInterval: 37, waitAfter: 0 },
  ]
}
```

## Extracting to New Repl

To move this to a standalone Repl:

1. Create new Node.js + React Repl
2. Copy these folders:
   - `macro-shared/` → `shared/`
   - `macro-server/` → `server/`
   - `macro-client/` → `client/`
3. Update `package.json` with dependencies
4. Configure workflow to run on port 5001
5. Update import paths if needed

## Development

Run the macro app separately from main Gesture Mapper:
```bash
cd macro-server && npx tsx index.ts
```

## Differences from Gesture Mapper

| Feature | Gesture Mapper | Macro Sequencer |
|---------|----------------|-----------------|
| Modifier Modes | 8 modes (ctrl, shift, etc.) | None - per-key only |
| Input Keys | 79+ keys across 5 devices | 22 specific keys |
| Output | Anti-cheat safe keys only | Any timed sequence |
| Gesture Types | 6 basic types | 9 types with super-long & cancel |
| Purpose | SWTOR keybind export | Macro execution |
| Cross-Key | Modifier-aware | Fully isolated |

## Core Promise

**Per-key isolation**: Each of the 22 keys operates completely independently. Multiple keys can execute different macros simultaneously without interference, contradiction, or output mixing.
