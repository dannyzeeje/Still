# Still

A local-first Android planner with tasks, boards, subtasks, calendar, notes, habits, and a focus timer. The app uses bundled web assets in a native Android WebView and stores data locally with SQLite.

## Install

Download Still-1.18.apk from the v1.18 release. Android asks you to allow installation from your browser. Installing an official update over the existing app preserves its data; export a backup before updating. Android 8.0 or later is required.

## Privacy

No account or tracking is required. Tasks, notes, profile information and backups are not included in this source distribution. Settings → App updates fetches only public update metadata when requested. GitHub receives ordinary network request information such as your IP address. APK downloads open in your browser; installation requires your confirmation.

## Build

Install Java, Python 3, Android SDK platform 35 and build-tools 35.0.0. Set ANDROID_SDK_ROOT and run `bash build-apk.sh`.

Signing keys and passwords are deliberately excluded. The official maintainer retains the original signing key privately to preserve update compatibility. For a fork, use your own signing key and a different application ID. Set STILL_KEYSTORE and STILL_STORE_PASSWORD_FILE to private files outside the repository before building. Never commit these files.

## Updates

The checker reads update.json from the main branch of dannyzeeje/still. Publish Still-1.18.apk as a release asset under tag v1.18, then commit update.json. Future releases must increment Android versionCode, retain the official signing identity, and update the metadata and APK SHA-256.

## Validation

Version 1.18 adds overdue carryover, grey habit history before creation, and subtask progress. Automated workflow and behavior checks pass. The APK signature is verified. No on-device visual validation was performed for this release.

## Licensing

This project is released under the MIT License in LICENSE. Bundled fonts retain their own licenses in app/src/main/assets/fonts.
