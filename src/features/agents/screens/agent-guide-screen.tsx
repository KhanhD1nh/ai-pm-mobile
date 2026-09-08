import Ionicons from "@react-native-vector-icons/ionicons";
import { Linking, StyleSheet, Text, View } from "react-native";
import {
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { Screen } from "@/shared/components/ui/screen";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { env } from "@/config/env";

const SKILL_REPO = "https://github.com/duongtx90/ai-pm-skills";
const SKILL_COMMAND =
  "git clone https://github.com/duongtx90/ai-pm-skills.git .agents/skills/ai-pm-skills";

export default function AgentGuideScreen() {
  const { theme: ui, language } = useAppPreferences();
  const vi = language === "vi";
  const mcpEndpoint = `${env.apiBaseUrl}/mcp`;
  const mcpConfig = `{
  "mcpServers": {
    "ai-pm-mcp": {
      "type": "http",
      "url": "${mcpEndpoint}",
      "headers": {
        "Authorization": "Bearer <YOUR_AGENT_TOKEN>"
      }
    }
  }
}`;

  return (
    <Screen
      chrome="stack"
      title={vi ? "Hướng dẫn tích hợp" : "Integration guide"}
      subtitle="AI-PM Agents"
    >
      <SectionHeader
        title={vi ? "Thiết lập Agent" : "Agent setup"}
        caption={
          vi
            ? "Làm theo thứ tự để agent kết nối đúng và dùng chung quy tắc AI-PM."
            : "Follow these steps so the agent connects correctly and shares AI-PM rules."
        }
      />
      <ListGroup>
        <ListRow
          first
          icon="person-add-outline"
          label={
            vi ? "1. Tạo Agent trong AI-PM" : "1. Create an Agent in AI-PM"
          }
          detail={
            vi
              ? "Đặt tên, provider và giữ REQUIRE_APPROVAL khi bắt đầu."
              : "Choose a name/provider and keep REQUIRE_APPROVAL initially."
          }
        />
        <ListRow
          icon="terminal-outline"
          label={vi ? "2. Kết nối MCP" : "2. Connect MCP"}
          detail={
            vi
              ? "Dùng MCP endpoint/token hiển thị sau khi tạo agent trong môi trường coding của bạn."
              : "Use the MCP endpoint/token shown after agent creation in your coding environment."
          }
        />
        <ListRow
          icon="download-outline"
          label={vi ? "3. Cài AI-PM Skills" : "3. Install AI-PM Skills"}
          detail={
            vi
              ? "Clone repo kỹ năng chuẩn vào thư mục .agents/skills."
              : "Clone the official skills repo into .agents/skills."
          }
        />
        <ListRow
          icon="checkmark-circle-outline"
          label={vi ? "4. Xác minh kết nối" : "4. Verify connection"}
          detail={
            vi
              ? "Kiểm tra agent online và thử tạo/đọc một task trước khi tăng quyền tự chủ."
              : "Confirm the agent is online and test reading/creating a task before increasing autonomy."
          }
        />
      </ListGroup>

      <SectionHeader
        title="AI-PM Skills"
        caption={
          vi
            ? "Task breakdown, chống trùng task và daily standup dùng chung cho agent."
            : "Shared task breakdown, duplicate prevention, and daily standup rules."
        }
      />
      <View
        style={[
          styles.commandBox,
          { backgroundColor: ui.colors.surface, borderColor: ui.colors.border },
        ]}
      >
        <View style={styles.commandTitle}>
          <Ionicons
            accessible={false}
            name="terminal-outline"
            size={18}
            color={ui.colors.accent}
          />
          <Text style={{ color: ui.colors.text, ...ui.typography.bodyStrong }}>
            {vi ? "Lệnh cài đặt" : "Install command"}
          </Text>
        </View>
        <Text
          selectable
          style={[
            styles.command,
            {
              color: ui.colors.textSecondary,
              backgroundColor: ui.colors.surfaceRaised,
            },
          ]}
        >
          {SKILL_COMMAND}
        </Text>
      </View>

      <SectionHeader
        title="MCP"
        caption={
          vi
            ? "Dùng token được hiển thị một lần ngay sau khi tạo Agent."
            : "Use the one-time token shown immediately after creating an Agent."
        }
      />
      <View
        style={[
          styles.commandBox,
          { backgroundColor: ui.colors.surface, borderColor: ui.colors.border },
        ]}
      >
        <Text style={{ color: ui.colors.textMuted, ...ui.typography.eyebrow }}>
          ENDPOINT
        </Text>
        <Text
          selectable
          style={[
            styles.command,
            {
              color: ui.colors.textSecondary,
              backgroundColor: ui.colors.surfaceRaised,
            },
          ]}
        >
          {mcpEndpoint}
        </Text>
        <Text style={{ color: ui.colors.textMuted, ...ui.typography.eyebrow }}>
          CONFIG
        </Text>
        <Text
          selectable
          style={[
            styles.command,
            {
              color: ui.colors.textSecondary,
              backgroundColor: ui.colors.surfaceRaised,
            },
          ]}
        >
          {mcpConfig}
        </Text>
      </View>

      <ListGroup>
        <ListRow
          first
          icon="logo-github"
          label={
            vi ? "Mở repository ai-pm-skills" : "Open ai-pm-skills repository"
          }
          detail="github.com/duongtx90/ai-pm-skills"
          onPress={() => void Linking.openURL(SKILL_REPO)}
        />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  commandBox: {
    gap: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  commandTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  command: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
    padding: 12,
    borderRadius: 12,
  },
});
