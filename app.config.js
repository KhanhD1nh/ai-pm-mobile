const isEsignBuild = process.env.AI_PM_IOS_DISTRIBUTION === "esign";
const esignBundleIdentifier =
  process.env.AI_PM_IOS_BUNDLE_IDENTIFIER || "com.aipm.mobile";

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
  updates: isEsignBuild
    ? {
        ...config.updates,
        requestHeaders: {
          ...config.updates?.requestHeaders,
          "expo-channel-name": "internal",
        },
      }
    : config.updates,
  // Keep expo-notifications enabled for ESign builds. The final APNs
  // entitlement is authorized by the provisioning profile used when the IPA
  // is signed/re-signed; sideloading itself does not prevent remote push.
  plugins: isEsignBuild
    ? withEsignProductionNotifications(config.plugins)
    : config.plugins,
  ios: {
    ...config.ios,
    bundleIdentifier: isEsignBuild
      ? esignBundleIdentifier
      : config.ios?.bundleIdentifier,
  },
  extra: {
    ...config.extra,
    distributionMode: isEsignBuild ? "esign" : "standard",
    updateChannel: isEsignBuild ? "internal" : undefined,
  },
});
