# Bible Tags

## About

*Original language Bible study for everyone, in every language.*

Vision: That every Christian might have free access to the Bible tagged to the original Hebrew, Aramaic and Greek with parsing and lexical information—all in their own language.

For more information on this project, see the [Bible Tags website](https://bibletags.org).

## Repos

* [bibletags-data](https://github.com/educational-resources-and-services/bibletags-data)
* [bibletags-react-native-app](https://github.com/educational-resources-and-services/bibletags-react-native-app)
* [bibletags-ui-helper](https://github.com/educational-resources-and-services/bibletags-ui-helper)
* [bibletags-versification](https://github.com/educational-resources-and-services/bibletags-versification)
* [bibletags-usfm](https://github.com/educational-resources-and-services/bibletags-usfm)
* [bibletags-widget](https://github.com/educational-resources-and-services/bibletags-widget)
* [bibletags-widget-script](https://github.com/educational-resources-and-services/bibletags-widget-script)

## Bugs

* Report [here](https://github.com/educational-resources-and-services/bibletags-data/issues).

# Bible Tags React Native App

An open source app template built in React Native with [Expo](https://expo.dev/).

## Publishing a Bible Tags app / Development

### Installation

_For programmers looking to set up a local development environment, you must first install `bibletags-data` (backend) found [here](https://github.com/educational-resources-and-services/bibletags-data)._

```bash
git clone https://github.com/educational-resources-and-services/bibletags-react-native-app
cd bibletags-react-native-app
npm install
npm run setup
```

Optionally report errors to [Sentry](https://sentry.io) and/or analytics data to [Amplitude](https://amplitude.com) by appropriately replacing the following strings in `./app.json`:
- `[SENTRY_ORGANIZATION]`
- `[SENTRY_PROJECT]`
- `[SENTRY_AUTH_TOKEN]`
- `[SENTRY_DSN]`
- `[AMPLITUDE_KEY]`

### Testing a Bible Tags for Publishing

```bash
npm start
```

### Running for Development

```bash
npm run dev
```

### Customization

The following files and folders allow for significant customization of the app without forking:

* /assets
* /tenantComponents
* app.json
* fonts.js
* language.js
* menu.js
* RouteSwitcher.js
* versions.js

### Translating the UI

1. Modify `language.js`
2. `touch translations/[locale].json`
3. `npm run translate`
4. `npm run translate-convert-json-to-csv`
5. Edit the TRANSLATION column of the new .csv file into your program of choice, saving the file as `[locale].json` (i.e. removing the `-incomplete`)
6. `npm run translate-convert-csv-to-json`

See also [the translation process readme for i18n](https://github.com/educational-resources-and-services/inline-i18n/blob/master/TRANSLATION_PROCESS.md).

### Adding Bible Versions

```bash
npm run import-bible
```

## Initial Deployment To The App Stores

Requires app store accounts and an [expo](https://expo.dev/) account.

```bash
npm run build-android-production
npm run build-ios-production
```

## Updating Your Apps

```bash
npm run push-to-production
```