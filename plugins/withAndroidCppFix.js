/**
 * Expo config plugin to fix C++20 compilation for React Native New Architecture.
 * Ensures std::format and other C++20 features work (required by RN 0.76+).
 *
 * - Sets ndkVersion to 26.1.10909125 in root build.gradle
 * - Adds cppFlags "-std=c++20" and ANDROID_STL=c++_shared to app build.gradle
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NDK_VERSION = "26.1.10909125";

function withAndroidCppFix(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;

      // 1. Update gradle.properties - ensure NDK version for expo-root-project
      const gradlePropsPath = path.join(projectRoot, "gradle.properties");
      if (fs.existsSync(gradlePropsPath)) {
        let props = fs.readFileSync(gradlePropsPath, "utf8");
        if (!props.includes("android.ndkVersion")) {
          props = props.trimEnd() + `\nandroid.ndkVersion=${NDK_VERSION}\n`;
          fs.writeFileSync(gradlePropsPath, props);
        } else {
          props = props.replace(
            /android\.ndkVersion=.*/,
            `android.ndkVersion=${NDK_VERSION}`
          );
          fs.writeFileSync(gradlePropsPath, props);
        }
      }

      // 2. Update root build.gradle - ensure ndkVersion in ext block
      const rootBuildGradlePath = path.join(projectRoot, "build.gradle");
      if (fs.existsSync(rootBuildGradlePath)) {
        let rootGradle = fs.readFileSync(rootBuildGradlePath, "utf8");
        if (rootGradle.includes("ndkVersion")) {
          rootGradle = rootGradle.replace(
            /ndkVersion\s*=\s*"[^"]+"/,
            `ndkVersion = "${NDK_VERSION}"`
          );
        } else if (rootGradle.includes("ext {")) {
          rootGradle = rootGradle.replace(
            /(ext\s*\{[^}]*?)(compileSdkVersion)/,
            `$1ndkVersion = "${NDK_VERSION}"\n        $2`
          );
        }
        fs.writeFileSync(rootBuildGradlePath, rootGradle);
      }

      // 3. Update app build.gradle - add cppFlags to defaultConfig
      const appBuildGradlePath = path.join(projectRoot, "app", "build.gradle");
      if (fs.existsSync(appBuildGradlePath)) {
        let appGradle = fs.readFileSync(appBuildGradlePath, "utf8");
        if (!appGradle.includes('cppFlags "-std=c++20"')) {
          const cppBlock = `
        // C++20 for React Native New Architecture (std::format support)
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++20"
                arguments "-DANDROID_STL=c++_shared"
            }
        }
`;
          // Insert after buildConfigField line, before closing } of defaultConfig
          const buildConfigLine =
            'buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL"';
          const idx = appGradle.indexOf(buildConfigLine);
          if (idx !== -1) {
            const lineEnd = appGradle.indexOf("\n", idx);
            const insertPos = appGradle.indexOf("}", lineEnd);
            if (insertPos !== -1) {
              const before = appGradle.slice(0, insertPos);
              const after = appGradle.slice(insertPos);
              appGradle = before + cppBlock + "\n        " + after;
              fs.writeFileSync(appBuildGradlePath, appGradle);
            }
          }
        }
      }

      return config;
    },
  ]);
}

module.exports = withAndroidCppFix;
