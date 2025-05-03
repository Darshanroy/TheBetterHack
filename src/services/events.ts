
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
  // Optional: Add farmerId, ticket price (INR), registration link etc.
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
      name: 'Mango Mela Weekend',
      description: 'Taste and buy various types of mangoes directly from farms! Fun activities for kids too.',
      date: 'May 25-26, 2024',
      location: 'Lalbagh Botanical Garden, Bangalore', // Example location
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('mango mela bangalore')}/400/200`,
       farmerName: 'Various Farmers Collective',
    },
    {
      id: '2',
      name: 'Terrace Gardening Workshop',
      description: 'Learn how to start your own vegetable garden on your Bangalore terrace. Includes starter kit.',
      date: 'June 8, 2024 - 11 AM',
       location: 'GreenRoots Store, Koramangala',
       imageUrl: `https://picsum.photos/seed/${encodeURIComponent('terrace garden workshop bangalore')}/400/200`,
       farmerName: 'GreenRoots Bangalore',
    },
      {
      id: '3',
      name: 'Organic Millets Awareness Talk',
      description: 'Discover the health benefits of different millets and simple recipes. Free tasting session.',
      date: 'June 15, 2024 - 4 PM',
      location: 'Community Hall, Jayanagar',
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent('millets india')}/400/200`,
      farmerName: 'Sahyadri Organics',
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

    