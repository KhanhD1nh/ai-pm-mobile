import { request } from "@/infrastructure/networking/api-client";
import type { WikiPage } from "@/shared/contracts";

export const wikiApi = {
  list: (projectKey: string, q?: string) =>
    request<WikiPage[]>(
      `/projects/${projectKey}/wiki${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),
  get: (projectKey: string, slug: string) =>
    request<WikiPage>(`/projects/${projectKey}/wiki/${slug}`),
  save: (projectKey: string, slug: string, title: string, content: string) =>
    request<WikiPage>(`/projects/${projectKey}/wiki`, {
      method: "POST",
      body: JSON.stringify({ slug, title, content, format: "MARKDOWN" }),
    }),
};
