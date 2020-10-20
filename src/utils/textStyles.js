import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { isRTLText, getTextFont, adjustLineHeight, adjustFontSize,
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
  fk: {  // footnote keyword (also used for footnote types)
    textTransform: "uppercase",
  },
  x: {  // crossref
    letterSpacing: 2,
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

})

const fontSizeStyleFactors = {
  mt: 1.6,
  ms: 1.2,
  // s1: 1.1,
  s2: .85,
  s3: .75,
  '[small-cap]': .75,
  fk: .65,
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
  text,
  content,
  children,
  wrapInView,
  font,
  textSize,
  lineSpacing,
  doSmallCaps,
  languageId,
  isOriginal,
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

  const tagThemedStyleKeys = [ 'mt', 'ms', 's1', 's2', 'peh', 'samech', 'selah', 'x', 'xt', 'f', 'fe', 'fk', 's3' ]

  const verseTextStyles = StyleSheet.flatten([
    wrapInView && isRTLText({ languageId, bookId }) && textStyles.rtl,
    getTagStyle({ tag, styles: textStyles }),
    tagThemedStyles[tagThemedStyleKeys.indexOf(tag)],
    fontSize && { fontSize },
    lineHeight && { lineHeight },
    fontFamily && { fontFamily },
  ])

  return {
    verseTextStyles,
    adjustedChildren: children,
  }
}