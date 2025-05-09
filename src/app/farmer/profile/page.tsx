
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Edit2, IndianRupee, Eye, Users, ShoppingBag } from "lucide-react"; // Use IndianRupee

export default function FarmerProfilePage() {
  // Fetch farmer data in a real app
  const farmer = {
    name: "Namma Farmer Store",
    email: "contact@nammafarmer.blr",
    bio: "Your local source for fresh, naturally grown vegetables and fruits in Jayanagar, Bangalore. We partner directly with farmers.",
    avatarUrl: "https://picsum.photos/seed/namma-farmer/200/200",
    location: "Jayanagar, Bangalore",
  };

  // Example Dashboard Metrics
  const metrics = {
      profileViews: 1200,
      productsSold: 150,
      totalRevenue: 45800, // In INR
      followers: 350,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Farm Profile</h1>
      <p className="text-muted-foreground">Manage your public farm profile information.</p>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <CardTitle>Profile Details</CardTitle>
              <Button variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
          </div>
           <CardDescription>This information will be visible to consumers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={farmer.avatarUrl} alt={farmer.name} data-ai-hint="farm logo india bangalore" />
              <AvatarFallback>{farmer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{farmer.name}</h2>
              <p className="text-sm text-muted-foreground">{farmer.location}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
             <div>
                <Label htmlFor="farmName">Farm/Store Name</Label>
                <Input id="farmName" defaultValue={farmer.name} readOnly/>
             </div>
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" type="email" defaultValue={farmer.email} readOnly/>
             </div>
          </div>
           <div>
                <Label htmlFor="bio">Farm Bio</Label>
                <Textarea id="bio" defaultValue={farmer.bio} readOnly className="h-24 resize-none"/>
             </div>
            <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" defaultValue={farmer.location} readOnly/>
             </div>
        </CardContent>
      </Card>

       {/* Dashboard Metrics */}
       <Card>
         <CardHeader>
           <CardTitle>Dashboard Metrics</CardTitle>
            <CardDescription>A quick overview of your performance.</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-md">
                     <Eye className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Profile Views</p>
                    <p className="text-2xl font-bold">{metrics.profileViews.toLocaleString('en-IN')}</p>
                </div>
                 <div className="text-center p-4 border rounded-md">
                     <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Products Sold</p>
                    <p className="text-2xl font-bold">{metrics.productsSold.toLocaleString('en-IN')}</p>
                </div>
                 <div className="text-center p-4 border rounded-md">
                      <IndianRupee className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                 <div className="text-center p-4 border rounded-md">
                      <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Followers</p>
                    <p className="text-2xl font-bold">{metrics.followers.toLocaleString('en-IN')}</p>
                </div>
            </div>
         </CardContent>
       </Card>
    </div>
  );
}

    