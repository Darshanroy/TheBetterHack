
/**
 * Represents a post with details such as title and content.
 */
export interface Post {
  /**
   * The unique identifier for the post.
   */
id: string;
  /**
   * The title of the post.
   */
  title: string;
  /**
   * The content of the post.
   */
  content: string;
  // Optional: Add imageUrl, farmerId etc.
}

/**
 * Asynchronously retrieves a list of posts.
 *
 * @returns A promise that resolves to an array of Post objects.
 */
export async function getPosts(): Promise<Post[]> {
  // TODO: Implement this by calling an API.
  await new Promise(resolve => setTimeout(resolve, 300));

  return [
    {
      id: '1',
      title: 'New Apple Harvest is Here!',
      content: 'We\'ve just finished harvesting our delicious Honeycrisp apples! Come visit the farm stand this weekend.',
    },
    {
      id: '2',
      title: 'Tomato Growing Tips',
      content: 'Want to grow your own tomatoes? Here are 3 simple tips for a successful harvest at home.',
    },
     {
      id: '3',
      title: 'Weekend Farm Stand Special',
      content: 'Get 10% off all berries this Saturday and Sunday! Mention this post.',
    },
  ];
}

/**
 * Asynchronously submits post data to the backend.
 *
 * @param postData The data of the post to be submitted.
 * @returns A promise that resolves when the post data is successfully submitted.
 */
export async function submitPost(postData: Omit<Post, 'id'>): Promise<void> {
  // Simulate API call
  console.log('Submitting post data to API:', postData);
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log('Post submitted successfully.');
  return Promise.resolve();
}

