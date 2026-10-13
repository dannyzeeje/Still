#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${ANDROID_SDK_ROOT:=${ANDROID_HOME:-}}"
if [[ -z "$ANDROID_SDK_ROOT" ]]; then echo 'Set ANDROID_SDK_ROOT to your installed Android SDK.' >&2; exit 1; fi
sdk_platform="${STILL_PLATFORM:-35}"
build_tools="${STILL_BUILD_TOOLS:-35.0.0}"
sdk_jar="$ANDROID_SDK_ROOT/platforms/android-$sdk_platform/android.jar"
tools_dir="$ANDROID_SDK_ROOT/build-tools/$build_tools"
mkdir -p build/gen build/classes build/dex output .signing
"$tools_dir/aapt2" compile --dir app/src/main/res -o build/resources.zip
"$tools_dir/aapt2" link -o build/unsigned.apk --manifest app/src/main/AndroidManifest.xml -I "$sdk_jar" --java build/gen -A app/src/main/assets build/resources.zip
find app/src/main/java build/gen -name '*.java' > build/sources.txt
java -m jdk.compiler/com.sun.tools.javac.Main -source 8 -target 8 -bootclasspath "$sdk_jar" -d build/classes @build/sources.txt
java -m jdk.jartool/sun.tools.jar.Main cf build/classes.jar -C build/classes .
"$tools_dir/d8" --release --min-api 26 --lib "$sdk_jar" --output build/dex build/classes.jar
python3 - <<'PY'
from zipfile import ZipFile,ZIP_DEFLATED
with ZipFile('build/unsigned.apk','a',compression=ZIP_DEFLATED) as z:z.write('build/dex/classes.dex','classes.dex')
PY
"$tools_dir/zipalign" -f 4 build/unsigned.apk build/aligned.apk
keystore="${STILL_KEYSTORE:-.signing/still-release.p12}"
password_file="${STILL_STORE_PASSWORD_FILE:-.signing/password.txt}"
if [[ ! -f "$keystore" || ! -f "$password_file" ]]; then
 echo 'Original Still signing files are required. Refusing to generate a replacement key.' >&2
 exit 1
fi
"$tools_dir/apksigner" sign --ks "$keystore" --ks-pass "file:$password_file" --out output/Still.apk build/aligned.apk
"$tools_dir/apksigner" verify --verbose output/Still.apk
