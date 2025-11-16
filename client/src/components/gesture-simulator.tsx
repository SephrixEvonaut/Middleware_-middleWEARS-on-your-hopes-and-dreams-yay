import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Activity, RotateCcw, Bug } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { GestureSettings, GestureType, GestureEvent } from "@shared/schema";

interface GestureSimulatorProps {
  settings: GestureSettings;
}

export function GestureSimulator({ settings }: GestureSimulatorProps) {
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [pressCount, setPressCount] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [detectedGesture, setDetectedGesture] = useState<GestureType | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  
  // Tap analytics state
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);
  const [peakTPS, setPeakTPS] = useState(0);
  const [tapIntervals, setTapIntervals] = useState<number[]>([]);
  
  // Use refs for timing-critical values to avoid stale closures
  const pressStartRef = useRef<number | null>(null);
  const lastPressRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressedRef = useRef<boolean>(false);
  const pressCountRef = useRef<number>(0);
  const lastDebounceRef = useRef<number>(0);
  const settingsRef = useRef<GestureSettings>(settings);
  const debugModeRef = useRef<boolean>(debugMode);

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
      if (currentDebugMode) {
        console.log(`[PRESS] Multi-press detected - Count: ${newCount}, Time since last: ${timeSinceLastPress}ms`);
      }
    } else {
      pressCountRef.current = 1; // Update ref synchronously
      setPressCount(1);
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

    // Check for Charge-Release gesture (priority before long press)
    if (duration >= currentSettings.chargeMinHold && duration <= currentSettings.chargeMaxHold) {
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
    } else if (duration >= currentSettings.longPressMin && duration <= currentSettings.longPressMax) {
      gesture = "long_press";
      pressCountRef.current = 0; // Update ref synchronously
      setPressCount(0);
      setChargeLevel(0);
      if (currentDebugMode) {
        console.log(`[RELEASE] Long press detected - Duration: ${duration}ms (${currentSettings.longPressMin}-${currentSettings.longPressMax}ms window)`);
      }
    } else if (duration < currentSettings.longPressMin) {
      setChargeLevel(0);
      // Use ref to get current count to avoid stale closure
      const currentCount = pressCountRef.current;
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
      }
      
      if (currentDebugMode) {
        console.log(`[RELEASE] ${gesture || 'No gesture'} detected - Duration: ${duration}ms, Press count: ${currentCount}`);
      }
      
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        pressCountRef.current = 0; // Update ref synchronously
        setPressCount(0);
      }, currentSettings.multiPressWindow);
    } else {
      // Duration exceeded chargeMaxHold - reset everything
      pressCountRef.current = 0;
      setPressCount(0);
      setChargeLevel(0);
      if (currentDebugMode) {
        console.log(`[RELEASE] Duration ${duration}ms exceeds chargeMaxHold (${currentSettings.chargeMaxHold}ms) - No gesture detected, count reset`);
      }
    }

    if (gesture) {
      setDetectedGesture(gesture);
      setTimeout(() => {
        setDetectedGesture(null);
        setChargeLevel(0);
      }, 2000);
    }

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
    // Reset tap analytics
    setTapTimestamps([]);
    setCurrentTPS(0);
    setPeakTPS(0);
    setTapIntervals([]);
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

  return (
    <Card className="border-card-border" data-testid="card-gesture-simulator">
      <CardHeader data-testid="header-simulator">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Activity className="w-5 h-5 text-primary" data-testid="icon-simulator" />
            </div>
            <div>
              <CardTitle className="text-lg">Gesture Pattern Simulator</CardTitle>
              <CardDescription className="text-sm">Press SPACE to test gesture detection</CardDescription>
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
