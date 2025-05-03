
import { AddStoryForm } from '@/components/farmer/add-story-form';
import { Suspense } from 'react';

// Wrap the form in Suspense for query param handling
function AddStoryPageContent() {
    return <AddStoryForm />;
}

export default function AddStoryPage() {
  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4 text-secondary-foreground">Create New Story</h2>
        <p className="text-muted-foreground mb-6">
            Share temporary updates or behind-the-scenes moments. Stories disappear after 24 hours.
            You can use query parameters (e.g., `?content=Hello&duration=5`) to pre-fill the form.
        </p>
         <Suspense fallback={<div>Loading form...</div>}>
            <AddStoryPageContent />
        </Suspense>
    </div>
  );
}
