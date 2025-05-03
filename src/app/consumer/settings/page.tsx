
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, CreditCard, Shield, UserCog, MapPin } from 'lucide-react';

export default function SettingsPage() {
  // TODO: Fetch actual user data
  const user = {
      name: "Priya Sharma",
      email: "priya.s@email.com",
      address: "456, 12th Main Rd, Indiranagar, Bangalore 560038",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Settings</h1>
      <p className="text-muted-foreground">Manage your account and preferences.</p>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5"/> Account</CardTitle>
          <CardDescription>Update your login information and basic details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" defaultValue={user.name} />
          </div>
           <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue={user.email} />
          </div>
           <div>
            <Label htmlFor="password">Password</Label>
            <Button variant="outline" size="sm" className="ml-4">Change Password</Button>
          </div>
        </CardContent>
        <CardFooter>
           <Button>Save Account Changes</Button>
        </CardFooter>
      </Card>

       {/* Address Settings */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Addresses</CardTitle>
          <CardDescription>Manage your saved delivery addresses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Placeholder for address list */}
            <div className="p-4 border rounded-md text-sm">
                <p className="font-medium">Home</p>
                <p className="text-muted-foreground">{user.address}</p>
                <div className="mt-2 space-x-2">
                    <Button variant="link" className="p-0 h-auto text-xs">Edit</Button>
                    <Button variant="link" className="p-0 h-auto text-xs text-destructive">Remove</Button>
                </div>
            </div>
            <Button variant="outline" size="sm">Add New Address</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <Label htmlFor="order-updates" className="flex flex-col space-y-1">
               <span>Order Updates</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Receive updates about your orders (status, delivery).
               </span>
             </Label>
             <Switch id="order-updates" defaultChecked />
           </div>
           <Separator />
            <div className="flex items-center justify-between">
             <Label htmlFor="farmer-posts" className="flex flex-col space-y-1">
               <span>New Posts from Farmers</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Get notified when farmers you follow post updates.
               </span>
             </Label>
             <Switch id="farmer-posts" />
           </div>
           <Separator />
           <div className="flex items-center justify-between">
             <Label htmlFor="promotions" className="flex flex-col space-y-1">
               <span>FarmConnect Promotions</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Receive news, offers, and recommendations from FarmConnect.
               </span>
             </Label>
             <Switch id="promotions" defaultChecked/>
           </div>
        </CardContent>
         <CardFooter>
           <Button>Save Notification Preferences</Button>
        </CardFooter>
      </Card>

       {/* Payment Settings Placeholder */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payment Methods</CardTitle>
          <CardDescription>Manage your saved cards & UPI (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Payment method management (Cards, UPI) coming soon.</p>
        </CardContent>
      </Card>

      {/* Security Settings Placeholder */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Security</CardTitle>
          <CardDescription>Manage account security options (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Security features coming soon.</p>
        </CardContent>
      </Card>

    </div>
  );
}

    