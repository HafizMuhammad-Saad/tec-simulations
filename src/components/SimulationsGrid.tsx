import React, { useState } from 'react';
import { SimulationCard } from './SimulationCard';
import { simulations } from './simulationsData';
import { categories } from './constants/categories';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Filter, Grid3X3, List } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

export function SimulationsGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredSimulations = simulations.filter(simulation => {
    const matchesSearch = simulation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         simulation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         simulation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || simulation.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive Learning Simulations
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore complex concepts through interactive simulations in Physics, Chemistry, Mathematics, and more.
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search simulations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full lg:w-80"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Category Filter */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    {Object.entries(categories).map(([key, category]) => (
                      <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* View Toggle */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
                  <TabsList>
                    <TabsTrigger value="grid">
                      <Grid3X3 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSimulations.length} of {simulations.length} simulations
          </p>
          {searchTerm && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
              Clear search
            </Badge>
          )}
        </div>

        {/* Simulations Grid */}
        {filteredSimulations.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No simulations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "grid grid-cols-1 gap-4"
          }>
            {filteredSimulations.map((simulation) => (
              <SimulationCard key={simulation.id} simulation={simulation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}