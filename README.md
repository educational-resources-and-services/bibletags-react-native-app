# Bible Tags

## About

*Original language Bible study for everyone, in every language.*

Vision: That every Christian might have free access to the Bible tagged to the original Hebrew, Aramaic and Greek with parsing and lexical information—all in their own language.

For more information on this project, see the [Bible Tags website](https://bibletags.org).

## Repos

* [bibletags-data](https://github.com/educational-resources-and-services/bibletags-data) **(Contains general information on project design and contributing.)**
* [bibletags-react-native-app](https://github.com/educational-resources-and-services/bibletags-react-native-app)
* [bibletags-ui-helper](https://github.com/educational-resources-and-services/bibletags-ui-helper)
* [bibletags-versification](https://github.com/educational-resources-and-services/bibletags-versification)
* [bibletags-widget](https://github.com/educational-resources-and-services/bibletags-widget)
* [bibletags-widget-script](https://github.com/educational-resources-and-services/bibletags-widget-script)

## Bugs

* Use the appropriate repository's `Issues`. Please first check if your bug report / feature request already exists before submitting a new issue.
* For bug reports, please provide a clear description of the problem and step-by-step explanation of how to reproduce it.

# bibletags-react-native-app

An [Expo](https://expo.dev/) app.

## Development

Currently this project does not connect to a backend. Thus, only this repo needs to be installed.

### Installation

```bash
git clone https://github.com/educational-resources-and-services/bibletags-react-native-app
cd bibletags-react-native-app
npm install
npm run setup
```

### Running

```bash
npm run start
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
npm run usfm-to-sqlite
```

#### Initial Deployment To The App Stores

Requires app store accounts and an [expo](https://expo.dev/) account.

```bash
npm run build-android-production
npm run build-ios-production
```

#### Updating Your Apps

```bash
npm run push-to-production
```