'use client'; // Mark as client component for state management

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Added AlertDialogFooter
import { useToast } from '@/hooks/use-toast'; // For showing errors
import { prisma } from '@/lib/prisma';
import { Product } from '@/services/products';

// Example Cart Item Data
interface CartItem extends Product {
    quantity: number;
}

// Health Check Result
interface ItemHealthStatus {
    status: 'good' | 'warning';
    explanation: string;
}

interface CartItemWithProduct {
    id: string;
    quantity: number;
    product: Product;
}

// Simulate API call to check cart item health based on diseases
const checkCartItemHealth = async (diseases: string[], items: CartItem[]): Promise<Record<string, ItemHealthStatus>> => {
    console.log("API Call: Checking cart health for diseases:", diseases);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

    const results: Record<string, ItemHealthStatus> = {};
    const hasDiabetes = diseases.includes("Diabetes Mellitus");

    items.forEach((item: CartItem) => {
        let status: 'good' | 'warning' = 'good';
        let explanation = `${item.name} is generally considered healthy.`;

        // Example Rule: Raisins and Diabetes
        if (item.name.toLowerCase().includes('raisins') && hasDiabetes) {
            status = 'warning';
            explanation = `Raisins are high in natural sugars and have a moderate glycemic index. While they offer nutrients, consuming them in large quantities might significantly raise blood sugar levels for individuals with Diabetes Mellitus. Moderation is key, and it's advisable to consult with a doctor or dietitian.`;
        }

        results[item.id] = { status, explanation };
    });

    return results;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [consumerDiseases, setConsumerDiseases] = useState<string[]>([]);
  const [itemHealthStatus, setItemHealthStatus] = useState<Record<string, ItemHealthStatus>>({});
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [selectedWarningItem, setSelectedWarningItem] = useState<ItemHealthStatus | null>(null);
  const { toast } = useToast();

   // Fetch cart items from API
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch('/api/cart')
        if (!response.ok) throw new Error('Failed to fetch cart items')
        const items = await response.json()

        setCartItems(items.map((item: CartItemWithProduct) => ({
          ...item.product,
          quantity: item.quantity
        } as CartItem)))
      } catch (error) {
        console.error('Error fetching cart items:', error)
        toast({
          title: "Error",
          description: "Could not load cart items.",
          variant: "destructive",
        })
      }
    }

    fetchCartItems()
  }, [toast])

  // Fetch consumer profile and check cart health
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingHealth(true)
      try {
        const response = await fetch('/api/consumer/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        const profile = await response.json()

        if (profile) {
          const diseases = JSON.parse(profile.healthConditions || '[]')
          setConsumerDiseases(diseases)

          if (cartItems.length > 0 && diseases.length > 0) {
            const healthResults = await checkCartItemHealth(diseases, cartItems)
            setItemHealthStatus(healthResults)
          } else {
            setItemHealthStatus({})
          }
        }
      } catch (error) {
        console.error("Error fetching data or checking health:", error)
        toast({
          title: "Error",
          description: "Could not load health information for cart items.",
          variant: "destructive",
        })
        setItemHealthStatus({})
      } finally {
        setIsLoadingHealth(false)
      }
    }

    fetchData()
  }, [cartItems, toast])

  // Refetch profile if potentially updated
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, refetching profile for cart...")
      fetch('/api/consumer/profile')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch profile')
          return response.json()
        })
        .then(profile => {
          if (profile) {
            const diseases = JSON.parse(profile.healthConditions || '[]')
            // Only trigger API call if diseases actually changed and cart has items
            if (JSON.stringify(diseases) !== JSON.stringify(consumerDiseases) && cartItems.length > 0) {
              console.log("Diseases changed, re-checking cart health...")
              setConsumerDiseases(diseases)
              setIsLoadingHealth(true)
              checkCartItemHealth(diseases, cartItems)
                .then(setItemHealthStatus)
                .catch((error: Error) => {
                  console.error("Error re-checking health:", error)
                  toast({ title: "Error", description: "Could not update health info.", variant: "destructive" })
                  setItemHealthStatus({})
                })
                .finally(() => setIsLoadingHealth(false))
            } else if (cartItems.length > 0 && diseases.length === 0 && Object.keys(itemHealthStatus).length > 0) {
              // If diseases were removed, clear the warnings
              console.log("Diseases removed, clearing health status...")
              setItemHealthStatus({})
              setConsumerDiseases([])
            } else {
              // Update local disease state even if no change required for API call
              setConsumerDiseases(diseases)
            }
          }
        })
        .catch((error: Error) => console.error("Error refetching profile on focus", error))
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [consumerDiseases, cartItems, itemHealthStatus, toast])

  const handleQuantityChange = async (id: string, change: number) => {
    try {
      const item = cartItems.find(item => item.id === id)
      if (!item) return

      const newQuantity = Math.max(1, item.quantity + change)
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          quantity: newQuantity
        })
      })

      if (!response.ok) throw new Error('Failed to update cart item')

      setCartItems(currentItems =>
        currentItems.map(item =>
          item.id === id
            ? { ...item, quantity: newQuantity }
            : item
        ).filter(item => item.quantity > 0)
      )
    } catch (error) {
      console.error('Error updating cart item quantity:', error)
      toast({
        title: "Error",
        description: "Could not update item quantity.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (id: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      })

      if (!response.ok) throw new Error('Failed to remove cart item')

      setCartItems(currentItems => currentItems.filter(item => item.id !== id))
      setItemHealthStatus(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      console.error('Error removing cart item:', error)
      toast({
        title: "Error",
        description: "Could not remove item from cart.",
        variant: "destructive",
      })
    }
  }

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
                                <p className="text-xs text-muted-foreground">From: {item.farmerId}</p>
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
