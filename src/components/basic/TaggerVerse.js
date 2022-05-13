import React from "react"
import Constants from "expo-constants"
import { View, StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { isRTLText, getTextFont, adjustFontSize, memo, adjustPiecesForSpecialHebrew, getWordIdAndPartNumber } from "../../utils/toolbox"
import { getValidFontName } from "../../utils/bibleFonts"
import { languageOptions } from "../../../language"

import VerseText from "./VerseText"

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const wordMargin = 7

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -wordMargin,
    marginBottom: 7,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  word: {
    marginHorizontal: wordMargin * .8,
    flexDirection: "row",
  },
  wordPiece: {
    marginHorizontal: wordMargin * .2,
  },
  rtlText: {
    writingDirection: "rtl",
  },
  translationWords: {
    height: 15,
    fontSize: 10,
    marginTop: -2,
    marginBottom: 4,
  },
  rtlTranslationWords: {
    textAlign: "right",
  },
  slash: {
  },
  wordText: {
    marginHorizontal: -7,
    paddingHorizontal: 7,
    marginBottom: -15,
    paddingBottom: 15,
  },
})

const TaggerVerse = ({
  bookId,
  pieces,
  translationWordInfoByWordIdAndPartNumbers,
  selectedWordIdAndPartNumbers,
  displaySettingsOverride,
  onPress,
  onLongPress,
  translationLanguageId,

  eva: { style: themedStyle={} },

  displaySettings,
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    wordThemedStyle={},
    selectedWordThemedStyle={},
    slashThemedStyle={},
    translationWordsThemedStyle={},
    selectedTranslationWordThemedStyle={},
  ] = altThemedStyleSets

  const { font, textSize } = { ...displaySettings, ...displaySettingsOverride }

  const isOriginal = true
  const languageId = 'heb+grk'
  const isRTL = isRTLText({ languageId, bookId })
  const fontSize = adjustFontSize({ fontSize: DEFAULT_FONT_SIZE * textSize, isOriginal, languageId, bookId })
  const fontFamily = getValidFontName({ font: getTextFont({ font, isOriginal, languageId, bookId }) })
  const { standardWordDivider=' ' } = languageOptions.find(({ id }) => id === translationLanguageId) || {}

  const getJSXFromPieces = () => {

    const usedWordIdAndPartNumbersJSONs = []
    pieces = adjustPiecesForSpecialHebrew({ isOriginal, languageId, pieces })

    return pieces.map((piece, idx) => {
      let { tag, text, children } = piece
      const id = piece[`x-id`]
      tag = tag && tag.replace(/^\+/, '')

      if(!children && !text) return null
      if(tag !== 'w') return null

      const getPartOfPiece = (text, wordPartNumber, includeSlash) => {
        const wordIdAndPartNumber =  getWordIdAndPartNumber({ id, wordPartNumber, bookId })
        const isSelected = selectedWordIdAndPartNumbers.includes(wordIdAndPartNumber)

        const key = Object.keys(translationWordInfoByWordIdAndPartNumbers).find(wordIdAndPartNumbersJSON => {
          if(
            !usedWordIdAndPartNumbersJSONs.includes(wordIdAndPartNumbersJSON)
            && JSON.parse(wordIdAndPartNumbersJSON).includes(wordIdAndPartNumber)
          ) {
            usedWordIdAndPartNumbersJSONs.push(wordIdAndPartNumbersJSON)
            return true
          }
        })

        return (
          <React.Fragment key={`${id}-${wordPartNumber}`}>
            <View style={styles.wordPiece}>
              <VerseText
                key={wordIdAndPartNumber}
                style={StyleSheet.flatten([
                  { fontSize },
                  { fontFamily },
                  (isRTL ? styles.rtlText : null),
                  styles.wordText,
                  wordThemedStyle,
                  (isSelected ? selectedWordThemedStyle : null),
                ])}
                onPress={onPress}
                onLongPress={onLongPress}
                info={{
                  id,
                  wordPartNumber,
                }}
              >
                {text}
              </VerseText>
              <Text
                style={[
                  styles.translationWords,
                  (isRTL ? styles.rtlTranslationWords : null),
                  translationWordsThemedStyle,
                  (isSelected ? selectedTranslationWordThemedStyle : null),
                ]}
              >
                {key && translationWordInfoByWordIdAndPartNumbers[key].map(({ word }) => word).join(standardWordDivider)}
              </Text>
            </View>
            {includeSlash &&
              <Text
                style={StyleSheet.flatten([
                  { fontSize },
                  { fontFamily },
                  styles.slash,
                  slashThemedStyle,
                ])}
              >
                /
              </Text>
            }
          </React.Fragment>
        )
      }

      return (
        <View
          key={id}
          style={[
            styles.word,
            (isRTL ? styles.rtl : null),
          ]}
        >
          {(children || [{ text }]).map(({ text, color }, idx2) => getPartOfPiece(text, idx2+1, (children && idx2 < children.length-1)))}
        </View>
      )
    })
  }

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
        (isRTL ? styles.rtl : null),
      ]}
    >
      {getJSXFromPieces()}
    </View>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(TaggerVerse), { name: 'TaggerVerse' })