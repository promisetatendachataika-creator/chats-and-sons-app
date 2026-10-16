/**
 * Projects are finished jobs the workshop wants to show off (a fitted kitchen, a wardrobe…).
 *
 * Stored like product photos, to stay fast on mobile data:
 *   projects/{id}               title, details and small preview photos (`thumbs`, ~30 KB each)
 *   projectImages/{id}-{n}      the full-size version of photo n, loaded only when someone opens it
 */
export interface Project {
  id: string;
  title: string;
  category: string;
  location?: string;
  /** Free text such as "March 2026" */
  completed?: string;
  description: string;
  thumbs: string[];
  createdAt?: unknown;
}

export const MAX_PROJECT_PHOTOS = 4;

export const projectCategories = ['Kitchen', 'Wardrobe', 'Furniture', 'Ceiling', 'Shopfitting', 'Other'];

export const projectImageId = (projectId: string, n: number) => `${projectId}-${n}`;
