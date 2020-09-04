import React, { useMemo } from "react"
import { Dimensions, I18nManager, AsyncStorage, Platform } from "react-native"
import * as Updates from 'expo-updates'
import NetInfo from "@react-native-community/netinfo"
import Constants from "expo-constants"
import * as SQLite from "expo-sqlite"
import { isIphoneX } from "react-native-iphone-x-helper"
import { getPassageStr } from "bibletags-ui-helper"
import { i18n, isRTL } from "inline-i18n"
import { getBookIdListWithCorrectOrdering } from "bibletags-versification/src/versification"
import { styled } from "@ui-kitten/components"
import useCounter from "react-use/lib/useCounter"
// import Animated, { Extrapolate } from "react-native-reanimated"

import bibleVersions from "../../versions"
import useSetTimeout from "../hooks/useSetTimeout"
import useChangeIndex from "../hooks/useChangeIndex"

const {
  MAXIMUM_NUMBER_OF_RECENT,
} = Constants.manifest.extra

const hebrewOrderingOfBookIds = [
  ...[
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    9,
    10,
    11,
    12,
    23,
    24,
    26,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    19,
    20,
    18,
    22,
    8,
    25,
    21,
    17,
    27,
    15,
    16,
    13,
    14,
  ],
  ...Array(27).fill().map((x, idx) => idx+40),  // NT books are in the same order
]

// const cachedSizes = {}

export const cloneObj = obj => JSON.parse(JSON.stringify(obj))

export const isIPhoneX = isIphoneX()
export const iPhoneXInset = {
  // This still needs to be given correct numbers
  portrait: {
    topInset: 23,
    bottomInset: 0,
  },
}
export const getToolbarHeight = () => 56

export const readHeaderHeight = 40

export const readHeaderMarginTop = (
  Platform.OS === 'android'
    ? 5
    : (26 + (
      isIPhoneX
        ? iPhoneXInset['portrait'].topInset
        : 0
    ))
)

export const isPhoneSize = () => {
  const { width, height } = Dimensions.get('window')
  return Math.min(width, height) < 500
}

let netInfoIsConnectedFetch
let isConnectedResolveFunctions = []

export const isConnected = () => new Promise(resolve => {
  isConnectedResolveFunctions.push(resolve)
  
  if(!netInfoIsConnectedFetch) {
    const doResolves = isConnected => {
      netInfoIsConnectedFetch = undefined
      isConnectedResolveFunctions.forEach(func => func(isConnected))
      isConnectedResolveFunctions = []
    }

    netInfoIsConnectedFetch = NetInfo.fetch()
      .then(doResolves)
      .catch(() => doResolves(false))
  }
})

export const executeSql = async ({
  versionId,
  bookId,
  statement,
  args,
  limit,
  statements,
  removeCantillation,
  removeWordPartDivisions,
}) => {
  const versionInfo = getVersionInfo(versionId)
  const queryingSingleBook = !!bookId

  if(!versionInfo) return null

  const logDBError = async error => {
    console.log(`ERROR when running executeSql: ${error}`, error)

    // For an unknown reason, a text sometimes will not load to sqlite immediately after being downloaded.
    // Try a single reload in such a case.

    const unableToOpenSqliteLastReloadTimeKey = `unableToOpenSqliteLastReloadTime-${versionId}`
    const unableToOpenSqliteLastReloadTime = (parseInt(await AsyncStorage.getItem(unableToOpenSqliteLastReloadTimeKey), 10) || 0)
    const now = Date.now()

    if(now - unableToOpenSqliteLastReloadTime > 1000 * 60 * 5) {
      await AsyncStorage.setItem(unableToOpenSqliteLastReloadTimeKey, `${now}`)
      await Updates.reloadAsync()
    }
  }

  const getEmptyResultSet = () => ({
    rows: {
      _array: [],
    },
  })

  const resultSets = [ statement ? getEmptyResultSet() : statements.map(() => getEmptyResultSet()) ]

  const executeSqlForBook = async bookId => {
    try {

      const db = SQLite.openDatabase(`${versionId}/${bookId}.db`)

      await new Promise(resolveAll => {
        db.transaction(
          tx => {

            if(statement) {
              statements = [{
                statement,
                args,
                limit,
              }]
            }

            for(let idx in statements) {
              const { statement, args=[] } = statements[idx]
              const limit = statements[idx].limit - resultSets[idx].rows._array.length

              if(Number.isInteger(limit) && limit <= 0) continue

              tx.executeSql(
                statement({
                  bookId,
                  limit,
                }),
                args,
                (x, resultSet) => {
                  if(queryingSingleBook) {
                    resultSets[idx] = resultSet
                  } else {
                    resultSets[idx].rows._array.splice(resultSets[idx].rows._array.length, 0, ...resultSet.rows._array)
                  }
                },
                logDBError,
              )
            }

          },
          logDBError,
          resolveAll,
        )
      })

    } catch(e) {}
  }

  if(queryingSingleBook) {
    await executeSqlForBook(bookId)
  } else {
    const orderedBookIds = versionInfo.hebrewOrdering ? hebrewOrderingOfBookIds : Array(66).fill().map((x, idx) => idx+1)
    for(let idx in orderedBookIds) {
      await executeSqlForBook(orderedBookIds[idx])
    }
  }

  if(versionInfo.isOriginal && ['heb', 'heb+grk'].includes(versionInfo.languageId)) {
    resultSets.forEach(resultSet => {
      try {
        const { rows: { _array: verses } } = resultSet

        verses.forEach(verse => {

          if(removeWordPartDivisions) {
            verse.usfm = verse.usfm.replace(/\u200B/g, '')  // zero-width space (used to indicate word parts)
          }
          
          if(removeCantillation) {
            verse.usfm = verse.usfm.replace(/[\u0591-\u05AF\u05A5\u05BD\u05BF\u05C0\u05C5\u05C7]/g,'')
          }

        })

      } catch(e) {}
    })
  }

  return statement ? resultSets[0] : resultSets
}

