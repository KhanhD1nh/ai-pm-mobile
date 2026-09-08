import { createContext, useContext } from "react";
import { lightTheme, type AppTheme } from "@/shared/components/ui/theme";

export type ThemePreference = "system" | "light" | "dark";
export type AppLanguage = "vi" | "en";

export type TranslationKey =
  | "common.system"
  | "common.light"
  | "common.dark"
  | "common.vietnamese"
  | "common.english"
  | "nav.home"
  | "nav.projects"
  | "nav.myWork"
  | "nav.inbox"
  | "nav.more"
  | "more.title"
  | "more.subtitle"
  | "more.workspace"
  | "more.tools"
  | "more.appearanceLanguage"
  | "more.theme"
  | "more.language"
  | "more.logout"
  | "more.search"
  | "more.searchDetail"
  | "more.agents"
  | "more.agentsDetail"
  | "more.profile"
  | "more.profileDetail"
  | "more.organization"
  | "more.organizationDetail"
  | "more.aiBudget"
  | "more.aiBudgetDetail"
  | "more.systemUsers"
  | "more.systemUsersDetail"
  | "more.mobileSettings"
  | "more.mobileSettingsDetail"
  | "home.greeting"
  | "home.todayOverview"
  | "home.myWork"
  | "home.overdue"
  | "home.unread"
  | "home.focus"
  | "home.inProgress"
  | "home.noInProgress"
  | "home.workspaces"
  | "home.recentProjects"
  | "home.openProject"
  | "projects.title"
  | "projects.projectCount"
  | "projects.create"
  | "projects.emptyTitle"
  | "projects.emptyBody"
  | "projects.issues"
  | "projects.createTitle"
  | "projects.keyPlaceholder"
  | "projects.namePlaceholder"
  | "projects.descriptionPlaceholder"
  | "projects.creating"
  | "projects.workspaceSuffix"
  | "projects.noDescription"
  | "projects.newProject"
  | "projects.createError"
  | "common.cancel"
  | "myWork.title"
  | "myWork.workCount"
  | "myWork.empty"
  | "inbox.title"
  | "inbox.unread"
  | "inbox.markAll"
  | "inbox.empty"
  | "login.initialSetup"
  | "login.description"
  | "login.name"
  | "login.email"
  | "login.password"
  | "login.processing"
  | "login.setup"
  | "login.signIn"
  | "login.setupTitle"
  | "login.welcomeBack"
  | "login.setupBody"
  | "login.signInBody"
  | "login.setupInfo"
  | "login.secureSignIn"
  | "login.setupFailed"
  | "login.signInFailed";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  vi: {
    "common.system": "Hệ thống",
    "common.light": "Sáng",
    "common.dark": "Tối",
    "common.vietnamese": "Tiếng Việt",
    "common.english": "English",
    "nav.home": "Trang chủ",
    "nav.projects": "Dự án",
    "nav.myWork": "Công việc",
    "nav.inbox": "Thông báo",
    "nav.more": "Thêm",
    "more.title": "Thêm",
    "more.subtitle": "Tài khoản, workspace và cài đặt",
    "more.workspace": "Workspace",
    "more.tools": "Công cụ & cài đặt",
    "more.appearanceLanguage": "Giao diện & ngôn ngữ",
    "more.theme": "Chủ đề",
    "more.language": "Ngôn ngữ",
    "more.logout": "Đăng xuất",
    "more.search": "Tìm kiếm",
    "more.searchDetail": "Tìm issue và project",
    "more.agents": "Agents",
    "more.agentsDetail": "AI agents và actions",
    "more.profile": "Hồ sơ",
    "more.profileDetail": "Thông tin cá nhân và bảo mật",
    "more.organization": "Tổ chức",
    "more.organizationDetail": "Workspace và thành viên",
    "more.aiBudget": "Ngân sách AI",
    "more.aiBudgetDetail": "Giới hạn và theo dõi chi phí AI",
    "more.systemUsers": "Người dùng hệ thống",
    "more.systemUsersDetail": "Quản trị tài khoản toàn hệ thống",
    "more.mobileSettings": "Cài đặt mobile",
    "more.mobileSettingsDetail": "Thông báo, sinh trắc học và thiết bị",
    "home.greeting": "Chào",
    "home.todayOverview": "Tổng quan hôm nay",
    "home.myWork": "Việc của tôi",
    "home.overdue": "Quá hạn",
    "home.unread": "Chưa đọc",
    "home.focus": "TẬP TRUNG",
    "home.inProgress": "Đang thực hiện",
    "home.noInProgress": "Không có công việc đang thực hiện.",
    "home.workspaces": "WORKSPACES",
    "home.recentProjects": "Dự án gần đây",
    "home.openProject": "Mở dự án để xem board và công việc",
    "projects.title": "Dự án",
    "projects.projectCount": "dự án",
    "projects.create": "+ Tạo",
    "projects.emptyTitle": "Chưa có dự án",
    "projects.emptyBody": "Tạo dự án đầu tiên để bắt đầu.",
    "projects.issues": "issues",
    "projects.createTitle": "Tạo dự án",
    "projects.keyPlaceholder": "Key (VD: AIPM)",
    "projects.namePlaceholder": "Tên dự án",
    "projects.descriptionPlaceholder": "Mô tả",
    "projects.creating": "Đang tạo...",
    "projects.workspaceSuffix": "trong workspace",
    "projects.noDescription": "Chưa có mô tả dự án",
    "projects.newProject": "DỰ ÁN MỚI",
    "projects.createError": "Không thể tạo dự án",
    "common.cancel": "Hủy",
    "myWork.title": "Công việc của tôi",
    "myWork.workCount": "công việc",
    "myWork.empty": "Không có công việc",
    "inbox.title": "Thông báo",
    "inbox.unread": "chưa đọc",
    "inbox.markAll": "Đọc hết",
    "inbox.empty": "Không có thông báo",
    "login.initialSetup": "Khởi tạo System Owner đầu tiên.",
    "login.description": "Quản lý dự án, công việc và AI agents trên mobile.",
    "login.name": "Tên của bạn",
    "login.email": "Email",
    "login.password": "Mật khẩu",
    "login.processing": "Đang xử lý...",
    "login.setup": "Khởi tạo AI-PM",
    "login.signIn": "Đăng nhập",
    "login.setupTitle": "Thiết lập workspace đầu tiên",
    "login.welcomeBack": "Chào mừng trở lại",
    "login.setupBody": "Tạo System Owner để bắt đầu vận hành AI-PM.",
    "login.signInBody":
      "Đăng nhập để tiếp tục quản lý dự án, công việc và AI agents.",
    "login.setupInfo": "Thông tin khởi tạo",
    "login.secureSignIn": "Đăng nhập an toàn",
    "login.setupFailed": "Khởi tạo thất bại",
    "login.signInFailed": "Đăng nhập thất bại",
  },
  en: {
    "common.system": "System",
    "common.light": "Light",
    "common.dark": "Dark",
    "common.vietnamese": "Tiếng Việt",
    "common.english": "English",
    "nav.home": "Home",
    "nav.projects": "Projects",
    "nav.myWork": "My Work",
    "nav.inbox": "Inbox",
    "nav.more": "More",
    "more.title": "More",
    "more.subtitle": "Account, workspace and settings",
    "more.workspace": "Workspace",
    "more.tools": "Tools & settings",
    "more.appearanceLanguage": "Appearance & language",
    "more.theme": "Theme",
    "more.language": "Language",
    "more.logout": "Sign out",
    "more.search": "Search",
    "more.searchDetail": "Find issues and projects",
    "more.agents": "Agents",
    "more.agentsDetail": "AI agents and actions",
    "more.profile": "Profile",
    "more.profileDetail": "Personal information and security",
    "more.organization": "Organization",
    "more.organizationDetail": "Workspace and members",
    "more.aiBudget": "AI Budget",
    "more.aiBudgetDetail": "Limits and AI cost tracking",
    "more.systemUsers": "System Users",
    "more.systemUsersDetail": "Manage system-wide accounts",
    "more.mobileSettings": "Mobile settings",
    "more.mobileSettingsDetail": "Notifications, biometrics and devices",
    "home.greeting": "Hi",
    "home.todayOverview": "Today overview",
    "home.myWork": "My work",
    "home.overdue": "Overdue",
    "home.unread": "Unread",
    "home.focus": "FOCUS",
    "home.inProgress": "In progress",
    "home.noInProgress": "No work is currently in progress.",
    "home.workspaces": "WORKSPACES",
    "home.recentProjects": "Recent projects",
    "home.openProject": "Open the project to view its board and work",
    "projects.title": "Projects",
    "projects.projectCount": "projects",
    "projects.create": "+ Create",
    "projects.emptyTitle": "No projects yet",
    "projects.emptyBody": "Create your first project to get started.",
    "projects.issues": "issues",
    "projects.createTitle": "Create project",
    "projects.keyPlaceholder": "Key (e.g. AIPM)",
    "projects.namePlaceholder": "Project name",
    "projects.descriptionPlaceholder": "Description",
    "projects.creating": "Creating...",
    "projects.workspaceSuffix": "in workspace",
    "projects.noDescription": "No project description yet",
    "projects.newProject": "NEW PROJECT",
    "projects.createError": "Could not create project",
    "common.cancel": "Cancel",
    "myWork.title": "My Work",
    "myWork.workCount": "items",
    "myWork.empty": "No work assigned",
    "inbox.title": "Inbox",
    "inbox.unread": "unread",
    "inbox.markAll": "Mark all read",
    "inbox.empty": "No notifications",
    "login.initialSetup": "Set up the first System Owner.",
    "login.description": "Manage projects, work and AI agents on mobile.",
    "login.name": "Your name",
    "login.email": "Email",
    "login.password": "Password",
    "login.processing": "Processing...",
    "login.setup": "Set up AI-PM",
    "login.signIn": "Sign in",
    "login.setupTitle": "Set up your first workspace",
    "login.welcomeBack": "Welcome back",
    "login.setupBody": "Create the System Owner to start running AI-PM.",
    "login.signInBody":
      "Sign in to continue managing projects, work and AI agents.",
    "login.setupInfo": "Setup information",
    "login.secureSignIn": "Secure sign in",
    "login.setupFailed": "Setup failed",
    "login.signInFailed": "Sign in failed",
  },
};

export type AppPreferencesContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: "light" | "dark";
  theme: AppTheme;
  language: AppLanguage;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  setLanguage: (value: AppLanguage) => Promise<void>;
  t: (key: TranslationKey) => string;
};

const defaultValue: AppPreferencesContextValue = {
  themePreference: "system",
  resolvedTheme: "light",
  theme: lightTheme,
  language: "vi",
  setThemePreference: async () => undefined,
  setLanguage: async () => undefined,
  t: (key) => translations.vi[key],
};

export const AppPreferencesContext =
  createContext<AppPreferencesContextValue>(defaultValue);

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}

export function translate(language: AppLanguage, key: TranslationKey) {
  return translations[language][key];
}
