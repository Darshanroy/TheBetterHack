// Types derived from our Prisma schema
export type UserRole = 'CONSUMER' | 'FARMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumerProfile {
  id: string;
  userId: string;
  location: string;
  dietaryGoals?: string;
  healthConditions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  bio?: string;
  location: string;
  farmName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  unit?: string;
  farmerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  farmerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  farmerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  quantity: number;
  userId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  orderId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
} 