export const escapeLike = like => (
  like
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
)

export const getVersionInfo = versionId => {
  let versionInfo = {}

  bibleVersions.some(version => {
    if(versionId === version.id) {
      versionInfo = version
      return true
    }
  })

  return versionInfo
}

export const getTextLanguageId = ({ languageId, bookId }) => (
  languageId === `heb+grk`
    ? (bookId <= 39 ? 'heb' : 'grk')
    : languageId
)

export const isForceUserFontTag = tag => [ 'mt', 'v', 'ms', 's1', 's2' ].includes(tag)

export const getTextFont = ({ font, isOriginal, languageId, bookId, tag }) => (
  (isOriginal && !isForceUserFontTag(tag))
    ? `original-${getTextLanguageId({ languageId, bookId })}`
    : font
)

export const isRTLText = ({ languageId, bookId, searchString }) => (
  languageId === 'heb+grk'
    ? (
      bookId
        ? bookId <= 39 ? true : false
        : /^[\u0590-\u05FF ]*$/g.test(searchString)
    )
    : [
      'heb',
      'yid',
      'ara',
      'per',
      'fas',
      'urd',
      'pus',
      'syc',
      'syr',
      'sam',
      'snd',
    ].includes(languageId)
)

export const refsMatch = (ref1={}, ref2={}) => `${ref1.bookId}:${ref1.chapter}` === `${ref2.bookId}:${ref2.chapter}`

export const updateRecentLists = ({ newState }) => {

  const newRecentPassages = [ 'current' ]
  const newRecentSearches = []
  const newRecentSearchStrings = []

  newState.history.some(({ type, ref, searchString }, index) => {

    if(
      type === 'passage'
      && newState.recentPassages.includes(index)
      && !refsMatch(newState.passage.ref, ref)
    ) {
      newRecentPassages.push(index)
    }

    if(
      type === 'search'
      && newState.recentSearches.includes(index)
      && !newRecentSearchStrings.includes(searchString)
    ) {
      newRecentSearches.push(index)
      newRecentSearchStrings.push(searchString)
    }

    if(newRecentPassages.length + newRecentSearches.length >= MAXIMUM_NUMBER_OF_RECENT) {
      return true
    }

  })

  const versionInfo = getVersionInfo(newState.passage.versionId)
  const bookIds = getBookIdListWithCorrectOrdering({ versionInfo })

  newRecentPassages.sort((a, b) => {
    const refA = a === 'current' ? newState.passage.ref : newState.history[a].ref
    const refB = b === 'current' ? newState.passage.ref : newState.history[b].ref

    return (
      bookIds.indexOf(refA.bookId) > bookIds.indexOf(refB.bookId)
      || (
        refA.bookId === refB.bookId
        && refA.chapter > refB.chapter
      )
    )
  })

  newState.recentPassages = newRecentPassages
  newState.recentSearches = newRecentSearches

}

