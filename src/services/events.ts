
/**
 * Represents an event with details such as name, description, and date.
 */
export interface Event {
  /**
   * The unique identifier for the event.
   */
id: string;
  /**
   * The name of the event.
   */
  name: string;
  /**
   * A brief description of the event.
   */
description: string;
  /**
   * The date(s) of the event.
   */
date: string; // Could be a range or specific date
  /**
   * Location of the event.
   */
location: string;
  /**
   * URL for an image representing the event.
   */
imageUrl: string;
  /**
   * Name of the farmer or farm hosting the event.
   */
farmerName: string;
  // Optional: Add farmerId, ticket price, registration link etc.
}

/**
 * Asynchronously retrieves a list of events.
 *
 * @returns A promise that resolves to an array of Event objects.
 */
export async function getEvents(): Promise<Event[]> {
  // TODO: Implement this by calling an API.
  await new Promise(resolve => setTimeout(resolve, 400));

  return [
    {
      id: '1',
      name: 'Apple Picking Festival',
      description: 'Join us for a fun day of apple picking, cider tasting, and live music!',
      date: 'October 5-6, 2024',
      location: 'Sunny Orchards',
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('apple picking event')}/400/200`,
       farmerName: 'Sunny Orchards',
    },
    {
      id: '2',
      name: 'Organic Gardening Workshop',
      description: 'Learn the basics of organic vegetable gardening from our expert farmers.',
      date: 'October 19, 2024 - 10 AM',
       location: 'Green Valley Farms Greenhouse',
       imageUrl: `https://picsum.photos/seed/${encodeURIComponent('gardening workshop')}/400/200`,
       farmerName: 'Green Valley Farms',
    },
      {
      id: '3',
      name: 'Pumpkin Patch Opening',
      description: 'Our pumpkin patch opens this weekend! Find the perfect pumpkin for Halloween.',
      date: 'Starts October 12, 2024',
      location: 'Rooted Vegetables Farm Stand',
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('pumpkin patch')}/400/200`,
      farmerName: 'Rooted Vegetables',
    },
  ];
}

/**
 * Asynchronously submits event data to the backend.
 *
 * @param eventData The data of the event to be submitted.
 * @returns A promise that resolves when the event data is successfully submitted.
 */
export async function submitEvent(eventData: Omit<Event, 'id'>): Promise<void> {
  // Simulate API call
  console.log('Submitting event data to API:', eventData);
   await new Promise(resolve => setTimeout(resolve, 900));

  console.log('Event submitted successfully.');
  return Promise.resolve();
}

