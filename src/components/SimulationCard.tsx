import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { Simulation } from './types';
import { categories } from './constants/categories';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface SimulationCardProps {
  simulation: Simulation;
}

const difficultyConfig = {
  beginner: { color: 'bg-green-100 text-green-800', label: 'Beginner' },
  intermediate: { color: 'bg-yellow-100 text-yellow-800', label: 'Intermediate' },
  advanced: { color: 'bg-red-100 text-red-800', label: 'Advanced' }
};

export function SimulationCard({ simulation }: SimulationCardProps) {
  const category = categories[simulation.category];
  const difficulty = difficultyConfig[simulation.difficulty || 'beginner'];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/20">
        <img src={simulation.imageUrl} alt="" className='max-h-32'/>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                {simulation.title}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className={category.color}>
                  {category.name}
                </Badge>
                <Badge variant="outline" className={difficulty.color}>
                  {difficulty.label}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />


        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {simulation.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {simulation.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {simulation.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{simulation.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full group-hover:shadow-md transition-all">
          <Link to={simulation.url}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Simulation
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// import React from "react";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { ArrowRight } from "lucide-react";

// interface SimulationCardProps {
//   title: string;
//   description: string;
//   icon?: React.ReactNode;
//   onClick?: () => void;
//   color?: string;
// }

// export const SimulationCard: React.FC<SimulationCardProps> = ({
//   title,
//   description,
//   icon,
//   onClick,
//   color = "bg-blue-500",
// }) => {
//   return (
//     <Card
//       className="relative group bg-slate-900/90 border-slate-800 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
//       onClick={onClick}
//     >
//       <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
//       <CardHeader>
//         <div className="flex items-center gap-3">
//           <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white`}>
//             {icon}
//           </div>
//           <CardTitle className="text-slate-100 text-lg font-semibold tracking-wide">
//             {title}
//           </CardTitle>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <CardDescription className="text-slate-400 text-sm leading-relaxed line-clamp-2">
//           {description}
//         </CardDescription>
//       </CardContent>
//       <CardFooter className="justify-end">
//         <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
//           Explore
//           <ArrowRight className="ml-2 h-4 w-4" />
//         </Button>
//       </CardFooter>
//     </Card>
//   );
// };
