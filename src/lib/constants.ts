
// Top 10 most popular Indian diseases (example data)
export const INDIAN_DISEASES = [
  "Diabetes Mellitus",
  "Hypertension (High Blood Pressure)",
  "Ischemic Heart Disease (Coronary Artery Disease)",
  "Chronic Obstructive Pulmonary Disease (COPD)",
  "Stroke (Cerebrovascular Accident)",
  "Tuberculosis",
  "Dengue Fever",
  "Malaria",
  "Typhoid Fever",
  "Lower Respiratory Infections (like Pneumonia)",
] as const;

export type Disease = (typeof INDIAN_DISEASES)[number];

export const FARMER_ADD_TABS = [
  { id: 'product', label: 'Product', path: '/farmer/add/product' },
  { id: 'post', label: 'Post', path: '/farmer/add/post' },
  { id: 'story', label: 'Story', path: '/farmer/add/story' },
  { id: 'livestream', label: 'Livestream', path: '/farmer/add/livestream' },
] as const;

export type FarmerAddTabId = (typeof FARMER_ADD_TABS)[number]['id'];

