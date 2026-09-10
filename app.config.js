const isEsignBuild = process.env.AI_PM_IOS_DISTRIBUTION === "esign";
const esignBundleIdentifier =
  process.env.AI_PM_IOS_BUNDLE_IDENTIFIER || "com.aipm.mobile";
const esignAppGroupIdentifier =
  process.env.AI_PM_IOS_APP_GROUP_IDENTIFIER?.trim() ||
  `group.${esignBundleIdentifier}`;
const explicitUpdateChannel = process.env.AI_PM_UPDATE_CHANNEL?.trim();
const updateChannel = isEsignBuild ? "internal" : explicitUpdateChannel;
const rawBuildNumber = process.env.AI_PM_BUILD_NUMBER?.trim();
const numericBuildNumber = rawBuildNumber
  ? Number.parseInt(rawBuildNumber, 10)
  : undefined;

const widgetDefinitions = [
  {
    name: "AiPmFocusWidget",
    displayName: "AI-PM Focus",
    description: "Xem nhanh việc cần chú ý và tiến độ công việc của bạn.",
    supportedFamilies: ["systemSmall", "systemMedium"],
  },
];

function withEsignProductionNotifications(plugins = []) {
  return plugins.map((plugin) => {
    if (plugin === "expo-notifications") {
      return ["expo-notifications", { mode: "production" }];
    }
    if (Array.isArray(plugin) && plugin[0] === "expo-notifications") {
      return [
        "expo-notifications",
        { ...(plugin[1] ?? {}), mode: "production" },
      ];
    }
    return plugin;
  });
}

module.exports = ({ config }) => ({
  ...config,
  updates: updateChannel
    ? {
        ...config.updates,
        requestHeaders: {
          ...config.updates?.requestHeaders,
          "expo-channel-name": updateChannel,
        },
      }
    : config.updates,
  // Keep expo-notifications enabled for ESign builds. The final APNs
  // entitlement is authorized by the provisioning profile used when the IPA
  // is signed/re-signed; sideloading itself does not prevent remote push.
  plugins: [
    ...(isEsignBuild
      ? withEsignProductionNotifications(config.plugins)
      : config.plugins),
    [
      "expo-widgets",
      {
        bundleIdentifier: `${isEsignBuild ? esignBundleIdentifier : (config.ios?.bundleIdentifier ?? "com.aipm.mobile")}.widgets`,
        groupIdentifier: isEsignBuild
          ? esignAppGroupIdentifier
          : `group.${config.ios?.bundleIdentifier ?? "com.aipm.mobile"}`,
        widgets: widgetDefinitions,
      },
    ],
  ],
  ios: {
    ...config.ios,
    bundleIdentifier: isEsignBuild
      ? esignBundleIdentifier
      : config.ios?.bundleIdentifier,
    buildNumber: rawBuildNumber || config.ios?.buildNumber,
  },
  android: {
    ...config.android,
    versionCode:
      numericBuildNumber && Number.isSafeInteger(numericBuildNumber)
        ? numericBuildNumber
        : config.android?.versionCode,
  },
  extra: {
    ...config.extra,
    distributionMode: isEsignBuild ? "esign" : "standard",
    updateChannel,
  },
});
