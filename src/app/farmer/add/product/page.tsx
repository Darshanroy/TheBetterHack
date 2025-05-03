
import { AddProductForm } from '@/components/farmer/add-product-form';
import { Suspense } from 'react';

// Wrap the form in Suspense for query param handling
function AddProductPageContent() {
    return <AddProductForm />;
}


export default function AddProductPage() {
  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4 text-secondary-foreground">Add New Product</h2>
        <p className="text-muted-foreground mb-6">
            Fill in the details below to list a new fruit or vegetable for sale.
            You can use the query parameters in the URL (e.g., `?name=Apple&price=2.5`) to pre-fill the form.
        </p>
         <Suspense fallback={<div>Loading form...</div>}>
           <AddProductPageContent />
         </Suspense>
    </div>
  );
}
