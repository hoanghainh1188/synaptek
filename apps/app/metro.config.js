// Metro config cho monorepo npm workspaces + NativeWind.
// Xem: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Theo dõi toàn bộ monorepo để bắt thay đổi trong packages/* (vd @synaptek/grading-engine).
config.watchFolders = [monorepoRoot];

// 2. Resolve node_modules từ cả app lẫn root (workspace hoist deps lên root).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./src/global.css" });
