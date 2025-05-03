
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { RadioTower, Video, Mic, Settings } from "lucide-react";

export default function LivestreamPage() {
  // In a real app, you'd use state to manage stream status, settings, etc.
  const isStreaming = false; // Example state

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-secondary-foreground">Start Livestream</h2>
      <p className="text-muted-foreground mb-6">
        Connect with your customers in real-time! Show off your farm, answer questions, or host a live sale.
      </p>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioTower className="text-accent" />
            Livestream Setup
          </CardTitle>
          <CardDescription>
            Configure your stream settings and go live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder for Video Preview */}
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
             <Video className="h-16 w-16" />
             <span className="ml-2">Video Preview Area</span>
          </div>

          {/* Placeholder for Stream Settings */}
           <div className="space-y-4">
              <h3 className="text-lg font-medium">Settings</h3>
              <div className="flex items-center justify-between p-3 border rounded-md">
                 <span>Camera</span>
                 <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4"/> Configure</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                 <span>Microphone</span>
                 <Button variant="outline" size="sm"><Mic className="mr-2 h-4 w-4"/> Configure</Button>
              </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                 <span>Stream Title</span>
                 <input type="text" placeholder="e.g., Live Q&A from the Orchard" className="flex-1 mx-4 p-1 border rounded text-sm"/>
                 <Button variant="outline" size="sm">Set</Button>
              </div>
           </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {isStreaming ? (
            <Button variant="destructive" size="lg">Stop Streaming</Button>
          ) : (
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Go Live
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
