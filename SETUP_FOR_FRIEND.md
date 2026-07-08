# FieldKonnect KSB Setup

## Requirements

- macOS with Android Studio installed
- Xcode installed
- Node 20 or newer
- Yarn 1.x or npm
- CocoaPods

## Install

```sh
yarn install
cd ios
pod install
cd ..
```

The `postinstall` script patches React Native dependency Gradle files so Android Studio can sync even when its PATH cannot find `node`.

## Run Android

```sh
yarn start
```

Open the `android` folder in Android Studio, sync Gradle, then run the app.

Package id: `com.fieldkonnect.ksb`

## Run iOS

Open `ios/FieldConnect.xcworkspace` in Xcode and run the `FieldConnect` scheme.
