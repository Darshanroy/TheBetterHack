
/**
 * Represents a product with details such as name, description, and price.
 */
export interface Product {
  /**
   * The unique identifier for the product.
   */
id: string;
  /**
   * The name of the product.
   */
  name: string;
  /**
   * A brief description of the product.
   */
description: string;
  /**
   * The price of the product.
   */
  price: number;
  /**
   * The URL of the product image.
   */
  imageUrl: string;
}

/**
 * Asynchronously retrieves a list of products.
 *
 * @returns A promise that resolves to an array of Product objects.
 */
export async function getProducts(): Promise<Product[]> {
  // TODO: Implement this by calling an API.

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));


  return [
    {
      id: '1',
      name: 'Organic Fuji Apples',
      description: 'Crisp, sweet, and juicy Fuji apples, grown organically.',
      price: 3.50, // Price per lb or unit
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Organic Fuji Apples')}/400/300`,
    },
    {
      id: '2',
      name: 'Ripe Bananas (Bunch)',
      description: 'Perfectly ripe bananas, great for smoothies or snacking.',
      price: 1.50, // Price per bunch
       imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Ripe Bananas')}/400/300`,
    },
     {
      id: '3',
      name: 'Heirloom Tomatoes',
      description: 'Flavorful heirloom tomatoes in various colors and sizes.',
      price: 4.00, // Price per lb
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Heirloom Tomatoes')}/400/300`,
    },
     {
      id: '4',
      name: 'Spinach (Bag)',
      description: 'Fresh, leafy spinach, washed and ready to eat.',
      price: 3.00, // Price per bag
       imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Spinach')}/400/300`,
    },
  ];
}

/**
 * Asynchronously submits product data to the backend.
 *
 * @param productData The data of the product to be submitted.
 * @returns A promise that resolves when the product data is successfully submitted.
 */
export async function submitProduct(productData: Omit<Product, 'id'>): Promise<void> {
  // Simulate API call
  console.log('Submitting product data to API:', productData);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency

  // Simulate potential error
  // if (Math.random() > 0.8) {
  //   throw new Error("Simulated API error on product submission");
  // }

  console.log('Product submitted successfully.');
  return Promise.resolve();
}

