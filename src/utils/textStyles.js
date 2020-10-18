import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { isRTLText, getTextFont, adjustLineHeight, adjustFontSize,
          isForceUserFontTag, uppercaseChars, getTagStyle } from "./toolbox"
import { getValidFontName } from "./bibleFonts"

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const textStyles = StyleSheet.create({

  rtl: {
    writingDirection: "rtl",
  },
  nd: {
    textTransform: "uppercase",
  },
  sc: {
    textTransform: "uppercase",
  },
  no: {
    fontVariant: [],
    fontStyle: "normal",
    fontWeight: "normal",
  },
  sc: {
  },
  peh: {
  },
  samech: {
  },
  selah: {
  },
  f: {
    letterSpacing: 2,
  },
  fe: {
    letterSpacing: 2,
  },
  x: {
    letterSpacing: 2,
  },

  mt: { //major title
    textAlign: "center",
  },
  ms: { // major section heading
    textAlign: "center",
  },
  s1: {},  //section heading 1
  s2: {},  //section heading 2

  reference: {
    textAlign: 'right',
    fontWeight: 'bold',
  },
  leftAlign: {
    textAlign: 'left',
  },

})

const fontSizeStyleFactors = {
  mt: 1.6,
  ms: 1.2,
  // s1: 1.1,
  s2: .85,
  '[small-cap]': .75,
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

  const tagThemedStyleKeys = [ 'mt', 'ms', 's1', 's2', 'peh', 'samech', 'fq', 'xt' ]

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