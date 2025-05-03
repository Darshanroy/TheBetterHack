
/**
 * Represents a story with details such as content and duration.
 */
export interface Story {
  /**
   * The unique identifier for the story.
   */
id: string;
  /**
   * The content of the story (text overlay).
   */
  content: string;
  /**
   * The duration of the story in seconds.
   */
duration: number;
  /**
   * URL of the image or video for the story.
   */
  mediaUrl: string;
  // Optional: Add farmerId etc.
}

/**
 * Asynchronously retrieves a list of stories.
 *
 * @returns A promise that resolves to an array of Story objects.
 */
export async function getStories(): Promise<Story[]> {
  // TODO: Implement this by calling an API.
   await new Promise(resolve => setTimeout(resolve, 200));

  return [
    {
      id: '1',
      content: 'Sunrise over the fields near Nandi Hills! ☀️',
      duration: 8,
      mediaUrl: `https://picsum.photos/seed/${encodeURIComponent('Nandi Hills sunrise farm')}/360/640`, // Aspect ratio for stories
    },
    {
      id: '2',
      content: 'Fresh batch of Mallige (Jasmine) flowers ready!',
      duration: 6,
      mediaUrl: `https://picsum.photos/seed/${encodeURIComponent('Jasmine flowers Bangalore')}/360/640`,
    },
     {
      id: '3',
      content: 'Our farm store in Jayanagar is open till 7 PM today.',
      duration: 5,
      mediaUrl: `https://picsum.photos/seed/${encodeURIComponent('farm store jayanagar')}/360/640`,
    },
  ];
}

/**
 * Asynchronously submits story data to the backend.
 *
 * @param storyData The data of the story to be submitted. Requires content and duration. Media handling TBD.
 * @returns A promise that resolves when the story data is successfully submitted.
 */
export async function submitStory(storyData: Omit<Story, 'id' | 'mediaUrl'> & { mediaUrl?: string }): Promise<void> {
   // Simulate API call - In reality, this would involve uploading media first
  console.log('Submitting story data to API:', storyData);
   await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate upload + db write

   // Assign a placeholder mediaUrl if not provided for simulation
   const finalData = {
       ...storyData,
       mediaUrl: storyData.mediaUrl || `https://picsum.photos/seed/${encodeURIComponent(storyData.content.slice(0,10))}/360/640`
   };
   console.log('Final story data:', finalData);


  console.log('Story submitted successfully.');
  return Promise.resolve();
}

    