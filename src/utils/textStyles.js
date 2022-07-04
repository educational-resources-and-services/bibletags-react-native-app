import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { isRTLText } from "@bibletags/bibletags-ui-helper"

import { getTextFont, adjustLineHeight, adjustFontSize,
          isForceUserFontTag, uppercaseChars, getTagStyle } from "./toolbox"
import { getValidFontName } from "./bibleFonts"

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const textStyles = StyleSheet.create({

  // see custom-mapping.js for colors
  // see fontSizeStyleFactors (below) for font sizes

  rtl: {
    writingDirection: "rtl",
  },
  nd: {  // name of diety
    textTransform: "uppercase",
  },
  sc: {  // small caps
    textTransform: "uppercase",
  },
  no: {  // normal text
    fontVariant: [],
    fontStyle: "normal",
    fontWeight: "normal",
  },
  f: {  // footnote
    letterSpacing: 2,
  },
  fe: {  // endnote (treated the same as footnote)
    letterSpacing: 2,
  },
  zApparatusJson: {  // apparatus
    letterSpacing: 2,
  },
  fk: {  // footnote keyword (also used for footnote types)
    textTransform: "uppercase",
  },
  x: {  // crossref
    letterSpacing: 2,
  },
  'xt:selected': {  // crossref
    // textShadowOffset: {
    //   height: 1,
    // },
    // textShadowRadius: 3,
  },

  mt: { //major title
    textAlign: "center",
  },
  ms: { // major section heading
    textAlign: "center",
  },
  qc: { // centered poetic line
    textAlign: "center",
  },
  qa: { // hebrew letters for acrostics
    textAlign: "center",
    textTransform: "uppercase",
  },

})

const fontSizeStyleFactors = {
  mt: 1.6,
  ms: 1.2,
  // s1: 1.1,
  s2: .85,
  s3: .75,
  '[small-cap]': .75,
  fk: .65,
  qa: .75,
}

const boldStyles = [
  'mt',
  'bd',
  'bdit',
  'v',
  'vp',
]

const italicStyles = [
  'd',
  'em',
  'it',
  'bdit',
  'fq',
  'qd',
]

const lightStyles = [
]


export const adjustChildrenAndGetStyles = ({
  bookId,
  tag,
  type,
  text,
  content,
  children,
  isSelectedRef,
  wrapInView,
  font,
  textSize,
  lineSpacing,
  doSmallCaps,
  languageId,
  isOriginal,
  wrapWordsInNbsp,
  tagThemedStyles,
}) => {

  const bold = boldStyles.includes(tag)
  const italic = italicStyles.includes(tag)
  const light = lightStyles.includes(tag)

  const baseFontSize = adjustFontSize({ fontSize: DEFAULT_FONT_SIZE * textSize, isOriginal, languageId, bookId })
  const fontSize = (wrapInView || fontSizeStyleFactors[tag]) && baseFontSize * (fontSizeStyleFactors[tag] || 1)
  const lineHeight = fontSize && wrapInView && adjustLineHeight({ lineHeight: fontSize * lineSpacing, isOriginal, languageId, bookId })
  const fontFamily = (wrapInView || bold || italic || light || (isOriginal && isForceUserFontTag(tag))) && getValidFontName({
    font: getTextFont({ font, isOriginal, languageId, bookId, tag }),
    bold,
    italic,
    light,
  })

  if(doSmallCaps && (text || content)) {
    const uppercaseRegex = new RegExp(`([${uppercaseChars}])`, `g`)
    children = (text || content)
      .split(uppercaseRegex)
      .map(text => (
        uppercaseRegex.test(text)
          ? {
            text,
          }
          : {
            text,
            tag: '[small-cap]',
          }
      ))
  }

  if(wrapWordsInNbsp && type === 'word') {
    // \u00A0 is an &nbsp;
    if(children) {
      children = [
        {
          text: `\u00A0`,
        },
        ...children,
        {
          text: `\u00A0`,
        },
      ]
    } else if(text) {
      text = `\u00A0${text}\u00A0`
    }
  }

  const tagThemedStyleKeys = [ 'mt', 'ms', 's1', 's2', 'peh', 'samech', 'selah', 'x', 'xt', 'xt:selected', 'f', 'fe', 'fk', 's3', 'qa', 'zApparatusJson' ]

  const verseTextStyles = StyleSheet.flatten([
    wrapInView && isRTLText({ languageId, bookId }) && textStyles.rtl,
    getTagStyle({ tag, styles: textStyles }),
    tagThemedStyles[tagThemedStyleKeys.indexOf(tag)],
    isSelectedRef && getTagStyle({ tag: `${tag}:selected`, styles: textStyles }),
    isSelectedRef && tagThemedStyles[tagThemedStyleKeys.indexOf(`${tag}:selected`)],
    fontSize && { fontSize },
    lineHeight && { lineHeight },
    fontFamily && { fontFamily },
  ])

  return {
    verseTextStyles,
    adjustedChildren: children,
    adjustedText: text,
  }
}