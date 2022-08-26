import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { isRTLText } from "@bibletags/bibletags-ui-helper"

import { getTextFont, adjustLineHeight, adjustFontSize, getNormalizedTag,
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
  mte: { //major title at ending
    textAlign: "center",
  },
  ms: { // major section heading
    textAlign: "center",
  },
  mr: { // major section reference range
    textAlign: "center",
  },
  qc: { // centered poetic line
    textAlign: "center",
  },
  qa: { // hebrew letters for acrostics
    textTransform: "uppercase",
  },
  zFootnoteType: {  // similar to footnote keyword
    textTransform: "uppercase",
  },

})

const fontSizeStyleFactors = {
  mt: 1.6,
  mte: 1.3,
  ms: 1.2,
  mr: .85,
  // s: 1.1,
  s2: .85,
  s3: .75,
  sr: .75,
  r: .75,
  rq: .75,
  sp: .75,
  '[small-cap]': .75,
  qa: .75,
  zFootnoteType: .65,
}

const boldStyles = [
  'mt',
  'mte',
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

  tag = getNormalizedTag(tag)

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

  const tagThemedStyleKeys = [ 'mt', 'mte', 'ms', 'mr', 's', 's2', 's3', 'sr', 'r', 'rq', 'sp', 'peh', 'samech', 'selah', 'x', 'xt', 'xt:selected', 'f', 'fe', 'fk', 's3', 'qa', 'zApparatusJson', 'zFootnoteType' ]

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