
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarPlus, HandCoins } from 'lucide-react'; // Example icons

export default function OrganizePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Organize Activities</h1>
      <p className="text-muted-foreground">Manage your farm events and fundraising campaigns.</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Upcoming</div>
            <p className="text-xs text-muted-foreground">
              Manage farm tours, workshops, or festivals.
            </p>
             {/* Add Button or Link to manage events */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fundraising</CardTitle>
             <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">1 Active</div>
            <p className="text-xs text-muted-foreground">
              Create and manage campaigns for farm projects.
            </p>
            {/* Add Button or Link to manage fundraising */}
          </CardContent>
        </Card>
      </div>

       {/* Placeholder for list of events/campaigns */}
       <Card>
         <CardHeader>
           <CardTitle>Activity List</CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">No events or campaigns created yet.</p>
           {/* Add Button to create new */}
         </CardContent>
       </Card>
    </div>
  );
}
