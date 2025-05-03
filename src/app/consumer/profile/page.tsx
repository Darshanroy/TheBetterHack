
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Edit2, Settings, Heart, MapPin, Apple, Carrot, X, ChevronDown, Check } from "lucide-react";
import { INDIAN_DISEASES, type Disease } from '@/lib/constants';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { getDietaryRecommendations, type DietaryRecommendationInput } from '@/ai/flows/dietary-recommendation'; // Import AI flow
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define Consumer Profile Type
interface ConsumerProfile {
    name: string;
    email: string;
    location: string;
    avatarUrl: string;
    dietaryGoals: string;
    healthConditions: Disease[];
}


export default function ConsumerProfilePage() {
  // Fetch consumer data in a real app - using state initialized from localStorage or defaults
  const [consumer, setConsumer] = useState<ConsumerProfile>({
    name: "Priya Sharma",
    email: "priya.s@email.com",
    location: "Indiranagar, Bangalore", // Updated location
    avatarUrl: "https://picsum.photos/seed/priya/200/200",
    dietaryGoals: "Eat healthier, more local Bangalore produce.",
    healthConditions: [], // Initialize empty, load from storage
  });

  const [selectedDiseases, setSelectedDiseases] = useState<Set<Disease>>(new Set());
  const [openDiseasePopover, setOpenDiseasePopover] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<{ recommendations: string[]; explanation: string } | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const { toast } = useToast();

   // Load profile from localStorage on initial mount
    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('consumerProfile');
            if (savedProfile) {
                const parsedProfile: ConsumerProfile = JSON.parse(savedProfile);
                 // Ensure healthConditions is always an array
                if (!Array.isArray(parsedProfile.healthConditions)) {
                    parsedProfile.healthConditions = [];
                }
                setConsumer(parsedProfile);
                setSelectedDiseases(new Set(parsedProfile.healthConditions));
            }
        } catch (error) {
            console.error("Error loading profile from localStorage:", error);
            // Keep default state if loading fails
        }
    }, []); // Empty dependency array ensures this runs only once on mount

   // Function to update profile state and save to localStorage
  const updateProfile = (field: keyof ConsumerProfile, value: any) => {
    setConsumer(prev => {
      const updatedProfile = { ...prev, [field]: value };
      // Save to localStorage whenever the profile state changes
      try {
         localStorage.setItem('consumerProfile', JSON.stringify(updatedProfile));
         console.log('Profile saved to localStorage');
      } catch (error) {
          console.error("Error saving profile to localStorage:", error);
          toast({
             title: "Storage Error",
             description: "Could not save profile changes locally.",
             variant: "destructive",
          });
      }
      return updatedProfile;
    });
  };

   // Update profile when selected diseases change
   useEffect(() => {
       const newHealthConditions = Array.from(selectedDiseases);
       // Only call updateProfile if the conditions actually changed
       if (JSON.stringify(newHealthConditions) !== JSON.stringify(consumer.healthConditions)) {
           updateProfile('healthConditions', newHealthConditions);
       }
       // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedDiseases]); // Depend only on selectedDiseases set


   const handleDiseaseSelect = (disease: Disease) => {
     setSelectedDiseases(prev => {
       const next = new Set(prev);
       if (next.has(disease)) {
         next.delete(disease);
       } else {
         next.add(disease);
       }
       // The useEffect hook above will handle calling updateProfile
       return next;
     });
     // Keep popover open for multi-select
     // setOpenDiseasePopover(false);
   };

   const handleGenerateRecommendations = async () => {
       setIsLoadingRecommendations(true);
       setAiRecommendations(null);
       try {
           const input: DietaryRecommendationInput = {
                healthConditions: Array.from(selectedDiseases),
                dietaryGoals: consumer.dietaryGoals || "General healthy eating", // Provide default if empty
           };
           const result = await getDietaryRecommendations(input);
           setAiRecommendations(result);
           toast({
               title: "Recommendations Ready!",
               description: "AI has generated personalized fruit and vegetable recommendations.",
           });
       } catch (error) {
           console.error("Failed to get AI recommendations:", error);
           toast({
               title: "AI Error",
               description: "Could not generate recommendations. Please try again.",
               variant: "destructive",
           });
       } finally {
           setIsLoadingRecommendations(false);
       }
   };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">My Profile</h1>
           <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
           </Button>
      </div>


      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={consumer.avatarUrl} alt={consumer.name} data-ai-hint="person portrait india"/>
              <AvatarFallback>{consumer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{consumer.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/> {consumer.location}</p>
            </div>
             {/* TODO: Implement edit functionality */}
            {/* <Button variant="ghost" size="icon" className="ml-auto">
                <Edit2 className="h-4 w-4" />
                 <span className="sr-only">Edit Basic Info</span>
            </Button> */}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
           <Separator />

           {/* Dietary Goals */}
           <div>
                <Label htmlFor="dietaryGoals">Dietary Goals</Label>
                <Textarea
                    id="dietaryGoals"
                    placeholder="e.g., Lose weight, increase fiber intake, manage blood sugar..."
                    value={consumer.dietaryGoals} // Use controlled component
                    className="h-20 resize-none mt-1"
                    onChange={(e) => updateProfile('dietaryGoals', e.target.value)} // Update on change
                />
                 <FormDescription className="text-xs mt-1">
                    Describe your health and eating objectives. This helps tailor recommendations.
                 </FormDescription>
           </div>

           {/* Health Conditions */}
             <div>
                 <Label>Health Conditions (Optional)</Label>
                 <Popover open={openDiseasePopover} onOpenChange={setOpenDiseasePopover}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openDiseasePopover}
                            className="w-full justify-between mt-1 h-auto min-h-10"
                            >
                            <div className="flex flex-wrap gap-1">
                                {selectedDiseases.size === 0 && <span className="text-muted-foreground">Select conditions...</span>}
                                {Array.from(selectedDiseases).map((disease) => (
                                    <Badge key={disease} variant="secondary" className="mr-1 mb-1"> {/* Added mb-1 */}
                                        {disease}
                                         {/* Add a small 'x' to remove */}
                                        <button
                                            type="button"
                                            className="ml-1 p-0.5 rounded-full hover:bg-destructive/20"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent popover trigger
                                                handleDiseaseSelect(disease);
                                            }}
                                             aria-label={`Remove ${disease}`}
                                        >
                                             <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                       <Command>
                            <CommandInput placeholder="Search conditions..." />
                            <CommandList>
                                <CommandEmpty>No condition found.</CommandEmpty>
                                <CommandGroup>
                                    {INDIAN_DISEASES.map((disease) => (
                                    <CommandItem
                                        key={disease}
                                        value={disease}
                                        onSelect={() => {
                                            handleDiseaseSelect(disease);
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedDiseases.has(disease) ? "opacity-100" : "opacity-0"
                                        )}
                                        />
                                        {disease}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                       </Command>
                    </PopoverContent>
                </Popover>
                <FormDescription className="text-xs mt-1">
                    Select any relevant health conditions to personalize recommendations and cart warnings. Changes are saved automatically.
                </FormDescription>
            </div>

             {/* AI Recommendations Section */}
            <div>
                 <Button onClick={handleGenerateRecommendations} disabled={isLoadingRecommendations} className="w-full md:w-auto">
                    {isLoadingRecommendations ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-accent-foreground" />
                    )}
                    Get AI Fruit & Veg Recommendations
                </Button>

                {isLoadingRecommendations && (
                    <Card className="mt-4 animate-pulse bg-secondary/30">
                        <CardHeader><CardTitle className="text-sm">Generating Recommendations...</CardTitle></CardHeader>
                         <CardContent className="space-y-2">
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                            <div className="h-3 bg-muted rounded w-full"></div>
                             <div className="h-3 bg-muted rounded w-2/3"></div>
                        </CardContent>
                    </Card>
                )}

                 {aiRecommendations && !isLoadingRecommendations && (
                    <Card className="mt-4 border-primary border-l-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Apple className="text-primary h-5 w-5"/>
                                <Carrot className="text-primary h-5 w-5"/>
                                Personalized Recommendations
                            </CardTitle>
                            <CardDescription>Based on your goals and conditions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-sm mb-1">Recommended Fruits & Vegetables:</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {aiRecommendations.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold text-sm mb-1">Explanation:</h4>
                                <p className="text-sm text-muted-foreground">{aiRecommendations.explanation}</p>
                            </div>
                        </CardContent>
                    </Card>
                 )}
             </div>


        </CardContent>
      </Card>

      {/* Placeholder Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-destructive"/> Liked Posts</CardTitle>
                <CardDescription>Posts you've liked.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground text-sm">No liked posts yet.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                 <CardDescription>Your past purchases.</CardDescription>
            </CardHeader>
             <CardContent>
                 <p className="text-muted-foreground text-sm">No orders found.</p>
            </CardContent>
          </Card>
      </div>

    </div>
  );
}

// Add FormDescription component if not already globally available
function FormDescription({ children, className }: { children: React.ReactNode, className?: string }) {
    return <p className={cn("text-[0.8rem] text-muted-foreground", className)}>{children}</p>;
}

    