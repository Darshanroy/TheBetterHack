
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, CreditCard, Shield, UserCog } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Settings</h1>
      <p className="text-muted-foreground">Manage your account and notification preferences.</p>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5"/> Account</CardTitle>
          <CardDescription>Update your login information and basic details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="contact@greenvalley.farm" />
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

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <Label htmlFor="new-orders" className="flex flex-col space-y-1">
               <span>New Orders</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Receive an email when a new order is placed.
               </span>
             </Label>
             <Switch id="new-orders" defaultChecked />
           </div>
           <Separator />
            <div className="flex items-center justify-between">
             <Label htmlFor="crop-requests" className="flex flex-col space-y-1">
               <span>New Crop Requests</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Get notified about new consumer crop requests.
               </span>
             </Label>
             <Switch id="crop-requests" defaultChecked />
           </div>
           <Separator />
           <div className="flex items-center justify-between">
             <Label htmlFor="promotions" className="flex flex-col space-y-1">
               <span>Promotions & Updates</span>
               <span className="font-normal leading-snug text-muted-foreground">
                 Receive occasional updates and promotional offers from FarmConnect.
               </span>
             </Label>
             <Switch id="promotions" />
           </div>
        </CardContent>
         <CardFooter>
           <Button>Save Notification Preferences</Button>
        </CardFooter>
      </Card>

       {/* Payment Settings Placeholder */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payments</CardTitle>
          <CardDescription>Manage your payout methods (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Payment integration coming soon.</p>
        </CardContent>
      </Card>

      {/* Security Settings Placeholder */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Security</CardTitle>
          <CardDescription>Manage account security options (Placeholder).</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Security features like two-factor authentication coming soon.</p>
        </CardContent>
      </Card>

    </div>
  );
}
