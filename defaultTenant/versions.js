// Set also DEFAULT_BIBLE_VERSIONS in app.json

import originalRequires from './assets/bundledVersions/original/requires'

const removeIndentAndBlankStartEndLines = str => {
  const lines = str.replace(/(^\n|\n$)/g, '').split(`\n`)
  const numSpacesInIndent = (lines[0] || lines[1]).match(/^ */)[0].length
  return lines.map(line => line.replace(new RegExp(` {1,${numSpacesInIndent}}`), ``)).join(`\n`)
}

const bibleVersions = [
  {
    id: 'original',
    bundled: true,
    files: originalRequires,
    originalRevisionNum: 8,
    abbr: 'Heb+Grk',
    name: 'unfoldingWord Hebrew Bible + unfoldingWord Greek New Testament',
    copyright: removeIndentAndBlankStartEndLines(`
      This work is designed by unfoldingWord® and developed by the Door43 World Missions Community; it is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.
      The UHB is based on the Open Scriptures Hebrew Bible.
    `),
    languageId: 'heb+grk',
    versificationModel: 'original',
    hebrewOrdering: true,  // typically `true` when versificationModel is 'original'
    isOriginal: true,
    required: true,  // i.e. user cannot remove this version
  },
  // {
  //   id: 'lxx',
  //   lxxRevisionNum: 1,
  //   abbr: 'LXX',
  //   name: 'Septuagint',
  //   copyright: 'Septuaginta, ed. A. Rahlfs (Stuttgart: WŸrttembergische Bibelanstalt, 1935; repr. in 9th ed., 1971).',
  //   languageId: 'grk',
  //   versificationModel: 'lxx',
  //   extraVerseMappings: {},
  // },
  {
    id: 'kjv',
    kjvRevisionNum: 1,
    abbr: 'KJV',
    name: 'King James Version',
    copyright: 'Public domain.',
    languageId: 'eng',
    versificationModel: 'kjv',
    skipsUnlikelyOriginals: false,
    extraVerseMappings: {},
  },
  // {
  //   id: 'syno',
  //   synoRevisionNum: 1,
  //   abbr: 'SYNO',
  //   name: 'Russian Synodal Bible',
  //   copyright: 'Public domain.',
  //   languageId: 'rus',
  //   versificationModel: 'synodal',
  //   skipsUnlikelyOriginals: false,
  //   extraVerseMappings: {},
  // },
  // {
  //   id: 'mng',
  //   mngRevisionNum: 1,
  //   abbr: 'MNG',
  //   name: 'Die Menge-Bibel',
  //   copyright: 'Public domain.',
  //   languageId: 'ger',  // or 'deu' (they are synonymns)
  //   versificationModel: 'kjv',
  //   skipsUnlikelyOriginals: false,
  //   extraVerseMappings: {},
  // },
  {
    id: 'schl',
    schlRevisionNum: 1,
    abbr: 'SCHL',
    name: 'Schlachter 1951',
    copyright: 'Public domain.',
    languageId: 'ger',  // or 'deu' (they are synonymns)
    versificationModel: 'kjv',
    skipsUnlikelyOriginals: false,
    extraVerseMappings: {},
  },
  // {
  //   id: 'cuv',
  //   cuvRevisionNum: 1,
  //   abbr: 'CUV',
  //   name: 'Chinese Union Version (Traditional)',
  //   copyright: 'Public domain.',
  //   languageId: 'zho',
  //   versificationModel: 'kjv',
  //   skipsUnlikelyOriginals: false,
  //   extraVerseMappings: {},
  // },
  // {
  //   id: 'cuvs',
  //   cuvsRevisionNum: 1,
  //   abbr: 'CUVS',
  //   name: 'Chinese Union Version (Simplified)',
  //   copyright: 'Public domain.',
  //   languageId: 'zho',
  //   versificationModel: 'kjv',
  //   skipsUnlikelyOriginals: false,
  //   extraVerseMappings: {},
  // },
  // {
  //   id: 'vdcc',
  //   vdccRevisionNum: 1,
  //   abbr: 'VDCC',
  //   name: 'Dumitru Cornilescu',
  //   copyright: 'Public domain.',
  //   languageId: 'rum',  // or 'ron' (they are synonymns)
  //   versificationModel: 'kjv',
  //   skipsUnlikelyOriginals: false,
  //   extraVerseMappings: {},
  // },
  {
    id: 'lba',
    lbaRevisionNum: 1,
    abbr: 'LBA',
    name: 'La Bible Annotée',
    copyright: 'Public domain.',
    languageId: 'fre',
    versificationModel: 'kjv',
    skipsUnlikelyOriginals: false,
    extraVerseMappings: {},
  },
]

export default bibleVersions