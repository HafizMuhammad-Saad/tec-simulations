import { Slider } from "../components/ui/slider";
import { Label } from "../components/ui/label";

interface ScientificSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
}

export function ScientificSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  color = "bg-blue-500",
  onChange,
}: ScientificSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Label className="text-slate-300 text-sm">{label}</Label>
        <span className="text-slate-100 text-sm font-mono">
          {value.toFixed(1)} {unit}
        </span>
      </div>

      {/* Enhanced track visualization */}
      <div className="relative w-full h-3 bg-slate-800 rounded-md overflow-hidden">
        <div
          className={`absolute h-full rounded-md transition-all duration-300 ${color}`}
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <Slider
          defaultValue={[value]}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={min}
          max={max}
          step={step}
          className="absolute top-0 left-0 w-full h-3 cursor-pointer"
        />
      </div>
    </div>
  );
}
