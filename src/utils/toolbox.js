import React, { useMemo } from "react"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Dimensions, I18nManager, Platform } from "react-native"
import * as Updates from 'expo-updates'
import NetInfo from "@react-native-community/netinfo"
import Constants from "expo-constants"
import * as SQLite from "expo-sqlite"
import { isIphoneX } from "react-native-iphone-x-helper"
import { getPassageStr, wordPartDividerRegex, getNormalizedPOSCode, getMainWordPartIndex,
         getTextLanguageId, removeCantillation } from "@bibletags/bibletags-ui-helper"
import { i18n, isRTL } from "inline-i18n"
import { getBookIdListWithCorrectOrdering } from "@bibletags/bibletags-versification"
import { styled } from "@ui-kitten/components"
import useCounter from "react-use/lib/useCounter"
// import Animated, { Extrapolate } from "react-native-reanimated"
import { request, gql } from 'graphql-request'
import 'react-native-get-random-values'  // this import required for the uuid import next
import { v4 as uuidv4 } from 'uuid'

import bibleVersions from "../../versions"
import useSetTimeout from "../hooks/useSetTimeout"
import useChangeIndex from "../hooks/useChangeIndex"
import useJsonMemo from "../hooks/useJsonMemo"
import * as Sentry from "./sentry"

