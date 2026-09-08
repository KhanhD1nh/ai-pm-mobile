import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wikiApi } from "../api/wiki-api";
import { wikiKeys } from "../query-keys";

export function useSaveWikiPage(
  projectId?: string | null,
  projectKey?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      title,
      content,
    }: {
      slug: string;
      title: string;
      content: string;
    }) => wikiApi.save(projectKey!, slug, title, content),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: wikiKeys.list(projectId, projectKey),
      }),
  });
}
