
import { AddPostForm } from '@/components/farmer/add-post-form';
import { Suspense } from 'react';

// Wrap the form in Suspense for query param handling
function AddPostPageContent() {
    return <AddPostForm />;
}

export default function AddPostPage() {
  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4 text-secondary-foreground">Create New Post</h2>
        <p className="text-muted-foreground mb-6">
            Share updates, announcements, or stories with your customers.
            You can use the query parameters in the URL (e.g., `?title=Hello&content=World`) to pre-fill the form.
        </p>
        <Suspense fallback={<div>Loading form...</div>}>
          <AddPostPageContent />
        </Suspense>
    </div>
  );
}
