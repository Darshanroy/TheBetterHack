
/**
 * Represents a product with details such as name, description, and price.
 */
export interface Product {
  /**
   * The unique identifier for the product.
   */
id: string;
  /**
   * The name of the product (potentially including unit).
   */
  name: string;
  /**
   * A brief description of the product.
   */
description: string;
  /**
   * The price of the product in INR.
   */
  price: number;
  /**
   * The URL of the product image.
   */
  imageUrl: string;
  // Optional: Consider adding 'unit' (e.g., Kg, Bunch, Piece) explicitly if needed for filtering/display
  // unit?: string;
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
      name: 'Organic Nati Tomatoes (Kg)',
      description: 'Locally grown, tangy Nati tomatoes from near Bangalore, perfect for South Indian cooking.',
      price: 45.00, // Price per kg in INR
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Nati Tomatoes Bangalore')}/400/300`,
    },
    {
      id: '2',
      name: 'Fresh Curry Leaves (Bunch)',
      description: 'Aromatic curry leaves, essential for tempering (tadka).',
      price: 10.00, // Price per bunch
       imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Curry Leaves Bunch')}/400/300`,
    },
     {
      id: '3',
      name: 'Tender Coconut (Piece)',
      description: 'Refreshing tender coconut water, naturally sweet and hydrating.',
      price: 40.00, // Price per piece
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Tender Coconut India')}/400/300`,
    },
     {
      id: '4',
      name: 'Palak Spinach (Bunch)',
      description: 'Fresh, leafy Palak spinach, ideal for Palak Paneer or dals.',
      price: 25.00, // Price per bunch
       imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Palak Spinach Bunch')}/400/300`,
    },
      {
      id: '5', // Added Raisins example
      name: 'Dried Raisins (Kishmish) (250g)',
      description: 'Sweet and chewy dried grapes (Kishmish), perfect for snacks or desserts.',
      price: 100.00, // Price per 250g pack
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('Dried Raisins Kishmish')}/400/300`,
    },
  ];
}

/**
 * Asynchronously submits product data to the backend.
 *
 * @param productData The data of the product to be submitted. Price should be in INR.
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

    