#!/bin/bash
set -e
echo "This script outlines steps to build an Android APK using Capacitor (run locally)."

echo "1) Install Capacitor (one-time):"
echo "   npm install @capacitor/core @capacitor/cli --save"

echo "2) Build web app"
echo "   npm run build"

echo "3) Initialize Capacitor (first time):"
echo "   npx cap init escape-maze com.example.escapemaze --web-dir=dist"

echo "4) Add Android:
   npx cap add android"

echo "5) Open Android Studio & build APK:
   npx cap open android
   -> In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)"

echo "Notes: You must have Android SDK, Java JDK, and Android Studio installed. Configure signing before release build."
