
'use client'; // Mark as client component for state management

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Disease } from '@/lib/constants'; // Import Disease type
import { useToast } from '@/hooks/use-toast'; // For showing errors

// Example Cart Item Data
interface CartItem {
    id: string;
    name: string;
    price: number; // Price in INR
    quantity: number;
    imageUrl: string;
    farmerName: string;
}

// Health Check Result
interface ItemHealthStatus {
    status: 'good' | 'warning';
    explanation: string;
}

// Example initial cart state (Updated for India/Bangalore)
const initialCartItems: CartItem[] = [
    { id: 'p1', name: 'Organic Kashmiri Apples', price: 150, quantity: 1, imageUrl: 'https://picsum.photos/seed/kashmiri-apples/100/100', farmerName: 'Himalayan Orchards' },
    { id: 'p3', name: 'Fresh Tulsi (Holy Basil)', price: 30, quantity: 1, imageUrl: 'https://picsum.photos/seed/tulsi/100/100', farmerName: 'Ayur Greens Bangalore' },
    { id: 'p5', name: 'Dried Raisins (Kishmish)', price: 100, quantity: 1, imageUrl: 'https://picsum.photos/seed/raisins/100/100', farmerName: 'Dry Fruitwala & Co.' }, // Added Raisins for demo
];

// Simulate fetching consumer profile (replace with actual fetch/context)
const getConsumerProfile = async (): Promise<{ diseases: Disease[] }> => {
    console.log("Fetching consumer profile...");
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate fetch delay
    // In a real app, fetch from user state/API/localStorage
    // For demo, let's hardcode or read from local storage if set by profile page
    try {
        const profileData = localStorage.getItem('consumerProfile');
        if (profileData) {
             const parsed = JSON.parse(profileData);
             // Ensure diseases is an array, even if empty
             return { diseases: Array.isArray(parsed.healthConditions) ? parsed.healthConditions : [] };
        }
    } catch (e) {
        console.error("Error reading profile from localStorage", e);
    }
    // Default if not found or error
    return { diseases: [] };
};


// Simulate API call to check cart item health based on diseases
const checkCartItemHealth = async (diseases: Disease[], items: CartItem[]): Promise<Record<string, ItemHealthStatus>> => {
    console.log("API Call: Checking cart health for diseases:", diseases);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

    const results: Record<string, ItemHealthStatus> = {};
    const hasDiabetes = diseases.includes("Diabetes Mellitus");

    items.forEach(item => {
        let status: 'good' | 'warning' = 'good';
        let explanation = `${item.name} is generally considered healthy.`;

        // Example Rule: Raisins and Diabetes
        if (item.name.toLowerCase().includes('raisins') && hasDiabetes) {
            status = 'warning';
            explanation = `Raisins are high in natural sugars and have a moderate glycemic index. While they offer nutrients, consuming them in large quantities might significantly raise blood sugar levels for individuals with Diabetes Mellitus. Moderation is key, and it's advisable to consult with a doctor or dietitian.`;
        }

        // Add more rules here for other diseases and items...
        // Example: High Sodium item and Hypertension

        results[item.id] = { status, explanation };
    });

    console.log("API Response:", results);
    return results;
};


