// utils/physicsCalculations.ts
import * as _ from 'lodash';
import seedrandom from 'seedrandom';

// Define the Charge interface
export interface Charge {
  x: number;
  y: number;
  magnitude: number;
}

export class ElectricFieldCalculator {
  static calculateField(charges: Charge[], point: { x: number; y: number }) {
    let fieldX = 0;
    let fieldY = 0;
    
    charges.forEach(charge => {
      const dx = point.x - charge.x;
      const dy = point.y - charge.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = charge.magnitude / (distance * distance);
        fieldX += force * (dx / distance);
        fieldY += force * (dy / distance);
      }
    });
    
    return { x: fieldX, y: fieldY };
  }
}

// Charge transfer using your libraries
export const simulateChargeTransfer = (
  sweaterCharges: Charge[], 
  balloonPosition: { x: number; y: number },
  rng: seedrandom.PRNG
) => {
  return _.filter(sweaterCharges, charge => {
    const distance = Math.sqrt(
      Math.pow(charge.x - balloonPosition.x, 2) + 
      Math.pow(charge.y - balloonPosition.y, 2)
    );
    // Random chance based on distance - closer charges more likely to transfer
    const transferChance = Math.max(0, 1 - distance / 50);
    return rng() > transferChance;
  });
};