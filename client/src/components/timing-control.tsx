import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface TimingControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  description?: string;
}

export function TimingControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = "ms",
  description,
}: TimingControlProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div className="space-y-2" data-testid={`timing-control-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={handleDecrement}
            disabled={value <= min}
            data-testid={`button-decrement-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="min-w-[4rem] text-center text-sm font-mono font-semibold tabular-nums" data-testid={`value-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}{unit}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={handleIncrement}
            disabled={value >= max}
            data-testid={`button-increment-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
        data-testid={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
