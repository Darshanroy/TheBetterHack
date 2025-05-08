import prisma from './client';
import { 
  User, ConsumerProfile, FarmerProfile, Product, Event, Post, 
  CartItem, Order, OrderItem, UserRole 
} from './types';

// User Services
export const userService = {
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.user.create({ data });
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async updateUser(id: string, data: Partial<User>) {
    return prisma.user.update({ where: { id }, data });
  },
};

// Consumer Profile Services
export const consumerProfileService = {
  async createProfile(data: Omit<ConsumerProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.consumerProfile.create({ data });
  },

  async getProfileByUserId(userId: string) {
    return prisma.consumerProfile.findUnique({ where: { userId } });
  },

  async updateProfile(userId: string, data: Partial<ConsumerProfile>) {
    return prisma.consumerProfile.update({ where: { userId }, data });
  },
};

// Farmer Profile Services
export const farmerProfileService = {
  async createProfile(data: Omit<FarmerProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.farmerProfile.create({ data });
  },

  async getProfileByUserId(userId: string) {
    return prisma.farmerProfile.findUnique({ where: { userId } });
  },

  async updateProfile(userId: string, data: Partial<FarmerProfile>) {
    return prisma.farmerProfile.update({ where: { userId }, data });
  },
};

// Product Services
export const productService = {
  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.product.create({ data });
  },

  async getProductById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async getProductsByFarmer(farmerId: string) {
    return prisma.product.findMany({ where: { farmerId } });
  },

  async updateProduct(id: string, data: Partial<Product>) {
    return prisma.product.update({ where: { id }, data });
  },

  async deleteProduct(id: string) {
    return prisma.product.delete({ where: { id } });
  },
};

// Event Services
export const eventService = {
  async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.event.create({ data });
  },

  async getEventById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  },

  async getEventsByFarmer(farmerId: string) {
    return prisma.event.findMany({ where: { farmerId } });
  },

  async updateEvent(id: string, data: Partial<Event>) {
    return prisma.event.update({ where: { id }, data });
  },

  async deleteEvent(id: string) {
    return prisma.event.delete({ where: { id } });
  },
};

// Post Services
export const postService = {
  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.post.create({ data });
  },

  async getPostById(id: string) {
    return prisma.post.findUnique({ 
      where: { id },
      include: {
        farmer: {
          include: {
            user: true
          }
        }
      }
    });
  },

  async getPostsByFarmer(farmerId: string) {
    return prisma.post.findMany({ 
      where: { farmerId },
      include: {
        farmer: {
          include: {
            user: true
          }
        }
      }
    });
  },

  async getPaginatedPosts(page: number = 1, limit: number = 25) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          farmer: {
            include: {
              user: true
            }
          }
        }
      }),
      prisma.post.count()
    ]);

    return {
      posts,
      total,
      hasMore: skip + posts.length < total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    };
  },

  async updatePost(id: string, data: Partial<Post>) {
    return prisma.post.update({ where: { id }, data });
  },

  async deletePost(id: string) {
    return prisma.post.delete({ where: { id } });
  },
};

// Cart Services
export const cartService = {
  async getCartItems(userId: string) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
  },

  async addToCart(data: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.cartItem.create({
      data,
      include: { product: true },
    });
  },

  async updateCartItem(id: string, data: Partial<CartItem>) {
    return prisma.cartItem.update({
      where: { id },
      data,
      include: { product: true },
    });
  },

  async removeFromCart(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  },

  async clearCart(userId: string) {
    return prisma.cartItem.deleteMany({ where: { userId } });
  },
};

// Order Services
export const orderService = {
  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.order.create({
      data,
      include: { items: { include: { product: true } } },
    });
  },

  async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  },

  async getOrdersByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } },
    });
  },
}; 