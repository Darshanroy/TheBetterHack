
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

// Example Post Data Structure
interface Post {
    id: string;
    farmerName: string;
    farmerAvatar: string;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    productTags?: { name: string; price: number }[]; // Price in INR
    isLiked?: boolean; // client-side state
    isBookmarked?: boolean; // client-side state
}

// Example dummy data (India/Bangalore focused)
const posts: Post[] = [
  {
    id: '1',
    farmerName: 'Himalayan Orchards',
    farmerAvatar: 'https://picsum.photos/seed/himalayan-farm/50/50',
    imageUrl: 'https://picsum.photos/seed/kashmiri-apples/600/600',
    caption: 'Fresh Kashmiri Apples just arrived! 🍎 Crisp, sweet, and perfect for the season. #freshapples #kashmir #bangalore',
    likes: 180,
    comments: 22,
    productTags: [{ name: 'Kashmiri Apples (Kg)', price: 150 }],
  },
  {
    id: '2',
    farmerName: 'Nilgiri Farms Collective',
    farmerAvatar: 'https://picsum.photos/seed/nilgiri-farm/50/50',
    imageUrl: 'https://picsum.photos/seed/ooty-vegetables/600/600',
    caption: 'Ooty vegetables are here! Fresh carrots, beans, and potatoes delivered straight to Bangalore. 🥕🥔 #ootyveg #farmfresh #bangalorelocal',
    likes: 250,
    comments: 35,
    productTags: [{ name: 'Ooty Carrots (Kg)', price: 60 }, { name: 'Ooty Potatoes (Kg)', price: 50 }],
  },
   {
    id: '3',
    farmerName: 'Ayur Greens Bangalore',
    farmerAvatar: 'https://picsum.photos/seed/ayur-greens/50/50',
    imageUrl: 'https://picsum.photos/seed/greens-bangalore/600/600',
    caption: 'Fresh batch of Palak (Spinach) and Methi (Fenugreek) harvested this morning! 🌿 #greens #localproduce #healthyfood #bangalore',
    likes: 95,
    comments: 12,
     productTags: [{ name: 'Palak (Spinach) Bunch', price: 25 }, { name: 'Methi (Fenugreek) Bunch', price: 30 }],
  },
   {
    id: '4', // Added post for Raisins
    farmerName: 'Dry Fruitwala & Co.',
    farmerAvatar: 'https://picsum.photos/seed/dryfruit-seller/50/50',
    imageUrl: 'https://picsum.photos/seed/dry-raisins/600/600',
    caption: 'Premium quality dried raisins (Kishmish) now in stock. Sweet and healthy snack!🍇 #raisins #kishmish #dryfruits #bangalore',
    likes: 110,
    comments: 18,
     productTags: [{ name: 'Dried Raisins (250g)', price: 100 }],
  },
];


export default function ConsumerHomePage() {
  // TODO: Implement like/bookmark state and actions

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Optional: Story reel placeholder */}
       <div className="flex space-x-3 overflow-x-auto p-2 -mx-2">
            {/* Example Farmer Names */}
            {['NammaFarmer', 'GreenRoots', 'OrganicBlr', 'MalnadHarvest', 'SahyadriFarms'].map(farmerId => (
                 <div key={farmerId} className="flex flex-col items-center gap-1">
                    <Avatar className="h-16 w-16 border-2 border-accent p-0.5">
                        <AvatarImage src={`https://picsum.photos/seed/${farmerId}/50/50`} data-ai-hint="farmer portrait india"/>
                        <AvatarFallback>{farmerId.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <span className="text-xs text-muted-foreground truncate w-16 text-center">{farmerId}</span>
                 </div>
            ))}
       </div>

      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden rounded-lg shadow-md">
          <CardHeader className="flex flex-row items-center gap-3 p-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.farmerAvatar} alt={post.farmerName} data-ai-hint="farmer portrait india"/>
              <AvatarFallback>{post.farmerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{post.farmerName}</span>
            {/* Optional: Add timestamp or location */}
          </CardHeader>
          <CardContent className="p-0">
            <Image
              src={post.imageUrl}
              alt={`Post by ${post.farmerName}`}
              width={600}
              height={600}
              className="w-full h-auto object-cover aspect-square"
               data-ai-hint="fruits vegetables farm product india bangalore"
            />
             {/* Product Tags Overlay/Section */}
             {post.productTags && post.productTags.length > 0 && (
               <div className="p-3 bg-background/80 backdrop-blur-sm border-t">
                 <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Featured Products:</h4>
                 <div className="flex flex-wrap gap-2">
                   {post.productTags.map(tag => (
                      <Button key={tag.name} variant="secondary" size="sm" className="h-auto py-1 px-2 text-xs">
                          {tag.name} - ₹{tag.price.toFixed(2)}
                      </Button>
                   ))}
                 </div>
               </div>
             )}
          </CardContent>
          <CardFooter className="flex flex-col items-start p-3 space-y-2">
             {/* Action Buttons */}
             <div className="flex justify-between w-full">
                 <div className="flex gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="sr-only">Like</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageCircle className="h-5 w-5" />
                         <span className="sr-only">Comment</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Send className="h-5 w-5" />
                         <span className="sr-only">Share</span>
                    </Button>
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bookmark className={`h-5 w-5 ${post.isBookmarked ? 'fill-foreground' : ''}`}/>
                     <span className="sr-only">Bookmark</span>
                </Button>
             </div>
             {/* Likes Count */}
             <div className="text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
             {/* Caption */}
             <div className="text-sm">
                 <span className="font-semibold mr-1">{post.farmerName}</span>
                 {post.caption}
             </div>
              {/* Comments Link */}
             <div className="text-xs text-muted-foreground">
                View all {post.comments} comments
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

    