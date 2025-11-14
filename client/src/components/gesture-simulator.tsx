import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RotateCcw } from "lucide-react";
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
  const pressStartRef = useRef<number | null>(null);
  const lastPressRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isPressed) return;
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
  }, [isPressed]);

  const handlePress = () => {
    const now = Date.now();
    setIsPressed(true);
    pressStartRef.current = now;

    const timeSinceLastPress = now - lastPressRef.current;
    
    if (timeSinceLastPress < settings.multiPressWindow && pressCount < 4) {
      setPressCount(prev => prev + 1);
    } else {
      setPressCount(1);
    }

    lastPressRef.current = now;

    const event: GestureEvent = {
      timestamp: now,
      type: "press",
    };
    setEvents(prev => [...prev.slice(-9), event]);
  };

  const handleRelease = () => {
    if (!pressStartRef.current) return;
    
    const now = Date.now();
    const duration = now - pressStartRef.current;
    setIsPressed(false);
    setCurrentDuration(0);
    pressStartRef.current = null;

    let gesture: GestureType | null = null;

    if (duration >= settings.longPressMin && duration <= settings.longPressMax) {
      gesture = "long_press";
      setPressCount(0);
    } else if (duration < settings.longPressMin) {
      switch (pressCount) {
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
      
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPressCount(0);
      }, settings.multiPressWindow);
    }

    if (gesture) {
      setDetectedGesture(gesture);
      setTimeout(() => setDetectedGesture(null), 2000);
    }

    const event: GestureEvent = {
      timestamp: now,
      type: "release",
      duration,
      detected: gesture || undefined,
    };
    setEvents(prev => [...prev.slice(-9), event]);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPressed && pressStartRef.current) {
      interval = setInterval(() => {
        setCurrentDuration(Date.now() - pressStartRef.current!);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPressed, settings]);

  const reset = () => {
    setEvents([]);
    setPressCount(0);
    setCurrentDuration(0);
    setDetectedGesture(null);
    setIsPressed(false);
    pressStartRef.current = null;
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
    };
    return colors[gesture] || "bg-muted";
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
              <CardTitle className="text-lg">Gesture Pattern Simulator</CardTitle>
              <CardDescription className="text-sm">Press SPACE to test gesture detection</CardDescription>
            </div>
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
              <div className="text-2xl font-mono text-muted-foreground" data-testid="text-current-duration">
                {currentDuration}ms
              </div>
            )}
          </div>
          
          {detectedGesture && (
            <Badge
              variant="default"
              className={`text-base px-4 py-2 capitalize animate-in fade-in zoom-in ${getGestureColor(detectedGesture)}`}
              data-testid="badge-detected-gesture"
            >
              {detectedGesture.replace(/_/g, " ")}
            </Badge>
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
                  <Badge variant="default" className="capitalize">
                    {event.detected.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
