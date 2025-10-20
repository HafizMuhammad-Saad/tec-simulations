import { useRef, useState, useEffect } from "react";
import ControlPanel from "../components/ControlPanel";
import { useProjectile } from "../hooks/useProjectile";

const Projectile = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState({
    velocity: 20,
    angle: 45,
    mass: 1,
    air: false,
  });
  const { start, pause, reset, updateStats, stats, isPaused } = useProjectile(
    canvasRef,
    settings
  );

  return (
    <div >
      <div className="" style={{position: 'absolute', }}>

      <ControlPanel
        settings={settings}
        setSettings={setSettings}
        onStart={start}
        onPause={pause}
        onReset={reset}
        stats={stats}
        isPaused={isPaused}
      />
      </div>
      <canvas ref={canvasRef} width={1000} height={600}></canvas>
    </div>
  );
};

export default Projectile;
