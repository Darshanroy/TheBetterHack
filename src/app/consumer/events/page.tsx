
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { CalendarCheck2, Ticket, MapPin } from 'lucide-react';

// Example Event Data (India/Bangalore focused)
interface Event {
    id: string;
    name: string;
    description: string;
    date: string; // Or Date object
    location: string;
    imageUrl: string;
    farmerName: string;
}

const events: Event[] = [
    {
        id: 'e1',
        name: 'Weekend Mango Mela',
        description: 'Enjoy the best mangoes of the season! Banganapalli, Alphonso, Malgova & more. Also includes stalls for organic products.',
        date: 'May 25-26, 2024',
        location: 'Freedom Park, Bangalore',
        imageUrl: 'https://picsum.photos/seed/mango-mela-bangalore/400/200',
        farmerName: 'Karnataka State Mango Board & Farmers',
    },
    {
        id: 'e2',
        name: 'Urban Farming Workshop: Microgreens',
        description: 'Learn to grow nutritious microgreens in your apartment. Hands-on session with take-home kit.',
        date: 'June 9, 2024, Sunday - 10 AM',
        location: 'The Organic World Store, HSR Layout',
        imageUrl: 'https://picsum.photos/seed/microgreens-workshop-bangalore/400/200',
        farmerName: 'Urban Green Thumb',
    },
     {
        id: 'e3',
        name: 'Visit a Coconut Grove near Bangalore',
        description: 'Experience a day at a coconut farm near Bangalore. Learn about coconut farming, enjoy fresh tender coconut water.',
        date: 'June 16, 2024, Sunday',
        location: 'Near Ramanagara (Transport options available)',
        imageUrl: 'https://picsum.photos/seed/coconut-grove-bangalore/400/200',
        farmerName: 'Local Coconut Farmers Initiative',
    },
];

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Upcoming Events</h1>
      <p className="text-muted-foreground">Discover workshops, melas, and farm visits happening in and around Bangalore.</p>

       {/* Placeholder for Requesting specific crops/products */}
       <Card className="bg-secondary/50 border-primary border-l-4">
           <CardHeader>
               <CardTitle>Looking for something specific?</CardTitle>
               <CardDescription>Let local Bangalore farmers know what fruits or vegetables you're interested in.</CardDescription>
           </CardHeader>
           <CardContent>
               {/* TODO: Add a form or button to submit a crop request */}
               <Button variant="default">Request a Product</Button>
           </CardContent>
       </Card>


      <div className="space-y-4">
         {events.length > 0 ? events.map(event => (
            <Card key={event.id} className="overflow-hidden md:flex md:items-start">
                 <div className="md:w-1/3 md:flex-shrink-0">
                    <Image
                        src={event.imageUrl}
                        alt={event.name}
                        width={400}
                        height={200}
                        className="w-full h-48 md:h-full object-cover"
                         data-ai-hint="farm event festival mela workshop india bangalore"
                    />
                </div>
                <div className="flex flex-col justify-between p-4 md:p-6 flex-1">
                    <div>
                        <CardTitle className="text-xl mb-1">{event.name}</CardTitle>
                         <CardDescription className="text-xs text-muted-foreground mb-2">Hosted by {event.farmerName}</CardDescription>
                        <p className="text-sm text-foreground mb-3">{event.description}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4" /> {event.date}</p>
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</p>
                        </div>
                    </div>
                    <CardFooter className="p-0 pt-4 flex justify-end">
                         {/* TODO: Update button text/action based on event type */}
                         <Button size="sm">
                           <Ticket className="mr-2 h-4 w-4"/> Get Details / Register
                        </Button>
                    </CardFooter>
                </div>
            </Card>
         )) : (
             <p className="text-muted-foreground text-center py-8">No upcoming events found.</p>
         )}
      </div>
    </div>
  );
}

     