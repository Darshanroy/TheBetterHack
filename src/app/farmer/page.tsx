
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function FarmerHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Farmer Dashboard</h1>
      <p className="text-muted-foreground">Welcome back! Here's an overview of your farm activity.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">15</p>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">8</p>
             <p className="text-xs text-muted-foreground">View details</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">1</p>
             <p className="text-xs text-muted-foreground">Harvest Festival</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for recent activity feed or charts */}
       <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>
    </div>
  );
}