export const getCopyVerseText = ({ pieces, ref, versionAbbr }) => {
  let selectedTextContent = ''

  pieces.forEach(({ tag, text }) => {
    if([ 'd' ].includes(tag)) return
    if(!text) return

    selectedTextContent += text
  })

  return i18n("{{verse}} ({{passage_reference}} {{version}})", {
    verse: selectedTextContent.trim(),
    passage_reference: getPassageStr({
      refs: [ ref ],
    }),
    version: versionAbbr,
  })
}

export const stripHebrew = (hebrewString="") => {
  // See scripts/importUsfmToSqlite.js for the same variables
  const hebrewCantillationRegex = /[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C5\u05C7]/g
  const hebrewVowelsRegex = /[\u05B0-\u05BC\u05C1\u05C2\u05C4]/g
  const wordPartDividerRegex = /\u200B/g
  const wordDividerRegex = /(?:[\0-@\[-`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u036F\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482-\u0489\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u061F\u064B-\u066D\u0670\u06D4\u06D6-\u06E4\u06E7-\u06ED\u06F0-\u06F9\u06FD\u06FE\u0700-\u070F\u0711\u0730-\u074C\u07A6-\u07B0\u07B2-\u07C9\u07EB-\u07F3\u07F6-\u07F9\u07FB-\u07FF\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u083F\u0859-\u085F\u086B-\u089F\u08B5\u08BE-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962-\u0970\u0981-\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA-\u09BC\u09BE-\u09CD\u09CF-\u09DB\u09DE\u09E2-\u09EF\u09F2-\u09FB\u09FD-\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34-\u0A37\u0A3A-\u0A58\u0A5D\u0A5F-\u0A71\u0A75-\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA-\u0ABC\u0ABE-\u0ACF\u0AD1-\u0ADF\u0AE2-\u0AF8\u0AFA-\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A-\u0B3C\u0B3E-\u0B5B\u0B5E\u0B62-\u0B70\u0B72-\u0B82\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BCF\u0BD1-\u0C04\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C3E-\u0C57\u0C5B-\u0C5F\u0C62-\u0C7F\u0C81-\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA-\u0CBC\u0CBE-\u0CDD\u0CDF\u0CE2-\u0CF0\u0CF3-\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D3E-\u0D4D\u0D4F-\u0D53\u0D57-\u0D5E\u0D62-\u0D79\u0D80-\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0E00\u0E31-\u0E3F\u0E47-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EB1\u0EB4-\u0EBC\u0EBE\u0EBF\u0EC5\u0EC7-\u0EDB\u0EE0-\u0EFF\u0F01-\u0F3F\u0F48\u0F6D-\u0F87\u0F8D-\u0FFF\u102B-\u103E\u1040-\u104F\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16F0\u16F9-\u16FF\u170D\u1712-\u171F\u1732-\u173F\u1752-\u175F\u176D\u1771-\u177F\u17B4-\u17D6\u17D8-\u17DB\u17DD-\u181F\u1879-\u187F\u1885-\u18A9\u18AB-\u18AF\u18F6-\u18FF\u191F-\u194F\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19FF\u1A17-\u1A1F\u1A55-\u1AA6\u1AA8-\u1B04\u1B34-\u1B44\u1B4C-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BFF\u1C24-\u1C4C\u1C50-\u1C59\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1CFB-\u1CFF\u1DC0-\u1DFF\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u200A\u200C-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u2182\u2185-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CEF-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7F\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF-\u2E2E\u2E30-\u3004\u3007-\u3030\u3036-\u303A\u303D-\u3040\u3097-\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31BB-\u31EF\u3200-\u33FF\u4DB6-\u4DFF\u9FF0-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA620-\uA629\uA62C-\uA63F\uA66F-\uA67E\uA69E\uA69F\uA6E6-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7C7-\uA7F6\uA802\uA806\uA80B\uA823-\uA83F\uA874-\uA881\uA8B4-\uA8F1\uA8F8-\uA8FA\uA8FC\uA8FF-\uA909\uA926-\uA92F\uA947-\uA95F\uA97D-\uA983\uA9B3-\uA9CE\uA9D0-\uA9DF\uA9E5\uA9F0-\uA9FF\uAA29-\uAA3F\uAA43\uAA4C-\uAA5F\uAA77-\uAA79\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAC3-\uAADA\uAADE\uAADF\uAAEB-\uAAF1\uAAF5-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB68-\uAB6F\uABE3-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB1E\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFE6F\uFE75\uFEFD-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEFF\uDF20-\uDF2C\uDF41\uDF4A-\uDF4F\uDF76-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0-\uDFFF]|\uD801[\uDC9E-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE01-\uDE0F\uDE14\uDE18\uDE36-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE5-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD24-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF46-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC00-\uDC02\uDC38-\uDC82\uDCB0-\uDCCF\uDCE9-\uDD43\uDD45-\uDD4F\uDD73-\uDD75\uDD77-\uDD82\uDDB3-\uDDC0\uDDC5-\uDDD9\uDDDB\uDDDD-\uDDFF\uDE12\uDE2C-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEDF-\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A-\uDF3C\uDF3E-\uDF4F\uDF51-\uDF5C\uDF62-\uDFFF]|\uD805[\uDC35-\uDC46\uDC4B-\uDC5E\uDC60-\uDC7F\uDCB0-\uDCC3\uDCC6\uDCC8-\uDD7F\uDDAF-\uDDD7\uDDDC-\uDDFF\uDE30-\uDE43\uDE45-\uDE7F\uDEAB-\uDEB7\uDEB9-\uDEFF\uDF1B-\uDFFF]|\uD806[\uDC2C-\uDC9F\uDCE0-\uDCFE\uDD00-\uDD9F\uDDA8\uDDA9\uDDD1-\uDDE0\uDDE2\uDDE4-\uDDFF\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE4F\uDE51-\uDE5B\uDE8A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC2F-\uDC3F\uDC41-\uDC71\uDC90-\uDCFF\uDD07\uDD0A\uDD31-\uDD45\uDD47-\uDD5F\uDD66\uDD69\uDD8A-\uDD97\uDD99-\uDEDF\uDEF3-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC00-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD823-\uD82B\uD82D\uD82E\uD830-\uD834\uD836\uD837\uD839\uD83C-\uD83F\uD87B-\uD87D\uD87F-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F-\uDECF\uDEEE-\uDF3F\uDF44-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4F\uDF51-\uDF92\uDFA0-\uDFDF\uDFE2\uDFE4-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD822[\uDEF3-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC-\uDFFF]|\uD838[\uDC00-\uDCFF\uDD2D-\uDD36\uDD3E-\uDD4D\uDD4F-\uDEBF\uDEEC-\uDFFF]|\uD83A[\uDCC5-\uDCFF\uDD44-\uDD4A\uDD4C-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04-\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g

  return hebrewString
    .replace(hebrewCantillationRegex, '')
    .replace(hebrewVowelsRegex, '')
    .replace(wordPartDividerRegex, '')
    .replace(wordDividerRegex, ' ')
    .toLowerCase()
}

// See https://stackoverflow.com/questions/23346506/javascript-normalize-accented-greek-characters/45797754#45797754
export const normalizeGreek = (greekString="") => greekString.normalize('NFD').replace(/[\u0300-\u036f]/g, "")

export const replaceWithJSX = (text, regexStr, getReplacement) => {
  let idx = 0

  return (
    text
      .split(new RegExp(`(${regexStr.replace(/\(([^\?])/g, '(?:')})`, 'g'))
      .map(piece => {

        const matchInfo = piece.match(new RegExp(`^${regexStr}$`))

        if(matchInfo) {
          return (
            <React.Fragment key={idx}>
              {getReplacement(...matchInfo)}
            </React.Fragment>
          )
        }

        return piece
      })
  )

}

export const fixRTL = async locale => {
  const alreadyFixedRTLKey = `fixedRTL`
  const alreadyFixedRTL = Boolean(await AsyncStorage.getItem(alreadyFixedRTLKey))
  const i18nIsRTL = isRTL(locale)

  if(!!I18nManager.isRTL !== i18nIsRTL && !alreadyFixedRTL) {
    I18nManager.forceRTL(i18nIsRTL)
    I18nManager.allowRTL(i18nIsRTL)
    await AsyncStorage.setItem(alreadyFixedRTLKey, '1')
    return 'reload'
  }
}

const originalVersionInfoByTestament = {
  old: bibleVersions.filter(({ isOriginal, partialScope }) => (isOriginal && (!partialScope || partialScope === 'ot')))[0],
  new: bibleVersions.filter(({ isOriginal, partialScope }) => (isOriginal && (!partialScope || partialScope === 'nt')))[0],
}

export const getOriginalVersionInfo = bookId => originalVersionInfoByTestament[bookId <= 39 ? 'old' : 'new']

export const adjustFontSize = ({ fontSize, isOriginal, languageId, bookId }) => (
  isOriginal
    ? (
      (
        {
          grk: 1.2, // The Greek font renders small, thus make this adjustment
        }[getTextLanguageId({ languageId, bookId })]
        || 1
      ) * fontSize
    )
    : fontSize
)

export const adjustLineHeight = ({ lineHeight, isOriginal, languageId, bookId }) => (
  isOriginal
    ? (
      (
        {
          grk: .85, // Given our font size adjustment above
          heb: 1.25, // The Hebrew font renders tight, thus make this adjustment
        }[getTextLanguageId({ languageId, bookId })]
        || 1
      ) * lineHeight
    )
    : lineHeight
)

export const objectMap = (obj, fn) => (
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
  )
)

export const memo = (Component, options) => {
  const { name, jsonMemoProps=[], memoPropMap={} } = options

  if(name) {
    Component.styledComponentName = name
    Component = styled(Component)
  }

  Component = React.memo(Component)

  if(jsonMemoProps.length > 0 || Object.keys(memoPropMap).length > 0) {

    return ({ delayRenderMs, ignoreChildrenChanging, ...props }) => {

      const modifiedProps = { ...props }

      const [ setDelayRenderTimeout ] = useSetTimeout()
      const [ renderIdx, { inc }] = useCounter(0)

      jsonMemoProps.forEach(key => {
        modifiedProps[key] = useMemo(
          () => modifiedProps[key],
          [ JSON.stringify(modifiedProps[key]) ],
        )
      })

      Object.keys(memoPropMap).forEach(key => {
        modifiedProps[key] = useMemo(
          () => modifiedProps[key],
          [ modifiedProps[memoPropMap[key]] ],
        )
      })

      const ignoreChildrenFalseIndex = useChangeIndex(!!ignoreChildrenChanging, (prev, current) => !current)  // iterate every time it is false
      const memoChildren = useMemo(() => props.children, [ ignoreChildrenFalseIndex ])

      if(ignoreChildrenChanging) {
        modifiedProps.children = memoChildren
      }

      const propsToPass = useMemo(
        () => modifiedProps,
        [
          renderIdx,
          (!delayRenderMs ? Math.random() : null),
        ],
      )

      if(delayRenderMs) {
        setDelayRenderTimeout(inc, delayRenderMs)
      }

      return (
        <Component {...propsToPass} />
      )
    }

  }

  return Component
}

// const hexColorRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
// const rgbRegex = /^rgb\( *(\d{1,3}), *(\d{1,3}), *(\d{1,3}) *\)$/i

// const colorToObj = colorStr => {
//   const result = hexColorRegex.exec(colorStr) || rgbRegex.exec(colorStr) || [null, 0, 0, 0]
//   const base = hexColorRegex.test(colorStr) ? 16 : 10
//   return {
//     r: parseInt(result[1], base),
//     g: parseInt(result[2], base),
//     b: parseInt(result[3], base),
//   }
// }

// export const interpolateColors = (
//   animationValue,
//   inputRange,
//   colorStrs,
// ) => {
//   const colors = colorStrs.map(colorStr => colorToObj(colorStr))
//   const r = Animated.round(
//     Animated.interpolate(animationValue, {
//       inputRange,
//       outputRange: colors.map(c => c.r),
//       extrapolate: Extrapolate.CLAMP,
//     }),
//   )
//   const g = Animated.round(
//     Animated.interpolate(animationValue, {
//       inputRange,
//       outputRange: colors.map(c => c.g),
//       extrapolate: Extrapolate.CLAMP,
//     }),
//   )
//   const b = Animated.round(
//     Animated.interpolate(animationValue, {
//       inputRange,
//       outputRange: colors.map(c => c.b),
//       extrapolate: Extrapolate.CLAMP,
//     }),
//   )
//   return Animated.color(r, g, b)
// }