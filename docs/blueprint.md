# **App Name**: FarmerSocial

## Core Features:

- Consumer UI Implementation: Implement the consumer UI with Home, Search/Explore, Events/Request, Cart, and Profile tabs. Focus on feed display, search functionality, event listing, cart management, and profile customization using Aceternity UI components for an Instagram-like experience, for fruits and vegetables only.
- Farmer UI Implementation: Implement the farmer UI with Home, Add (product/post/reel/story/livestream), Organize (event/fundraise), Crop Demand Requests, and Profile tabs. Allow farmers to add products (fruits and vegetables only) with inventory management, create posts with product attachments, go live, organize events/fundraisers, view crop requests, and manage their profile settings and dashboard metrics. Each add tab (product/post/story) should have a different URL and accept query parameters that fill in the form based on the URL query params. All form submissions should call an API POST request to the backend API with the appropriate data.
- AI Voice Assistant (Frontend): Integrate a floating AI voice assistant (frontend only) for both consumer and farmer UIs. The consumer assistant should help plan and purchase fruits and vegetables based on dietary goals and health conditions. The farmer assistant should help navigate the app and post content. Use websockets for communication. The AI assistant should maintain the same state in case of navigation to other pages.

## Style Guidelines:

- Primary color: Earthy green (#386641) to represent agriculture and nature.
- Secondary color: Warm beige (#E3D5CA) for backgrounds and neutral elements.
- Accent: Terracotta (#BC6C25) for call-to-action buttons and highlights to bring warmth.
- Instagram-like feed layout with clear separation of posts, reels, and stories. Use Aceternity UI components to enhance visual appeal and interactivity.
- Use clear and intuitive icons for navigation, product categories, and user actions, sourced from Aceternity's component library.
- Subtle animations for loading states, transitions, and user interactions to provide a smooth and engaging user experience. Follow Aceternity's animation guidelines for consistency.