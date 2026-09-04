import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Muted, Pill } from "@/components/ui/primitives";
import { EmptyState, Screen } from "@/components/ui/screen";
import { useAuth } from "@/contexts/auth-context";
import { issuesApi } from "@/services/api";

export default function MyWorkScreen() {
  const { user, orgId } = useAuth();
  const query = useQuery({
    queryKey: ["my-work", orgId, user?.id],
    queryFn: () =>
      issuesApi.list({
        assigneeId: user!.id,
        limit: 100,
        sortBy: "updated_at",
        sortOrder: "desc",
      }),
    enabled: !!orgId && !!user?.id,
  });
  const issues = query.data ?? [];
  const overdue = issues.filter(
    (i) =>
      i.due_date &&
      new Date(i.due_date).getTime() < Date.now() &&
      i.status?.category !== "DONE",
  );
  const sections = [
    ["Quá hạn", overdue],
    [
      "Đang thực hiện",
      issues.filter((i) => i.status?.category === "IN_PROGRESS"),
    ],
    ["Review", issues.filter((i) => i.status?.category === "IN_REVIEW")],
    [
      "Sắp tới",
      issues.filter((i) =>
        ["TODO", "BACKLOG"].includes(i.status?.category ?? ""),
      ),
    ],
  ] as const;
  return (
    <Screen
      title="My Work"
      subtitle={`${issues.length} công việc`}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {issues.length === 0 ? (
        <EmptyState title="Không có công việc" />
      ) : (
        sections.map(([title, list]) =>
          list.length ? (
            <View key={title} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {title} · {list.length}
              </Text>
              {list.slice(0, 12).map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() =>
                    router.push({
                      pathname: "/issue/[identifier]",
                      params: { identifier: issue.identifier },
                    })
                  }
                >
                  <Card>
                    <View style={styles.row}>
                      <Pill text={issue.identifier} />
                      <Pill text={issue.priority} />
                    </View>
                    <Text style={styles.title}>{issue.title}</Text>
                    <Muted>
                      {issue.status?.name ?? "—"}
                      {issue.due_date
                        ? ` · Hạn ${new Date(issue.due_date).toLocaleDateString("vi-VN")}`
                        : ""}
                    </Muted>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null,
        )
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  section: { gap: 9 },
  sectionTitle: {
    color: "#eef2f6",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  title: { color: "#f3f6f9", fontWeight: "800" },
});
