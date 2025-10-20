import React from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card";
import { Slider } from "../../../components/ui/slider";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import type { Settings } from "../BalloonAndStaticElectricity";

interface Props {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const ControlPanel: React.FC<Props> = ({ settings, setSettings }) => {

  return (
    <Card className="fixed top-6 right-6 w-80 bg-slate-900/80 border-slate-700 shadow-xl backdrop-blur-md z-40">
      <CardHeader>
        <CardTitle className="text-slate-100">Static Electricity Lab</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">Balloon Charge</Label>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => setSettings(s => ({ ...s, balloonSign: -1 }))}
              variant={settings.balloonSign === -1 ? "default" : "ghost"}
            >
              Negative
            </Button>
            <Button
              onClick={() => setSettings(s => ({ ...s, balloonSign: 0 }))}
              variant={settings.balloonSign === 0 ? "default" : "ghost"}
            >
              Neutral
            </Button>
            <Button
              onClick={() => setSettings(s => ({ ...s, balloonSign: 1 }))}
              variant={settings.balloonSign === 1 ? "default" : "ghost"}
            >
              Positive
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-slate-300">Balloon magnitude: {settings.balloonMagnitude.toFixed(1)}</Label>
          <Slider
            defaultValue={[settings.balloonMagnitude]}
            min={0.2}
            max={3}
            step={0.1}
            onValueChange={(v) => setSettings(s => ({ ...s, balloonMagnitude: v[0] }))}
          />
        </div>

        <div>
          <Label className="text-slate-300">Mobile charge fraction: {(settings.mobileFraction*100).toFixed(0)}%</Label>
          <Slider
            defaultValue={[settings.mobileFraction]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={(v) => setSettings(s => ({ ...s, mobileFraction: v[0] }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-slate-300">Show field lines</Label>
          <Switch checked={settings.showFieldLines} onCheckedChange={(checked) => setSettings(s => ({ ...s, showFieldLines: Boolean(checked) }))} />
        </div>

        <div>
          <Label className="text-slate-300">Stick threshold: {settings.stickThreshold}px</Label>
          <Slider
            defaultValue={[settings.stickThreshold]}
            min={8}
            max={80}
            step={1}
            onValueChange={(v) => setSettings(s => ({ ...s, stickThreshold: Math.round(v[0]) }))}
          />
        </div>

      </CardContent>

      <CardFooter className="flex justify-between">
        <Button onClick={() => window.dispatchEvent(new CustomEvent("lab_reset"))}>Reset</Button>
        <Button onClick={() => window.dispatchEvent(new CustomEvent("lab_rub"))}>Rub</Button>
      </CardFooter>
    </Card>
  );
};

export default ControlPanel;