const {
  MAXIMUM_NUMBER_OF_RECENT,
  SENTRY_DSN="[SENTRY_DSN]",
  BIBLETAGS_DATA_GRAPHQL_URI_DEV="http://localhost:8082/graphql",
  BIBLETAGS_DATA_GRAPHQL_URI="https://data.bibletags.org/graphql",
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

export const isBeta = () => Constants.manifest.releaseChannel === 'beta'

export const cloneObj = obj => JSON.parse(JSON.stringify(obj))
export const equalObjs = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2)

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
    ? 15
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
  database,
  bookId,
  statement,
  args,
  jsonKeys,
  limit,
  statements,
  forceRemoveCantillation,
  removeWordPartDivisions,
  doNotLogError=false,
}) => {
  const versionInfo = getVersionInfo(versionId) || {}
  database = database || (bookId ? `verses/${bookId}` : null)
  const queryingSingleDB = !!database

  if(versionId && !versionInfo.id) return null

  const logDBError = async error => {
    if(doNotLogError) {
      __DEV__ && console.log("Silenced error:", error)
      return
    }

    sentry({ error: new Error(`ERROR ${error.message ? `(${error.message}) ` : ``}when running executeSql: ${statements[0].statement({})}`) })

    if(versionId) {

      // For an unknown reason, a text sometimes will not load to sqlite immediately after being downloaded.
      // Try a single reload in such a case.

      const unableToOpenSqliteLastReloadTimeKey = `unableToOpenSqliteLastReloadTime-${versionId}-${database}`
      const unableToOpenSqliteLastReloadTime = await getAsyncStorage(unableToOpenSqliteLastReloadTimeKey, 0)
      const now = Date.now()

      if(now - unableToOpenSqliteLastReloadTime > 1000 * 60 * 5) {
        await setAsyncStorage(unableToOpenSqliteLastReloadTimeKey, now)
        await Updates.reloadAsync()
      }

    }
  }

  const getEmptyResultSet = () => ({
    rows: {
      _array: [],
    },
  })

  const resultSets = statement ? [ getEmptyResultSet() ] : statements.map(getEmptyResultSet)

  const executeSqlForBook = async database => {
    try {

      const db = SQLite.openDatabase(`${versionId ? `versions/${versionId}/ready/` : ``}${database}.db`)

      await new Promise(resolveAll => {
        db.transaction(
          tx => {

            if(statement) {
              statements = [{
                statement,
                args,
                jsonKeys,
                limit,
              }]
            }

            for(let idx in statements) {
              let { statement, args=[], jsonKeys } = statements[idx]
              const limit = statements[idx].limit - resultSets[idx].rows._array.length

              if(Number.isInteger(limit) && limit <= 0) continue

              let adjustedStatement = statement({
                database,
                bookId: (database.match(/^verses\/(.*)$/) || [])[1],
                limit,
              })

              args.forEach((arg, idx) => {
                if(arg instanceof Array) {
                  const statementPieces = adjustedStatement.split(/(\?)/g)
                  statementPieces[idx*2 + 1] = `(${Array(arg.length).fill('?').join(', ')})`
                  adjustedStatement = statementPieces.join('')
                }
              })
              args = args.flat()

              tx.executeSql(
                adjustedStatement,
                args,
                (x, resultSet) => {
                  if(jsonKeys) {
                    resultSet.rows._array.forEach(row => {
                      jsonKeys.forEach(key => {
                        if(row[key]) {
                          try {
                            row[key] = JSON.parse(row[key])
                          } catch(e) {}
                        }
                      })
                    })
                  }
                  if(queryingSingleDB) {
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

  if(queryingSingleDB) {
    await executeSqlForBook(database)
  } else {
    const orderedBookIds = (
      versionInfo.hebrewOrdering
        ? hebrewOrderingOfBookIds
        : Array(66).fill().map((x, idx) => idx+1)
    ).slice(
      ...(
        {
          ot: [0, 39],
          nt: [40],
        }[versionInfo.partialScope]
        || [0]
      )
    )
    for(let idx in orderedBookIds) {
      await executeSqlForBook(`verses/${orderedBookIds[idx]}`)
    }
  }

  if(versionInfo.isOriginal && ['heb', 'heb+grk'].includes(versionInfo.languageId)) {
    resultSets.forEach(resultSet => {
      try {
        const { rows: { _array: verses } } = resultSet

        verses.forEach(verse => {

          if(removeWordPartDivisions) {
            verse.usfm = verse.usfm.replace(wordPartDividerRegex, '')  // zero-width space (used to indicate word parts)
          }
          
          if(forceRemoveCantillation) {
            verse.usfm = removeCantillation(verse.usfm)
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

export const safelyExecuteSelects = async paramsArray => (
  await Promise.all(paramsArray.map(async params => {
    try {
      const { rows: { _array }} = await executeSql({ ...params, doNotLogError: true })
      return _array
    } catch(err) {
      __DEV__ && console.log("Silenced error:", err)
      return []
    }
  }))
)

export const normalizeVersionId = versionId => [ `uhb`, `ugnt` ].includes(versionId) ? `original` : versionId

export const getVersionInfo = versionId => {
  const normalizedVersionId = normalizeVersionId(versionId)
  let versionInfo = {}

  bibleVersions.some(version => {
    if(normalizedVersionId === version.id) {
      versionInfo = version
      return true
    }
  })

  return versionInfo
}

export const isForceUserFontTag = tag => [ 'mt', 'v', 'ms', 's1', 's2' ].includes(tag)

export const getTextFont = ({ font, isOriginal, languageId, bookId, tag }) => (
  (isOriginal && !isForceUserFontTag(tag))
    ? `original-${getTextLanguageId({ languageId, bookId })}`
    : font
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

export const replaceWithJSX = (text, regexStr, getReplacement) => {
  let idx = 0

  return (
    text
      .split(new RegExp(`(${regexStr.replace(/\(([^\?])/g, '(?:$1')})`, 'g'))
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

export const fixRTL = async ({ locale, forceReload }={}) => {
  const alreadyFixedRTLKey = `fixedRTL`
  const alreadyFixedRTL = await getAsyncStorage(alreadyFixedRTLKey, false)
  const i18nIsRTL = isRTL(locale)

  if(!!I18nManager.isRTL !== i18nIsRTL && !alreadyFixedRTL) {
    I18nManager.forceRTL(i18nIsRTL)
    I18nManager.allowRTL(i18nIsRTL)
    await setAsyncStorage(alreadyFixedRTLKey, true)
    Updates.reloadAsync()
  } else if(forceReload) {
    Updates.reloadAsync()
  }
}

const numUserOpensKey = `numUserOpens`

export const updateAndGetNumUserOpens = async () => {
  const numUserOpens = (await getAsyncStorage(numUserOpensKey, 0)) + 1
  await setAsyncStorage(numUserOpensKey, numUserOpens)
  return numUserOpens
}

let deviceId
export const initializeDeviceId = async () => {
  const deviceIdKey = `deviceId`
  deviceId = await getAsyncStorage(deviceIdKey)
  if(!deviceId) {
    deviceId = uuidv4()
    await setAsyncStorage(deviceIdKey, deviceId)
  }
}
export const getDeviceId = () => deviceId

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

export const memo = (Component, options) => {
  const { name, jsonMemoProps=[], memoPropMap={} } = options

  if(name) {
    // Component.styledComponentName = name
    Component = styled(name)(Component)
  }

  Component = React.memo(Component)

  if(jsonMemoProps.length > 0 || Object.keys(memoPropMap).length > 0) {

    return ({ delayRenderMs, ignoreChildrenChanging, ...props }) => {

      const modifiedProps = { ...props }

      const [ setDelayRenderTimeout ] = useSetTimeout()
      const [ renderIdx, { inc }] = useCounter(0)

      jsonMemoProps.forEach(key => {
        modifiedProps[key] = useJsonMemo(modifiedProps[key])
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

export const uppercaseChars = `ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸŹŻŽƁƂƄƆƇƉƊƋƎƏƐƑƓƔƖƗƘƜƝƟƠƢƤƦƧƩƬƮƯƱƲƳƵƷƸƼǄǇǊǍǏǑǓǕǗǙǛǞǠǢǤǦǨǪǬǮǱǴǶǷǸǺǼǾȀȂȄȆȈȊȌȎȐȒȔȖȘȚȜȞȠȢȤȦȨȪȬȮȰȲȺȻȽȾɁɃɄɅɆɈɊɌɎͰͲͶͿΆΈΉΊΌΎΏΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΪΫϏϒϓϔϘϚϜϞϠϢϤϦϨϪϬϮϴϷϹϺϽϾϿЀЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯѠѢѤѦѨѪѬѮѰѲѴѶѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾӀӁӃӅӇӉӋӍӐӒӔӖӘӚӜӞӠӢӤӦӨӪӬӮӰӲӴӶӸӺӼӾԀԂԄԆԈԊԌԎԐԒԔԖԘԚԜԞԠԢԤԦԨԪԬԮԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖႠႡႢႣႤႥႦႧႨႩႪႫႬႭႮႯႰႱႲႳႴႵႶႷႸႹႺႻႼႽႾႿჀჁჂჃჄჅჇჍᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹᎺᎻᎼᎽᎾᎿᏀᏁᏂᏃᏄᏅᏆᏇᏈᏉᏊᏋᏌᏍᏎᏏᏐᏑᏒᏓᏔᏕᏖᏗᏘᏙᏚᏛᏜᏝᏞᏟᏠᏡᏢᏣᏤᏥᏦᏧᏨᏩᏪᏫᏬᏭᏮᏯᏰᏱᏲᏳᏴᏵᲐᲑᲒᲓᲔᲕᲖᲗᲘᲙᲚᲛᲜᲝᲞᲟᲠᲡᲢᲣᲤᲥᲦᲧᲨᲩᲪᲫᲬᲭᲮᲯᲰᲱᲲᲳᲴᲵᲶᲷᲸᲹᲺᲽᲾᲿḀḂḄḆḈḊḌḎḐḒḔḖḘḚḜḞḠḢḤḦḨḪḬḮḰḲḴḶḸḺḼḾṀṂṄṆṈṊṌṎṐṒṔṖṘṚṜṞṠṢṤṦṨṪṬṮṰṲṴṶṸṺṼṾẀẂẄẆẈẊẌẎẐẒẔẞẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸỺỼỾἈἉἊἋἌἍἎἏἘἙἚἛἜἝἨἩἪἫἬἭἮἯἸἹἺἻἼἽἾἿὈὉὊὋὌὍὙὛὝὟὨὩὪὫὬὭὮὯᾸᾹᾺΆῈΈῊΉῘῙῚΊῨῩῪΎῬῸΌῺΏℂℇℋℌℍℐℑℒℕℙℚℛℜℝℤΩℨKÅℬℭℰℱℲℳℾℿⅅↃⰀⰁⰂⰃⰄⰅⰆⰇⰈⰉⰊⰋⰌⰍⰎⰏⰐⰑⰒⰓⰔⰕⰖⰗⰘⰙⰚⰛⰜⰝⰞⰟⰠⰡⰢⰣⰤⰥⰦⰧⰨⰩⰪⰫⰬⰭⰮⱠⱢⱣⱤⱧⱩⱫⱭⱮⱯⱰⱲⱵⱾⱿⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰⲲⲴⲶⲸⲺⲼⲾⳀⳂⳄⳆⳈⳊⳌⳎⳐⳒⳔⳖⳘⳚⳜⳞⳠⳢⳫⳭⳲꙀꙂꙄꙆꙈꙊꙌꙎꙐꙒꙔꙖꙘꙚꙜꙞꙠꙢꙤꙦꙨꙪꙬꚀꚂꚄꚆꚈꚊꚌꚎꚐꚒꚔꚖꚘꚚꜢꜤꜦꜨꜪꜬꜮꜲꜴꜶꜸꜺꜼꜾꝀꝂꝄꝆꝈꝊꝌꝎꝐꝒꝔꝖꝘꝚꝜꝞꝠꝢꝤꝦꝨꝪꝬꝮꝹꝻꝽꝾꞀꞂꞄꞆꞋꞍꞐꞒꞖꞘꞚꞜꞞꞠꞢꞤꞦꞨꞪꞫꞬꞭꞮꞰꞱꞲꞳꞴꞶꞸꞺꞼꞾꟂꟄꟅꟆꟇꟉꟵＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ`

export const getTagStyle = ({ tag, styles }) => styles[(tag || "").replace(/^\+/, '')]

export const sentry = (...params) => {
  if(SENTRY_DSN === "[SENTRY_DSN]" || __DEV__) {
    console.log(`sentry()`, params)
  } else {
    if(params.length === 1 && params[0].error) {
      Sentry.captureException(params[0].error)
    } else if(params.length === 1 && params[0].message) {
      Sentry.captureMessage(String(params[0].message))
    } else {
      Sentry.captureException(new Error(params.map(param => JSON.stringify(param)).join("\n")))
    }
  }
}

export const toggleArrayValue = (array, value) => {
  const index = array.indexOf(value)
  if(index === -1) {
    array.push(value)
  } else {
    array.splice(index, 1)
  }
  return array
}

export const getWordIdAndPartNumber = ({ id, wordPartNumber, bookId }) => `${id}${bookId <= 39 ? `|${wordPartNumber}` : ``}`

export const doGraphql = async ({ query, mutation, params={} }) => {

  const composedQuery = gql`
    ${mutation ? `mutation` : ``} {
      ${
        (mutation || query).replace(
          '()', 
          `(
            ${
              Object.keys(params)
                .map(key1 => (
                  key1 === 'input'
                    ? (
                      `${key1}: { ${
                        Object.keys(params[key1])
                          .map(key2 => (
                            `${key2}: ${JSON.stringify(params[key1][key2]).replace(/([{,])"([^"]+)"/g, '$1$2')}`
                          ))
                          .join(", ")
                      } }`
                    )
                    : `${key1}: ${JSON.stringify(params[key1])}`
                ))
                .join(`, `)
            }
          )`
        )
      }
    }
  `

  const uri = (
    __DEV__
      ? BIBLETAGS_DATA_GRAPHQL_URI_DEV
      : BIBLETAGS_DATA_GRAPHQL_URI
  )

  const data = await request(uri, composedQuery)

  return data

}

export const getNewPromiseWithExternalResolve = () => {
  let promiseResolve, promiseReject

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  promise.resolve = promiseResolve
  promise.reject = promiseReject

  return promise
}

export const setAsyncStorage = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value))
export const removeAsyncStorage = key => AsyncStorage.removeItem(key)
export const getAsyncStorage = async (key, defaultValue) => {
  let value = null
  try {
    value = JSON.parse(await AsyncStorage.getItem(key))
  } catch(err) {}

  return (
    value === null
      ? defaultValue
      : value
  )
}

export const removeIndentAndBlankStartEndLines = str => {
  const lines = str.replace(/(^\n|\n$)/g, '').split(`\n`)
  const numSpacesInIndent = (lines[0] || lines[1]).match(/^ */)[0].length
  return lines.map(line => line.replace(new RegExp(` {1,${numSpacesInIndent}}`), ``)).join(`\n`)
}

export const orderedStatusesArray = [
  `none`,
  `automatch`,
  `unconfirmed`,
  `confirmed`,
]

export const getStatusText = status => (
  ({
    none: i18n("Not yet tagged."),
    automatch: i18n("Unconfirmed, partial tagging."),
    unconfirmed: i18n("Contains unconfirmed tags."),
    confirmed: i18n("Confirmed."),
  })[status]
  || i18n("Not yet tagged.")
)

const cachedOriginalWordsForSearch = {}
export const addOriginalWordsForSearch = originalWords => {
  for(let strongs in originalWords) {
    cachedOriginalWordsForSearch[strongs] = cachedOriginalWordsForSearch[strongs] || originalWords[strongs]
  }
}
export const getOriginalWordsForSearch = () => cachedOriginalWordsForSearch
