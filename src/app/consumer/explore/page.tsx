
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { Search, SlidersHorizontal } from 'lucide-react';

// Example search results
const results = [
  { id: 'p1', type: 'product', name: 'Organic Gala Apples', image: 'https://picsum.photos/seed/gala/300/300', farmer: 'Sunny Orchards' },
  { id: 'p2', type: 'product', name: 'Heirloom Tomatoes', image: 'https://picsum.photos/seed/tomatoes/300/300', farmer: 'Green Valley Farms' },
  { id: 'f1', type: 'farmer', name: 'Sunny Orchards', image: 'https://picsum.photos/seed/sunny/300/300', location: 'Hudson Valley, NY' },
  { id: 'p3', type: 'product', name: 'Fresh Basil', image: 'https://picsum.photos/seed/basil/300/300', farmer: 'Rooted Vegetables' },
  { id: 'p4', type: 'product', name: 'Sweet Corn', image: 'https://picsum.photos/seed/corn/300/300', farmer: 'Green Valley Farms' },
  { id: 'f2', type: 'farmer', name: 'Rooted Vegetables', image: 'https://picsum.photos/seed/rooted/300/300', location: 'Local Greenhouse' },
];

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search for fruits, vegetables, or farmers..." className="pl-10 pr-16 h-12 text-base" />
         <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8">
            <SlidersHorizontal className="h-5 w-5"/>
            <span className="sr-only">Filters</span>
         </Button>
      </div>

       {/* Placeholder for suggested categories or filters */}
       <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
           <Button variant="secondary" size="sm">Fruits</Button>
           <Button variant="secondary" size="sm">Vegetables</Button>
           <Button variant="secondary" size="sm">Organic</Button>
           <Button variant="secondary" size="sm">Local</Button>
            <Button variant="secondary" size="sm">Berries</Button>
            <Button variant="secondary" size="sm">Greens</Button>
       </div>

      {/* Grid for results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
        {results.map(item => (
          <Card key={item.id} className="overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                 <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                   data-ai-hint={item.type === 'product' ? "fruits vegetables product" : "farmer profile"}
                />
                 {/* Optional overlay for name/info */}
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white">
                     <p className="text-xs font-semibold truncate">{item.name}</p>
                     {item.type === 'product' && <p className="text-xs opacity-80">by {item.farmer}</p>}
                     {item.type === 'farmer' && <p className="text-xs opacity-80">{item.location}</p>}
                 </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
