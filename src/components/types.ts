export interface Simulation {
  id: string;
  title: string;
  description: string;
  category: 'physics' | 'chemistry' | 'math' | 'biology' | 'other';
  imageUrl?: string;
  url: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}