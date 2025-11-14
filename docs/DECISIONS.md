# Architecture Decisions Log

This document tracks all major technical decisions for the hardware middleware integration.

---

## Decision 1: Runtime Environment
**Date:** November 14, 2025  
**Status:** Under Research  

**Context:**
Evaluating Browser WebHID vs Electron vs Native Node.js service for hardware input capture.

**Decision:**
[Pending - Run PROMPT 1 and paste findings here]

**Consequences:**
- TBD based on research

---

## Decision 2: Anti-Cheat Compliance Strategy
**Date:** November 14, 2025  
**Status:** Accepted  

**Context:**
Understanding anti-cheat policies for Riot Vanguard, EasyAntiCheat, BattlEye.
Following legal framework established by Azeron Cyborg and Swiftpoint mouse.

**Decision:**
Operate as **hardware translator/driver equivalent**, NOT cheat software.

**Core Rules:**
1. Maintain strict 1:1 input/output ratio (every physical press = one virtual press)
2. Add 1-5ms human timing jitter
3. Use Windows Raw Input API (read-only, like game engines)
4. Zero game process interaction or memory manipulation
5. Complete audit trail for dispute resolution
6. Operate within same legal boundaries as Azeron/Swiftpoint firmware

**Legal Framework:**
- Same category as programmable gaming peripheral firmware
- Protected under accessibility device provisions
- Compliant with all major anti-cheat systems when 1:1 ratio maintained

**Consequences:**
- ✅ Safe for competitive gaming (when used properly)
- ✅ Transparent and auditable behavior
- ✅ User empowerment within legal limits
- ⚠️ NO macro features (1:N mapping forbidden)
- ⚠️ NO automation features (requires physical input always)

**Reference:** See docs/LEGAL_COMPLIANCE.md for full framework

---

## Decision 3: SharpKeys Integration Approach
**Date:** November 14, 2025  
**Status:** Under Research  

**Context:**
How to read and translate Windows registry key remappings.

**Decision:**
[Pending - Run PROMPT 3 and paste findings here]

**Consequences:**
- TBD based on research

---

## Template for Future Decisions

```markdown
## Decision N: [Title]
**Date:** [Date]
**Status:** [Proposed/Under Research/Accepted/Rejected]

**Context:**
[Why this decision is needed]

**Decision:**
[What was decided]

**Consequences:**
- [Impact 1]
- [Impact 2]
```
