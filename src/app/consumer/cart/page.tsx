
'use client'; // Mark as client component for state management

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Example Cart Item Data
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    farmerName: string;
}

// Example initial cart state
const initialCartItems: CartItem[] = [
    { id: 'p1', name: 'Organic Gala Apples', price: 3.50, quantity: 2, imageUrl: 'https://picsum.photos/seed/gala/100/100', farmerName: 'Sunny Orchards' },
    { id: 'p3', name: 'Fresh Basil (Bunch)', price: 2.00, quantity: 1, imageUrl: 'https://picsum.photos/seed/basil/100/100', farmerName: 'Rooted Vegetables' },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

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
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const estimatedTax = subtotal * 0.08; // Example 8% tax
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
                 </CardHeader>
                 <CardContent className="divide-y">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4 py-4">
                           <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="rounded-md object-cover"
                             data-ai-hint="fruits vegetables product"
                          />
                          <div className="flex-1 space-y-1">
                             <p className="font-medium">{item.name}</p>
                             <p className="text-xs text-muted-foreground">From: {item.farmerName}</p>
                             <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
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
                      ))}
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
                   <span>${subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span>Estimated Tax</span>
                   <span>${estimatedTax.toFixed(2)}</span>
                 </div>
                 {/* TODO: Add Shipping calculation */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                   <span>Shipping</span>
                   <span>Calculated at checkout</span>
                 </div>
                 <Separator />
                 <div className="flex justify-between font-semibold text-base">
                   <span>Total</span>
                   <span>${total.toFixed(2)}</span>
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
    </div>
  );
}
