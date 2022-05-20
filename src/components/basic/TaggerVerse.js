import React, { useMemo } from "react"
import Constants from "expo-constants"
import { View, StyleSheet, Text, TouchableOpacity } from "react-native"
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

const phraseBackgroundColors = [
  "#9414b21c",
  "#de940026",
  "#b4d10021",
  "#00bf1e1f",
  "#cd10001f",
]

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 7,
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  word: {
    flexDirection: "row",
  },
  wordPiece: {
  },
  rtlText: {
    writingDirection: "rtl",
  },
  translationWords: {
    height: 15,
    fontSize: 10,
    marginTop: -2,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  rtlTranslationWords: {
    textAlign: "right",
  },
  slash: {
    paddingTop: 4,
    marginHorizontal: -10,
    width: 20,
    textAlign: 'center',
    zIndex: -1,
  },
  wordText: {
    paddingHorizontal: 8,
    minWidth: 30,
    marginBottom: -15,
    paddingTop: 4,
    paddingBottom: 14,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'transparent',
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
    unusedWordThemedStyle={},
    selectedWordThemedStyle={},
    slashThemedStyle={},
    translationWordsThemedStyle={},
    selectedTranslationWordThemedStyle={},
  ] = altThemedStyleSets

  const { font, textSize } = { ...displaySettings, ...displaySettingsOverride }

  const usedWordPhraseStyleByWordIdAndPartNumbers = useMemo(
    () => {
      const usedWordPhraseStyleByWordIdAndPartNumbers = {}
      let phraseIdx = 0
      Object.keys(translationWordInfoByWordIdAndPartNumbers)
        .map(wordIdAndPartNumbersJSON => JSON.parse(wordIdAndPartNumbersJSON))
        .forEach(phraseOfWordIdAndPartNumbers => {
          const phraseStyle = phraseOfWordIdAndPartNumbers.length > 1 ? { backgroundColor: phraseBackgroundColors[phraseIdx++ % phraseBackgroundColors.length] } : null
          phraseOfWordIdAndPartNumbers.forEach(wordIdAndPartNumber => {
            usedWordPhraseStyleByWordIdAndPartNumbers[wordIdAndPartNumber] = phraseStyle
          })
        })
      return usedWordPhraseStyleByWordIdAndPartNumbers
    },
    [ translationWordInfoByWordIdAndPartNumbers ],
  )

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
        const isUsed = usedWordPhraseStyleByWordIdAndPartNumbers[wordIdAndPartNumber] !== undefined

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
            <VerseText
              onPress={onPress}
              onLongPress={onLongPress}
              info={{
                id,
                wordPartNumber,
              }}
              Component={TouchableOpacity}
            >
              <View style={styles.wordPiece}>
                <Text
                  style={StyleSheet.flatten([
                    { fontSize },
                    { fontFamily },
                    (isRTL ? styles.rtlText : null),
                    styles.wordText,
                    wordThemedStyle,
                    (isSelected ? selectedWordThemedStyle : null),
                    (!isUsed ? unusedWordThemedStyle : null),
                    (usedWordPhraseStyleByWordIdAndPartNumbers[wordIdAndPartNumber] || null),
                  ])}
                >
                  {text}
                </Text>
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
            </VerseText>
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