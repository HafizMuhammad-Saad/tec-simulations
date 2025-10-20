import type { Simulation } from './types';

export const simulations: Simulation[] = [
  {
    id: '1',
    title: 'Projectile Motion',
    description: 'Understand projectile motion with interactive simulations',
    category: 'physics',
    url: '/pages/projectile-motion',
    difficulty: 'intermediate',
    tags: ['mechanics', 'motion', 'gravity'],
    imageUrl: '/images/projectile-motion.svg'
  },
  {
    id: '2',
    title: 'Chemical Reactions',
    description: 'Visualize chemical reactions and bonding',
    category: 'chemistry',
    url: '/pages/chemical-reactions',
    difficulty: 'beginner',
    tags: ['reactions', 'bonding', 'molecules']
  },
  {
    id: '3',
    title: 'Balloon and Static Electricity',
    description: 'Interactive graphs for calculus concepts',
    category: 'physics',
    url: '/pages/balloonAndStaticElectricity/balloonAndStaticElectricity',
    difficulty: 'advanced',
    tags: ['derivatives', 'integrals', 'graphs']
  },
  {
    id: '4',
    title: 'Wave Interference',
    description: 'See how waves interact and interfere',
    category: 'physics',
    url: '/simulations/wave-interference',
    difficulty: 'intermediate',
    tags: ['waves', 'interference', 'optics']
  },
  {
    id: '5',
    title: 'Molecular Structure',
    description: '3D visualization of molecular structures',
    category: 'chemistry',
    url: '/simulations/molecular-structure',
    difficulty: 'beginner',
    tags: ['molecules', '3d', 'structure']
  },
  {
    id: '6',
    title: 'Probability Distributions',
    description: 'Explore different probability distributions',
    category: 'math',
    url: '/simulations/probability',
    difficulty: 'intermediate',
    tags: ['statistics', 'probability', 'distributions']
  }
];