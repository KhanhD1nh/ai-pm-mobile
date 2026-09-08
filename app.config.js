const isEsignBuild = process.env.AI_PM_IOS_DISTRIBUTION === "esign";

function withoutNotificationsPlugin(plugins = []) {
  return plugins.filter((plugin) => {
    if (typeof plugin === "string") return plugin !== "expo-notifications";
    return !Array.isArray(plugin) || plugin[0] !== "expo-notifications";
  });
}

module.exports = ({ config }) => ({
  ...config,
  plugins: isEsignBuild
    ? [
        ...withoutNotificationsPlugin(config.plugins),
        "./plugins/with-esign-ios",
      ]
    : config.plugins,
  extra: {
    ...config.extra,
    distributionMode: isEsignBuild ? "esign" : "standard",
  },
});
