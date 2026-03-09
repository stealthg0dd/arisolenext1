/**
 * Expo config plugin to fix C++20 compilation for React Native New Architecture.
 * Ensures std::format and other C++20 features work (required by RN 0.76+).
 *
 * - Enforces NDK 26.1.10909125, compileSdk 36, targetSdk 36
 * - Adds cppFlags "-std=c++20" and ANDROID_STL=c++_shared to app build.gradle
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NDK_VERSION = "26.1.10909125";
const COMPILE_SDK = 36;
const TARGET_SDK = 36;

function withAndroidCppFix(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;

      // 1. Update gradle.properties - enforce NDK, compileSdk, targetSdk
      const gradlePropsPath = path.join(projectRoot, "gradle.properties");
      if (fs.existsSync(gradlePropsPath)) {
        let props = fs.readFileSync(gradlePropsPath, "utf8");
        const setProp = (key, val) => {
          const regex = new RegExp(`${key.replace(".", "\\.")}=.*`, "m");
          if (regex.test(props)) {
            props = props.replace(regex, `${key}=${val}`);
          } else {
            props = props.trimEnd() + `\n${key}=${val}\n`;
          }
        };
        setProp("android.ndkVersion", NDK_VERSION);
        setProp("android.compileSdkVersion", COMPILE_SDK);
        setProp("android.targetSdkVersion", TARGET_SDK);
        setProp("android.enablePngCrunchInReleaseBuilds", "false");
        fs.writeFileSync(gradlePropsPath, props);
      }

      // 2. Update root build.gradle - enforce NDK and compileSdk (fallback if config plugin ignored)
      const rootBuildGradlePath = path.join(projectRoot, "build.gradle");
      if (fs.existsSync(rootBuildGradlePath)) {
        let rootGradle = fs.readFileSync(rootBuildGradlePath, "utf8");

        // Force NDK version
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

        // Force compileSdkVersion 36 via ext block (before apply plugin)
        const extBlock = `
// Force SDK 36 for androidx.core:core-ktx:1.17.0 (withAndroidCppFix fallback)
ext {
    compileSdkVersion = ${COMPILE_SDK}
    targetSdkVersion = ${TARGET_SDK}
}
`;
        if (!rootGradle.includes("compileSdkVersion = " + COMPILE_SDK)) {
          rootGradle = extBlock + rootGradle;
        }

        fs.writeFileSync(rootBuildGradlePath, rootGradle);
      }

      // 3. Update app build.gradle - add cppFlags, aaptOptions (fix AAPT2 crash on assets)
      const appBuildGradlePath = path.join(projectRoot, "app", "build.gradle");
      if (fs.existsSync(appBuildGradlePath)) {
        let appGradle = fs.readFileSync(appBuildGradlePath, "utf8");

        // Add aaptOptions to prevent AAPT2 crash on assets_images_logo.png
        if (!appGradle.includes("cruncherEnabled = false")) {
          const aaptBlock = `
    // Disable PNG cruncher to prevent AAPT2 crash on assets (e.g. assets_images_logo.png)
    aaptOptions {
        cruncherEnabled = false
        useNewCruncher = false
    }
`;
          const packagingIdx = appGradle.indexOf("packagingOptions {");
          if (packagingIdx !== -1) {
            appGradle =
              appGradle.slice(0, packagingIdx) +
              aaptBlock +
              "\n    " +
              appGradle.slice(packagingIdx);
          }
        }

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
            }
          }
        }

        fs.writeFileSync(appBuildGradlePath, appGradle);
      }

      return config;
    },
  ]);
}

module.exports = withAndroidCppFix;
