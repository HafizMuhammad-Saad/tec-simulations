import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SimulationsGrid } from './components/SimulationsGrid';
import { Toaster } from './components/ui/sonner';
import Projectile from './pages/ProjectileMotion';
// import ChemicalReactions from './pages/ChemicalReactions';
import StaticElectricitySim from './pages/balloonAndStaticElectricity/BalloonAndStaticElectricity';
import ComingSoon from './pages/ComingSoon';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SimulationsGrid />} />
          <Route path="/pages/projectile-motion" element={<Projectile />} />
          {/* <Route path="/pages/chemical-reactions" element={<ChemicalReactions />} /> */}
          <Route path="/pages/balloonAndStaticElectricity/balloonAndStaticElectricity" element={<StaticElectricitySim />} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;

// import React from "react";
// import { SimulationCard } from "./components/SimulationCard";
// import { FlaskConical, Atom, Waves, MountainSnow, Timer } from "lucide-react";

// const App: React.FC = () => {
//   const simulations = [
//     {
//       title: "Projectile Motion",
//       description: "Simulate launch angle, velocity, and gravity effects on motion trajectories.",
//       icon: <Timer className="w-5 h-5" />,
//       color: "bg-blue-500",
//     },
//     {
//       title: "Pendulum Motion",
//       description: "Explore harmonic motion and oscillations with variable lengths and gravity.",
//       icon: <Waves className="w-5 h-5" />,
//       color: "bg-green-500",
//     },
//     {
//       title: "Chemical Reactions",
//       description: "Visualize reaction rates, catalysts, and equilibrium shifts dynamically.",
//       icon: <FlaskConical className="w-5 h-5" />,
//       color: "bg-red-500",
//     },
//     {
//       title: "Atomic Structure",
//       description: "Interactively learn about electron orbitals and atomic energy levels.",
//       icon: <Atom className="w-5 h-5" />,
//       color: "bg-purple-500",
//     },
//     {
//       title: "Wave Interference",
//       description: "Observe constructive and destructive interference patterns in real-time.",
//       icon: <Waves className="w-5 h-5" />,
//       color: "bg-cyan-500",
//     },
//     {
//       title: "Gravity & Orbits",
//       description: "Model planetary orbits and gravitational effects between celestial bodies.",
//       icon: <MountainSnow className="w-5 h-5" />,
//       color: "bg-yellow-500",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
//       <div className="max-w-6xl mx-auto">
//         <header className="text-center mb-10">
//           <h1 className="text-3xl font-bold tracking-tight text-slate-100">
//             🧪 Interactive Science Simulations
//           </h1>
//           <p className="text-slate-400 mt-2 text-sm md:text-base">
//             Explore concepts in physics, chemistry, and mathematics with interactive visual experiments.
//           </p>
//         </header>

//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {simulations.map((sim) => (
//             <SimulationCard
//               key={sim.title}
//               title={sim.title}
//               description={sim.description}
//               icon={sim.icon}
//               color={sim.color}
//               onClick={() => navigate}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;