export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [consumerDiseases, setConsumerDiseases] = useState<Disease[]>([]);
  const [itemHealthStatus, setItemHealthStatus] = useState<Record<string, ItemHealthStatus>>({});
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [selectedWarningItem, setSelectedWarningItem] = useState<ItemHealthStatus | null>(null);
  const { toast } = useToast();

   // Fetch consumer profile and check cart health on mount and when cart/diseases change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingHealth(true);
      try {
        const profile = await getConsumerProfile();
        setConsumerDiseases(profile.diseases); // Store diseases

        if (cartItems.length > 0 && profile.diseases.length > 0) {
             const healthResults = await checkCartItemHealth(profile.diseases, cartItems);
             setItemHealthStatus(healthResults);
        } else {
            // Clear status if no items or no diseases
             setItemHealthStatus({});
        }

      } catch (error) {
        console.error("Error fetching data or checking health:", error);
         toast({
            title: "Error",
            description: "Could not load health information for cart items.",
            variant: "destructive",
         });
         setItemHealthStatus({}); // Clear status on error
      } finally {
        setIsLoadingHealth(false);
      }
    };

    fetchData();
  }, [cartItems, toast]); // Rerun when cart items change

  // Refetch profile if potentially updated (e.g., user navigates back after profile change)
   useEffect(() => {
     const handleFocus = () => {
         console.log("Window focused, refetching profile for cart...");
         getConsumerProfile().then(profile => {
             // Only trigger API call if diseases actually changed and cart has items
             if (JSON.stringify(profile.diseases) !== JSON.stringify(consumerDiseases) && cartItems.length > 0) {
                 console.log("Diseases changed, re-checking cart health...");
                 setConsumerDiseases(profile.diseases); // Update local state first
                 setIsLoadingHealth(true);
                 checkCartItemHealth(profile.diseases, cartItems)
                    .then(setItemHealthStatus)
                    .catch(error => {
                         console.error("Error re-checking health:", error);
                         toast({ title: "Error", description: "Could not update health info.", variant: "destructive" });
                         setItemHealthStatus({});
                     })
                    .finally(() => setIsLoadingHealth(false));
             } else if (cartItems.length > 0 && profile.diseases.length === 0 && Object.keys(itemHealthStatus).length > 0) {
                 // If diseases were removed, clear the warnings
                 console.log("Diseases removed, clearing health status...");
                 setItemHealthStatus({});
                 setConsumerDiseases([]);
             } else {
                 // Update local disease state even if no change required for API call
                 setConsumerDiseases(profile.diseases);
             }
         }).catch(e => console.error("Error refetching profile on focus", e));
     };

     window.addEventListener('focus', handleFocus);
     return () => {
       window.removeEventListener('focus', handleFocus);
     };
   }, [consumerDiseases, cartItems, itemHealthStatus, toast]); // Depend on current diseases state


  const handleQuantityChange = (id: string, change: number) => {
    setCartItems(currentItems =>
      currentItems.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) } // Ensure quantity doesn't go below 1
          : item
      ).filter(item => item.quantity > 0) // Optionally remove if quantity hits 0 via '-'
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(currentItems => currentItems.filter(item => item.id !== id));
     // Also remove from health status if present
    setItemHealthStatus(prev => {
        const next = {...prev};
        delete next[id];
        return next;
    });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  // Note: Tax calculation might vary significantly in India (GST)
  const estimatedTax = subtotal * 0.05; // Example 5% GST (adjust as needed)
  const total = subtotal + estimatedTax; // Add shipping later if needed

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><ShoppingBag /> Your Cart</h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
             <Card>
                 <CardHeader>
                     <CardTitle>Items ({cartItems.length})</CardTitle>
                     {isLoadingHealth && (
                        <CardDescription className="flex items-center text-muted-foreground text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking health compatibility...
                        </CardDescription>
                     )}
                      {!isLoadingHealth && consumerDiseases.length > 0 && Object.keys(itemHealthStatus).length > 0 && (
                         <CardDescription className="text-sm text-muted-foreground">
                             Health warnings based on your profile are shown below.
                         </CardDescription>
                     )}
                      {!isLoadingHealth && consumerDiseases.length === 0 && (
                         <CardDescription className="text-sm text-muted-foreground">
                              <a href="/consumer/profile" className="underline text-primary hover:text-primary/80">Add health conditions</a> in your profile for personalized warnings.
                         </CardDescription>
                     )}
                 </CardHeader>
                 <CardContent className="divide-y">
                      {cartItems.map(item => {
                        const healthInfo = itemHealthStatus[item.id];
                        return (
                            <div key={item.id} className="flex items-center gap-4 py-4">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                                data-ai-hint="fruits vegetables product india"
                            />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                     <p className="font-medium">{item.name}</p>
                                     {/* Health Status Icon */}
                                     {!isLoadingHealth && healthInfo && (
                                         healthInfo.status === 'warning' ? (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button onClick={() => setSelectedWarningItem(healthInfo)}>
                                                        <AlertTriangle className="h-5 w-5 text-orange-500 cursor-pointer" />
                                                    </button>
                                                </AlertDialogTrigger>
                                                {/* Modal Content is defined later */}
                                            </AlertDialog>

                                         ) : (
                                             <CheckCircle className="h-5 w-5 text-green-600" />
                                         )
                                     )}
                                </div>
                                <p className="text-xs text-muted-foreground">From: {item.farmerName}</p>
                                <p className="text-sm font-semibold">₹{item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2 border rounded-md p-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleQuantityChange(item.id, -1)}
                                    disabled={item.quantity <= 1}
                                    >
                                    <Minus className="h-4 w-4"/>
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleQuantityChange(item.id, 1)}
                                    >
                                    <Plus className="h-4 w-4"/>
                                </Button>
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        );
                      })}
                 </CardContent>
             </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 sticky top-20"> {/* Make summary sticky on large screens */}
             <Card>
               <CardHeader>
                 <CardTitle>Order Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span>Subtotal</span>
                   <span>₹{subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span>Estimated GST</span>
                   <span>₹{estimatedTax.toFixed(2)}</span>
                 </div>
                 {/* TODO: Add Shipping calculation */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                   <span>Shipping</span>
                   <span>Calculated at checkout</span>
                 </div>
                 <Separator />
                 <div className="flex justify-between font-semibold text-base">
                   <span>Total</span>
                   <span>₹{total.toFixed(2)}</span>
                 </div>
               </CardContent>
               <CardFooter>
                 <Button size="lg" className="w-full">Proceed to Checkout</Button>
               </CardFooter>
             </Card>
          </div>
        </div>
      ) : (
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4"/>
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-4">Looks like you haven't added anything yet.</p>
                <Button asChild>
                    <a href="/consumer/explore">Start Shopping</a>
                </Button>
            </CardContent>
        </Card>
      )}

       {/* Health Warning Modal */}
      <AlertDialog open={!!selectedWarningItem} onOpenChange={(open) => !open && setSelectedWarningItem(null)}>
         <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-orange-500" /> Health Caution
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {selectedWarningItem?.explanation || "Details about why this item might need caution based on your profile."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setSelectedWarningItem(null)}>Okay, Got It</AlertDialogAction>
                   {/* Optional: Add a button to remove item directly */}
                   {/* <AlertDialogCancel onClick={() => { handleRemoveItem(item.id); setSelectedWarningItem(null); }}>Remove Item</AlertDialogCancel> */}
              </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    