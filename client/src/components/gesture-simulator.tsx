import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Activity, RotateCcw, Bug, Settings2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { GestureSettings, GestureType, GestureEvent } from "@shared/schema";
import { TimingControl } from "./timing-control";

interface GestureSimulatorProps {
  settings: GestureSettings;
  onSettingsChange?: (settings: GestureSettings) => void;
}

export function GestureSimulator({ settings, onSettingsChange }: GestureSimulatorProps) {
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [pressCount, setPressCount] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [detectedGesture, setDetectedGesture] = useState<GestureType | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [timingControlsOpen, setTimingControlsOpen] = useState(false);
  
  // Tap analytics state
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);
  const [peakTPS, setPeakTPS] = useState(0);
  const [tapIntervals, setTapIntervals] = useState<number[]>([]);
  
  // Practice statistics
  const [gestureAttempts, setGestureAttempts] = useState<Record<GestureType, number>>({
    single_press: 0,
    double_press: 0,
    triple_press: 0,
    quadruple_press: 0,
    long_press: 0,
    cancel_and_hold: 0,
    charge_release: 0,
  });
  const [gestureSuccesses, setGestureSuccesses] = useState<Record<GestureType, number>>({
    single_press: 0,
    double_press: 0,
    triple_press: 0,
    quadruple_press: 0,
    long_press: 0,
    cancel_and_hold: 0,
    charge_release: 0,
  });
  
  // Use refs for timing-critical values to avoid stale closures
  const pressStartRef = useRef<number | null>(null);
  const lastPressRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressedRef = useRef<boolean>(false);
  const pressCountRef = useRef<number>(0);
  const lastDebounceRef = useRef<number>(0);
  const settingsRef = useRef<GestureSettings>(settings);
  const debugModeRef = useRef<boolean>(debugMode);
  const targetGestureRef = useRef<GestureType | null>(null);

  // Sync refs with props (state refs are updated synchronously in handlers)
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    debugModeRef.current = debugMode;
  }, [debugMode]);

  // Calculate TPS from tap timestamps (rolling 1-second window)
  useEffect(() => {
    const now = Date.now();
    const recentTaps = tapTimestamps.filter(t => now - t <= 1000);
    const tps = recentTaps.length;
    setCurrentTPS(tps);
    
    if (tps > peakTPS) {
      setPeakTPS(tps);
    }
  }, [tapTimestamps, peakTPS]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isPressedRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        handlePress();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleRelease();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // Empty dependency array - register once

  const handlePress = () => {
    const now = Date.now();
    const currentSettings = settingsRef.current;
    const currentDebugMode = debugModeRef.current;
    
    // Apply debounce delay
    const timeSinceLastDebounce = now - lastDebounceRef.current;
    if (timeSinceLastDebounce < currentSettings.debounceDelay) {
      if (currentDebugMode) {
        console.log(`[DEBOUNCE] Event suppressed - ${timeSinceLastDebounce}ms since last event (threshold: ${currentSettings.debounceDelay}ms)`);
      }
      return; // Suppress this event due to debounce
    }
    lastDebounceRef.current = now;
    
    isPressedRef.current = true; // Update ref synchronously
    setIsPressed(true);
    pressStartRef.current = now;

    const timeSinceLastPress = now - lastPressRef.current;
    
    // Use ref to get current count to avoid stale closure
    if (timeSinceLastPress < currentSettings.multiPressWindow && pressCountRef.current < 4) {
      const newCount = pressCountRef.current + 1;
      pressCountRef.current = newCount; // Update ref synchronously
      setPressCount(newCount);
      
      // Track target gesture for statistics (what the user is attempting)
      switch (newCount) {
        case 2:
          targetGestureRef.current = "double_press";
          break;
        case 3:
          targetGestureRef.current = "triple_press";
          break;
        case 4:
          targetGestureRef.current = "quadruple_press";
          break;
      }
      
      if (currentDebugMode) {
        console.log(`[PRESS] Multi-press detected - Count: ${newCount}, Time since last: ${timeSinceLastPress}ms, Target: ${targetGestureRef.current}`);
      }
    } else {
      pressCountRef.current = 1; // Update ref synchronously
      setPressCount(1);
      targetGestureRef.current = null; // Reset target for new sequence
      if (currentDebugMode) {
        console.log(`[PRESS] New press sequence started - Time since last: ${timeSinceLastPress}ms`);
      }
    }

    // Update tap analytics
    setTapTimestamps(prev => {
      const newTimestamps = [...prev, now];
      // Keep only taps from last 1 second
      return newTimestamps.filter(t => now - t <= 1000);
    });
    
    // Calculate tap interval (guard against first tap with invalid timestamp)
    if (lastPressRef.current > 0 && timeSinceLastPress < 10000) {
      setTapIntervals(prev => {
        return [...prev.slice(-9), timeSinceLastPress];
      });
    }
    
    lastPressRef.current = now;

    const event: GestureEvent = {
      timestamp: now,
      type: "press",
    };
    setEvents(prev => [...prev.slice(-9), event]);
  };

  const handleRelease = () => {
    // Guard against duplicate releases or releasing when not pressed
    if (!pressStartRef.current || !isPressedRef.current) return;
    
    const now = Date.now();
    const duration = now - pressStartRef.current;
    const currentSettings = settingsRef.current;
    const currentDebugMode = debugModeRef.current;
    
    // Update refs synchronously BEFORE setting state to prevent race conditions
    isPressedRef.current = false;
    pressStartRef.current = null;
    
    // Now safe to update state (interval will see isPressedRef.current = false and stop)
    setIsPressed(false);
    setCurrentDuration(0);

    let gesture: GestureType | null = null;
    let detectedChargeLevel = 0;
    let attemptedGesture: GestureType | null = null;

    // Determine what gesture was attempted based on duration and press count
    // Priority: long_press first, then charge_release, then multi-press
    if (duration >= currentSettings.longPressMin && duration <= currentSettings.longPressMax) {
      // Successful long press (150-500ms window)
      attemptedGesture = "long_press";
      gesture = "long_press";
      pressCountRef.current = 0;
      setPressCount(0);
      setChargeLevel(0);
      if (currentDebugMode) {
        console.log(`[RELEASE] Long press detected - Duration: ${duration}ms (${currentSettings.longPressMin}-${currentSettings.longPressMax}ms window)`);
      }
    } else if (duration > currentSettings.longPressMax) {
      // Beyond long press window - check for charge-release or failed long press
      if (duration >= currentSettings.chargeMinHold && duration <= currentSettings.chargeMaxHold) {
        // Successful charge-release (> longPressMax, within chargeMaxHold)
        attemptedGesture = "charge_release";
        gesture = "charge_release";
        const chargeDuration = duration - currentSettings.chargeMinHold;
        const chargeWindow = currentSettings.chargeMaxHold - currentSettings.chargeMinHold;
        detectedChargeLevel = Math.round((chargeDuration / chargeWindow) * 100);
        setChargeLevel(detectedChargeLevel);
        pressCountRef.current = 0;
        setPressCount(0);
        if (currentDebugMode) {
          console.log(`[RELEASE] Charge-Release detected - Duration: ${duration}ms, Charge: ${detectedChargeLevel}% (${currentSettings.chargeMinHold}-${currentSettings.chargeMaxHold}ms window)`);
        }
      } else if (duration < currentSettings.chargeMinHold) {
        // Failed long press (exceeded longPressMax but not long enough for charge)
        attemptedGesture = "long_press";
        pressCountRef.current = 0;
        setPressCount(0);
        setChargeLevel(0);
        if (currentDebugMode) {
          console.log(`[RELEASE] Failed long press - Duration ${duration}ms exceeds longPressMax (${currentSettings.longPressMax}ms) but below chargeMinHold (${currentSettings.chargeMinHold}ms)`);
        }
      } else {
        // Failed charge-release (held too long, > chargeMaxHold)
        attemptedGesture = "charge_release";
        pressCountRef.current = 0;
        setPressCount(0);
        setChargeLevel(0);
        if (currentDebugMode) {
          console.log(`[RELEASE] Failed charge-release - Duration ${duration}ms exceeds chargeMaxHold (${currentSettings.chargeMaxHold}ms)`);
        }
      }
    } else {
      // Quick tap - attempting multi-press gesture
      setChargeLevel(0);
      const currentCount = pressCountRef.current;
      
      // Use target gesture for attempt tracking (handles failed multi-press)
      // If target is set, user was attempting that gesture (may have failed due to timing)
      if (targetGestureRef.current) {
        attemptedGesture = targetGestureRef.current;
      } else if (currentCount === 1) {
        attemptedGesture = "single_press";
      }
      
      // Determine successful gesture based on current press count
      switch (currentCount) {
        case 1:
          gesture = "single_press";
          break;
        case 2:
          gesture = "double_press";
          break;
        case 3:
          gesture = "triple_press";
          break;
        case 4:
          gesture = "quadruple_press";
          break;
        default:
          // No valid press count
          break;
      }
      
      if (currentDebugMode) {
        console.log(`[RELEASE] ${gesture || 'No gesture'} detected - Duration: ${duration}ms, Press count: ${currentCount}, Target: ${targetGestureRef.current}, Attempted: ${attemptedGesture}`);
      }
      
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        pressCountRef.current = 0;
        setPressCount(0);
        // Don't clear targetGestureRef here - we need it for handleRelease
      }, currentSettings.multiPressWindow);
    }

    // Track attempt (always, regardless of success)
    if (attemptedGesture) {
      setGestureAttempts(prev => ({
        ...prev,
        [attemptedGesture]: prev[attemptedGesture] + 1,
      }));
    }

    // Track success (only when gesture detected)
    if (gesture) {
      setDetectedGesture(gesture);
      setGestureSuccesses(prev => ({
        ...prev,
        [gesture]: prev[gesture] + 1,
      }));
      setTimeout(() => {
        setDetectedGesture(null);
        setChargeLevel(0);
      }, 2000);
    }

    // Clear target gesture after tracking (done with this release)
    targetGestureRef.current = null;

    const event: GestureEvent = {
      timestamp: now,
      type: "release",
      duration,
      detected: gesture || undefined,
      chargeLevel: detectedChargeLevel || undefined,
    };
    setEvents(prev => [...prev.slice(-9), event]);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPressed && pressStartRef.current) {
      interval = setInterval(() => {
        if (pressStartRef.current) {
          setCurrentDuration(Date.now() - pressStartRef.current);
        }
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPressed]);

  const reset = () => {
    setEvents([]);
    pressCountRef.current = 0; // Update ref synchronously
    setPressCount(0);
    setCurrentDuration(0);
    setDetectedGesture(null);
    setChargeLevel(0);
    isPressedRef.current = false; // Update ref synchronously
    setIsPressed(false);
    pressStartRef.current = null;
    lastPressRef.current = 0; // Reset for clean analytics baseline
    targetGestureRef.current = null; // Clear target gesture
    // Reset tap analytics
    setTapTimestamps([]);
    setCurrentTPS(0);
    setPeakTPS(0);
    setTapIntervals([]);
    // Reset practice statistics
    setGestureAttempts({
      single_press: 0,
      double_press: 0,
      triple_press: 0,
      quadruple_press: 0,
      long_press: 0,
      cancel_and_hold: 0,
      charge_release: 0,
    });
    setGestureSuccesses({
      single_press: 0,
      double_press: 0,
      triple_press: 0,
      quadruple_press: 0,
      long_press: 0,
      cancel_and_hold: 0,
      charge_release: 0,
    });
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const getGestureColor = (gesture: GestureType) => {
    const colors: Record<GestureType, string> = {
      single_press: "bg-chart-1",
      double_press: "bg-chart-2",
      triple_press: "bg-chart-3",
      quadruple_press: "bg-chart-4",
      long_press: "bg-chart-5",
      cancel_and_hold: "bg-destructive",
      charge_release: "bg-violet-500",
    };
    return colors[gesture] || "bg-muted";
  };

  // Calculate current charge level based on hold duration
  const getCurrentChargeLevel = () => {
    if (!isPressed || currentDuration < settings.chargeMinHold) return 0;
    if (currentDuration > settings.chargeMaxHold) return 100;
    const chargeDuration = currentDuration - settings.chargeMinHold;
    const chargeWindow = settings.chargeMaxHold - settings.chargeMinHold;
    return Math.round((chargeDuration / chargeWindow) * 100);
  };

  const currentChargeLevel = isPressed ? getCurrentChargeLevel() : chargeLevel;

  const updateSetting = (key: keyof GestureSettings, value: number) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, [key]: value });
    }
  };

  const applyPreset = (preset: "tight" | "medium" | "relaxed") => {
    if (!onSettingsChange) return;

    const presets: Record<string, Partial<GestureSettings>> = {
      tight: {
        multiPressWindow: 200,
        longPressMin: 100,
        longPressMax: 300,
        debounceDelay: 5,
        chargeMinHold: 250,
        chargeMaxHold: 1500,
        outputKeyPadding: 20,
      },
      medium: {
        multiPressWindow: 350,
        longPressMin: 150,
        longPressMax: 500,
        debounceDelay: 10,
        chargeMinHold: 300,
        chargeMaxHold: 2000,
        outputKeyPadding: 25,
      },
      relaxed: {
        multiPressWindow: 500,
        longPressMin: 200,
        longPressMax: 800,
        debounceDelay: 15,
        chargeMinHold: 400,
        chargeMaxHold: 2500,
        outputKeyPadding: 35,
      },
    };

    onSettingsChange({ ...settings, ...presets[preset] });
  };

  return (
    <Card className="border-card-border" data-testid="card-gesture-simulator">
      <CardHeader data-testid="header-simulator">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Activity className="w-5 h-5 text-primary" data-testid="icon-simulator" />
            </div>
            <div>
              <CardTitle className="text-lg">Practice Range</CardTitle>
              <CardDescription className="text-sm">Press SPACE to test gesture detection with real-time tuning</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={debugMode}
                onCheckedChange={setDebugMode}
                data-testid="switch-debug-mode"
              />
              <span className="text-xs text-muted-foreground">Debug</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              data-testid="button-reset-simulator"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timing Controls Panel */}
        {onSettingsChange && (
          <Collapsible open={timingControlsOpen} onOpenChange={setTimingControlsOpen} data-testid="collapsible-timing-controls">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" data-testid="button-toggle-timing-controls">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span>Timing Controls</span>
                  <Badge variant="secondary" className="text-xs">1ms precision</Badge>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${timingControlsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4 p-4 bg-muted/20 rounded-lg border border-border">
              {/* Timing Presets */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quick Presets</span>
                  <Badge variant="outline" className="text-xs">One-click timing profiles</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("tight")}
                    data-testid="button-preset-tight"
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold">Tight</span>
                    <span className="text-xs text-muted-foreground">Competitive</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("medium")}
                    data-testid="button-preset-medium"
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold">Medium</span>
                    <span className="text-xs text-muted-foreground">Balanced</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("relaxed")}
                    data-testid="button-preset-relaxed"
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold">Relaxed</span>
                    <span className="text-xs text-muted-foreground">Learning</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPreset("medium")}
                  data-testid="button-reset-timing-defaults"
                  className="w-full"
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Reset to Defaults
                </Button>
              </div>

              <div className="grid gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Gesture Detection</h4>
                  <div className="space-y-4">
                    <TimingControl
                      label="Multi-Press Window"
                      value={settings.multiPressWindow}
                      min={100}
                      max={1000}
                      onChange={(value) => updateSetting('multiPressWindow', value)}
                      description="Time window to detect consecutive taps"
                    />
                    <TimingControl
                      label="Long Press Min"
                      value={settings.longPressMin}
                      min={50}
                      max={500}
                      onChange={(value) => updateSetting('longPressMin', value)}
                      description="Minimum hold time for long press"
                    />
                    <TimingControl
                      label="Long Press Max"
                      value={settings.longPressMax}
                      min={100}
                      max={1000}
                      onChange={(value) => updateSetting('longPressMax', value)}
                      description="Maximum long press window"
                    />
                    <TimingControl
                      label="Debounce Delay"
                      value={settings.debounceDelay}
                      min={0}
                      max={50}
                      onChange={(value) => updateSetting('debounceDelay', value)}
                      description="Hardware bounce suppression"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Charge-Release</h4>
                  <div className="space-y-4">
                    <TimingControl
                      label="Charge Min Hold"
                      value={settings.chargeMinHold}
                      min={100}
                      max={1000}
                      onChange={(value) => updateSetting('chargeMinHold', value)}
                      description="Minimum hold to start charging"
                    />
                    <TimingControl
                      label="Charge Max Hold"
                      value={settings.chargeMaxHold}
                      min={500}
                      max={5000}
                      onChange={(value) => updateSetting('chargeMaxHold', value)}
                      description="Maximum charge window (100%)"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Output Sequence</h4>
                  <div className="space-y-4">
                    <TimingControl
                      label="Key Padding"
                      value={settings.outputKeyPadding}
                      min={0}
                      max={200}
                      onChange={(value) => updateSetting('outputKeyPadding', value)}
                      description="Delay between keypress outputs (prevents SWTOR input drops)"
                    />
                  </div>
                  <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-primary mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Output Padding:</strong> Adds {settings.outputKeyPadding}ms delay between consecutive keypresses.
                        Recommended 25-50ms for SWTOR to prevent dropped inputs during combo sequences.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Current Gesture Display */}
        <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-border" data-testid="display-current-gesture">
          <div className="flex items-center gap-4 mb-4">
            {pressCount > 0 && (
              <Badge variant="default" className="text-lg px-4 py-2 font-mono" data-testid="badge-press-count">
                {pressCount}x
              </Badge>
            )}
            {isPressed && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl font-mono text-muted-foreground" data-testid="text-current-duration">
                  {currentDuration}ms
                </div>
                {currentDuration >= settings.longPressMin && currentDuration <= settings.longPressMax && (
                  <Badge variant="default" className="text-xs bg-chart-5" data-testid="badge-in-long-press-window">
                    In Long Press Window
                  </Badge>
                )}
                {currentDuration >= settings.chargeMinHold && currentDuration <= settings.chargeMaxHold && (
                  <Badge variant="default" className="text-xs bg-violet-500" data-testid="badge-in-charge-window">
                    Charging: {currentChargeLevel}%
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Hold Timer Visualization */}
          {isPressed && (
            <div className="w-full max-w-md mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Hold Duration</span>
                <span className="text-xs font-mono text-muted-foreground">{currentDuration}ms</span>
              </div>
              <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden border border-border">
                {/* Progress bar with color transitions */}
                <div
                  className={`h-full transition-all duration-100 ${
                    currentDuration < 150 
                      ? 'bg-gradient-to-r from-orange-400 to-orange-300'
                      : currentDuration < 500
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-300'
                      : currentDuration < 1000
                      ? 'bg-gradient-to-r from-green-400 to-green-300'
                      : 'bg-gradient-to-r from-blue-400 to-blue-300'
                  }`}
                  style={{
                    width: `${Math.min(100, (currentDuration / 2000) * 100)}%`,
                  }}
                  data-testid="hold-timer-bar"
                />
                {/* Threshold markers */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-500 dark:bg-orange-400"
                  style={{ left: `${(150 / 2000) * 100}%` }}
                  title="150ms - Long Press Min"
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 dark:bg-yellow-400"
                  style={{ left: `${(500 / 2000) * 100}%` }}
                  title="500ms"
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-green-500 dark:bg-green-400"
                  style={{ left: `${(1000 / 2000) * 100}%` }}
                  title="1000ms"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>0ms</span>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-orange-500 dark:text-orange-400">150ms</span>
                  <span className="text-yellow-500 dark:text-yellow-400">500ms</span>
                  <span className="text-green-500 dark:text-green-400">1000ms</span>
                </div>
                <span>2000ms</span>
              </div>
            </div>
          )}

          {/* Charge Bar */}
          {(currentChargeLevel > 0 || (isPressed && currentDuration >= settings.chargeMinHold)) && (
            <div className="w-full max-w-md mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Charge Level</span>
                <span className="text-xs font-mono text-muted-foreground">{currentChargeLevel}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all duration-100"
                  style={{ width: `${currentChargeLevel}%` }}
                  data-testid="charge-bar-fill"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>{settings.chargeMinHold}ms</span>
                <span>{settings.chargeMaxHold}ms</span>
              </div>
            </div>
          )}
          
          {detectedGesture && (
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="default"
                className={`text-base px-4 py-2 capitalize animate-in fade-in zoom-in ${getGestureColor(detectedGesture)}`}
                data-testid="badge-detected-gesture"
              >
                {detectedGesture.replace(/_/g, " ")}
              </Badge>
              {detectedGesture === "charge_release" && chargeLevel > 0 && (
                <span className="text-sm text-muted-foreground font-mono" data-testid="text-charge-level">
                  Released at {chargeLevel}% charge
                </span>
              )}
            </div>
          )}
          
          {!isPressed && !detectedGesture && pressCount === 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-simulator-prompt">Press SPACE to start</p>
          )}
        </div>

        {/* Timeline Visualizer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Timeline (last 1000ms)</h4>
            <div className="flex gap-4 text-xs text-muted-foreground font-mono">
              <span>0ms</span>
              <span>500ms</span>
              <span>1000ms</span>
            </div>
          </div>
          <div className="relative h-24 bg-muted/20 rounded-md border border-border overflow-hidden" data-testid="timeline-visualizer">
            <div className="absolute inset-0 flex items-end justify-around px-2 pb-2">
              {events.slice(-10).map((event, index) => {
                const relativeTime = Date.now() - event.timestamp;
                const position = Math.max(0, 100 - (relativeTime / 10));
                
                return (
                  <div
                    key={index}
                    className="absolute bottom-0 w-1 bg-primary rounded-t transition-all"
                    style={{
                      right: `${position}%`,
                      height: event.type === "press" ? "60%" : "40%",
                      opacity: Math.max(0.3, 1 - (relativeTime / 1000)),
                    }}
                    data-testid={`timeline-event-${index}`}
                  />
                );
              })}
            </div>
            
            {/* Detection window zones */}
            <div
              className="absolute top-0 bottom-0 bg-chart-2/10 border-l border-chart-2/30"
              style={{ right: `${100 - (settings.longPressMin / 10)}%`, width: "1px" }}
            />
            <div
              className="absolute top-0 bottom-0 bg-chart-2/10 border-l border-chart-2/30"
              style={{ right: `${100 - (settings.longPressMax / 10)}%`, width: "1px" }}
            />
          </div>
        </div>

        {/* Tap Analytics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Tap Analytics</h4>
            <Badge variant="outline" className="text-xs font-mono" data-testid="badge-analytics-disclaimer">
              Detection Only - No Automation
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/20 rounded-md border border-border" data-testid="display-current-tps">
              <div className="text-xs text-muted-foreground mb-1">Current TPS</div>
              <div className="text-2xl font-mono font-bold text-foreground">{currentTPS}</div>
              <div className="text-xs text-muted-foreground mt-1">Taps/sec</div>
            </div>
            
            <div className="p-3 bg-muted/20 rounded-md border border-border" data-testid="display-peak-tps">
              <div className="text-xs text-muted-foreground mb-1">Peak TPS</div>
              <div className="text-2xl font-mono font-bold text-chart-3">{peakTPS}</div>
              <div className="text-xs text-muted-foreground mt-1">Record</div>
            </div>
            
            <div className="p-3 bg-muted/20 rounded-md border border-border" data-testid="display-avg-interval">
              <div className="text-xs text-muted-foreground mb-1">Avg Interval</div>
              <div className="text-2xl font-mono font-bold text-chart-5">
                {tapIntervals.length > 0 ? Math.round(tapIntervals.reduce((a, b) => a + b, 0) / tapIntervals.length) : 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">ms</div>
            </div>
          </div>
          
          {tapIntervals.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Recent Tap Intervals (ms)</div>
              <div className="flex gap-1 h-16 items-end" data-testid="tap-interval-bars">
                {tapIntervals.slice(-10).map((interval, index) => {
                  const maxInterval = Math.max(...tapIntervals.slice(-10));
                  const heightPercent = maxInterval > 0 ? (interval / maxInterval) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
                        style={{ height: `${heightPercent}%`, minHeight: "8px" }}
                        data-testid={`interval-bar-${index}`}
                      />
                      <span className="text-xs font-mono text-muted-foreground">{interval}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Practice Statistics */}
        {Object.values(gestureAttempts).some(count => count > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Practice Statistics</h4>
              <Badge variant="secondary" className="text-xs">Session Tracking</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(gestureAttempts) as GestureType[]).map((gestureType) => {
                const attempts = gestureAttempts[gestureType];
                const successes = gestureSuccesses[gestureType];
                const successRate = attempts > 0 ? Math.round((successes / attempts) * 100) : 0;
                
                if (attempts === 0) return null;
                
                return (
                  <div 
                    key={gestureType}
                    className="p-3 bg-muted/20 rounded-md border border-border"
                    data-testid={`stat-${gestureType}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium capitalize">{gestureType.replace(/_/g, " ")}</span>
                      <Badge 
                        variant={successRate >= 80 ? "default" : successRate >= 60 ? "secondary" : "outline"}
                        className="text-xs"
                        data-testid={`accuracy-${gestureType}`}
                      >
                        {successRate}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${successRate >= 80 ? 'bg-green-500' : successRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground font-mono">
                        <span>
                          <span data-testid={`successes-${gestureType}`}>{successes}</span>
                          {" / "}
                          <span data-testid={`attempts-${gestureType}`}>{attempts}</span>
                        </span>
                        <span>{attempts} attempts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Overall Statistics */}
            <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Attempts</div>
                  <div className="text-xl font-mono font-bold">
                    {Object.values(gestureAttempts).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Successful</div>
                  <div className="text-xl font-mono font-bold text-green-500">
                    {Object.values(gestureSuccesses).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Overall Rate</div>
                  <div className="text-xl font-mono font-bold">
                    {Object.values(gestureAttempts).reduce((a, b) => a + b, 0) > 0
                      ? Math.round((Object.values(gestureSuccesses).reduce((a, b) => a + b, 0) / Object.values(gestureAttempts).reduce((a, b) => a + b, 0)) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Events</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {events.slice(-5).reverse().map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs"
                data-testid={`event-log-${index}`}
              >
                <span className="font-mono text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <Badge variant="outline" className="font-mono">
                  {event.type}
                </Badge>
                {event.duration !== undefined && (
                  <span className="font-mono">{event.duration}ms</span>
                )}
                {event.detected && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="capitalize">
                      {event.detected.replace(/_/g, " ")}
                    </Badge>
                    {event.detected === "charge_release" && event.chargeLevel !== undefined && (
                      <span className="font-mono text-violet-500">{event.chargeLevel}%</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
