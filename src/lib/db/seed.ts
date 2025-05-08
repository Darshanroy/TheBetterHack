import { prisma } from './client';
import { INDIAN_DISEASES } from '@/lib/constants';

async function seed() {
  try {
    // First, check if users exist
    const existingConsumer = await prisma.user.findUnique({
      where: { email: "priya.s@email.com" },
      include: { consumerProfile: true }
    });

    const existingFarmer = await prisma.user.findUnique({
      where: { email: "raj.farmer@email.com" },
      include: { farmerProfile: true }
    });

    // Create or get consumer user
    const consumerUser = existingConsumer || await prisma.user.create({
      data: {
        email: "priya.s@email.com",
        name: "Priya Sharma",
        avatarUrl: "https://picsum.photos/seed/priya/200/200",
        role: "CONSUMER",
        consumerProfile: {
          create: {
            location: "Indiranagar, Bangalore",
            dietaryGoals: "Eat healthier, more local Bangalore produce.",
            healthConditions: JSON.stringify([]), // Store as JSON string
          }
        }
      },
      include: {
        consumerProfile: true
      }
    });

    // Create or get farmer user
    const farmerUser = existingFarmer || await prisma.user.create({
      data: {
        email: "raj.farmer@email.com",
        name: "Raj Kumar",
        avatarUrl: "https://picsum.photos/seed/raj/200/200",
        role: "FARMER",
        farmerProfile: {
          create: {
            bio: "Organic farmer with 10 years of experience",
            location: "Hosur, Tamil Nadu",
            farmName: "Green Valley Organic Farms"
          }
        }
      },
      include: {
        farmerProfile: true
      }
    });

    if (!farmerUser.farmerProfile) {
      throw new Error("Farmer profile not created");
    }

    // Delete existing products, events, and posts to avoid duplicates
    await Promise.all([
      prisma.product.deleteMany({ where: { farmerId: farmerUser.farmerProfile.id } }),
      prisma.event.deleteMany({ where: { farmerId: farmerUser.farmerProfile.id } }),
      prisma.post.deleteMany({ where: { farmerId: farmerUser.farmerProfile.id } })
    ]);

    // Create products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: "Organic Tomatoes",
          description: "Fresh, juicy tomatoes grown without pesticides",
          price: 60,
          imageUrl: "https://picsum.photos/seed/tomato/400/400",
          unit: "Kg",
          farmerId: farmerUser.farmerProfile.id
        }
      }),
      prisma.product.create({
        data: {
          name: "Organic Carrots",
          description: "Sweet and crunchy carrots, perfect for salads",
          price: 45,
          imageUrl: "https://picsum.photos/seed/carrot/400/400",
          unit: "Kg",
          farmerId: farmerUser.farmerProfile.id
        }
      }),
      prisma.product.create({
        data: {
          name: "Organic Spinach",
          description: "Fresh, leafy spinach packed with nutrients",
          price: 30,
          imageUrl: "https://picsum.photos/seed/spinach/400/400",
          unit: "Bunch",
          farmerId: farmerUser.farmerProfile.id
        }
      })
    ]);

    // Create an event
    const event = await prisma.event.create({
      data: {
        name: "Farmers Market Weekend",
        description: "Join us for a weekend of fresh produce and farm activities",
        date: "2024-04-20",
        location: "Green Valley Organic Farms, Hosur",
        imageUrl: "https://picsum.photos/seed/event/800/400",
        farmerId: farmerUser.farmerProfile.id
      }
    });

    // Create multiple posts
    const posts = await Promise.all([
      prisma.post.create({
        data: {
          title: "New Season, New Harvest",
          content: "We're excited to announce our new season of organic vegetables! Come visit our farm to see how we grow our produce sustainably.",
          imageUrl: "https://picsum.photos/seed/harvest/800/800",
          farmerId: farmerUser.farmerProfile.id,
          products: {
            connect: [{ id: products[0].id }, { id: products[1].id }]
          }
        }
      }),
      prisma.post.create({
        data: {
          title: "Fresh Kashmiri Apples Arrived!",
          content: "Our latest batch of Kashmiri apples is here! Crisp, sweet, and perfect for the season. Available at our farm stand this weekend.",
          imageUrl: "https://picsum.photos/seed/apples/800/800",
          farmerId: farmerUser.farmerProfile.id
        }
      }),
      prisma.post.create({
        data: {
          title: "Tomato Growing Tips",
          content: "Want to grow your own tomatoes? Here are 3 simple tips for a successful harvest at home: 1) Choose the right variety, 2) Provide plenty of sunlight, 3) Water consistently.",
          imageUrl: "https://picsum.photos/seed/tomatoes/800/800",
          farmerId: farmerUser.farmerProfile.id,
          products: {
            connect: [{ id: products[0].id }]
          }
        }
      }),
      prisma.post.create({
        data: {
          title: "Weekend Farm Stand Special",
          content: "Get 10% off all berries this Saturday and Sunday! Mention this post at checkout. Limited time offer.",
          imageUrl: "https://picsum.photos/seed/berries/800/800",
          farmerId: farmerUser.farmerProfile.id
        }
      }),
      prisma.post.create({
        data: {
          title: "Ooty Vegetables Now Available",
          content: "Fresh carrots, beans, and potatoes from Ooty are now available at our farm stand. Grown in the cool climate of the Nilgiris.",
          imageUrl: "https://picsum.photos/seed/vegetables/800/800",
          farmerId: farmerUser.farmerProfile.id,
          products: {
            connect: [{ id: products[1].id }, { id: products[2].id }]
          }
        }
      }),
      prisma.post.create({
        data: {
          title: "Fresh Greens Harvest",
          content: "New batch of Palak (Spinach) and Methi (Fenugreek) harvested this morning! Perfect for your healthy meals.",
          imageUrl: "https://picsum.photos/seed/greens/800/800",
          farmerId: farmerUser.farmerProfile.id,
          products: {
            connect: [{ id: products[2].id }]
          }
        }
      }),
      prisma.post.create({
        data: {
          title: "Premium Dried Raisins",
          content: "Our premium quality dried raisins (Kishmish) are now in stock. Sweet and healthy snack option available in 250g packs.",
          imageUrl: "https://picsum.photos/seed/raisins/800/800",
          farmerId: farmerUser.farmerProfile.id
        }
      })
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Execute the seed function
seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 