// Task 1: build your data layer here.
// Read from MySQL, cache in Redis, and use it from both pages and API routes.

export type Template = {
  id: number;
  slug: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  views: number;
};

export type TemplateQuery = {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export async function getTemplates(_query: TemplateQuery): Promise<{ items: Template[]; total: number }> {
  throw new Error("Not implemented");
}

export async function getTemplateBySlug(_slug: string): Promise<Template | null> {
  throw new Error("Not implemented");
}
