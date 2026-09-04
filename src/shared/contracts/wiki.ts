export interface WikiPage {
  id: string;
  project_id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content: string;
  format: string;
  version: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}
