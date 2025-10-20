// types.ts
export interface Charge {
  x: number;
  y: number;
  type: 'positive' | 'negative';
  magnitude: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  charge: Charge;
  radius: number;
  isTransferable: boolean;
}