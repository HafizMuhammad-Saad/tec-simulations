import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { ScientificSlider } from "./ScientificSlider";

interface Props {
  settings: {
    velocity: number;
    angle: number;
    mass: number;
    air: boolean;
  };
  setSettings: React.Dispatch<
    React.SetStateAction<{
      velocity: number;
      angle: number;
      mass: number;
      air: boolean;
    }>
  >;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  stats: {
    time: number;
    height: number;
    range: number;
    speed: number;
  };
  isPaused: boolean;
}

const ControlPanel: React.FC<Props> = ({
  settings,
  setSettings,
  onStart,
  onPause,
  onReset,
  stats,
  isPaused,
}) => {
  return (
    <Card className="fixed top-6 right-6 w-80 bg-slate-900/90 border-slate-700 shadow-xl backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-slate-100 text-center text-lg font-semibold tracking-wide">
          🎯 Projectile Motion Explorer
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScientificSlider
          label="Velocity"
          value={settings.velocity}
          min={1}
          max={50}
          unit="m/s"
          color="bg-blue-500"
          onChange={(v) => setSettings((s) => ({ ...s, velocity: v }))}
        />

        <ScientificSlider
          label="Angle"
          value={settings.angle}
          min={10}
          max={80}
          unit="°"
          color="bg-green-500"
          onChange={(v) => setSettings((s) => ({ ...s, angle: v }))}
        />

        <ScientificSlider
          label="Mass"
          value={settings.mass}
          min={0.5}
          max={5}
          step={0.1}
          unit="kg"
          color="bg-orange-500"
          onChange={(v) => setSettings((s) => ({ ...s, mass: v }))}
        />

        <div className="flex items-center justify-between pt-3">
          <Label className="text-slate-300">Air Resistance</Label>
          <Switch
            checked={settings.air}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, air: checked }))
            }
          />
        </div>

        <Separator className="bg-slate-700 my-2" />

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
          <div>
            <p className="font-medium text-slate-400">Time</p>
            <p className="text-slate-100">{stats.time.toFixed(2)} s</p>
          </div>
          <div>
            <p className="font-medium text-slate-400">Height</p>
            <p className="text-slate-100">{stats.height.toFixed(2)} m</p>
          </div>
          <div>
            <p className="font-medium text-slate-400">Range</p>
            <p className="text-slate-100">{stats.range.toFixed(2)} m</p>
          </div>
          <div>
            <p className="font-medium text-slate-400">Speed</p>
            <p className="text-slate-100">{stats.speed.toFixed(2)} m/s</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center gap-2 pt-2">
        <Button onClick={onStart} className="bg-blue-600 hover:bg-blue-500">
          ▶️ Launch
        </Button>
        <Button onClick={onPause} className="bg-slate-700 hover:bg-slate-600">
          {isPaused ? "▶️ Resume" : "⏸ Pause"}
        </Button>
        <Button onClick={onReset} className="bg-red-600 hover:bg-red-500">
          🔁 Reset
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ControlPanel;
