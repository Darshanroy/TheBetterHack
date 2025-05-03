
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function FarmerHomePage() {
  // TODO: Fetch actual data for the logged-in farmer
  const farmerData = {
      activeProducts: 25,
      productChange: 3,
      recentOrders: 12,
      upcomingEventName: "Ugadi Harvest Sale",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Farmer Dashboard</h1>
      <p className="text-muted-foreground">Welcome back! Here's an overview of your farm activity in Bangalore.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{farmerData.activeProducts}</p>
            <p className="text-xs text-muted-foreground">+{farmerData.productChange} from last week</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Recent Orders (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{farmerData.recentOrders}</p>
             <p className="text-xs text-muted-foreground">View details</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">1</p>
             <p className="text-xs text-muted-foreground">{farmerData.upcomingEventName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for recent activity feed or charts */}
       <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
        <CardContent>
           {/* TODO: Replace with actual activity feed */}
           <ul className="text-sm text-muted-foreground space-y-2">
                <li>New order (#ORD-123) for Nati Tomatoes received.</li>
                <li>Post "Mango Season Starts!" reached 50 likes.</li>
                <li>Consumer requested Tender Coconuts in Jayanagar.</li>
           </ul>
          {/* <p className="text-muted-foreground">No recent activity to display.</p> */}
        </CardContent>
      </Card>
    </div>
  );
}

    