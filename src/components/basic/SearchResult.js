import React from "react"
import { Constants } from "expo"
import { View, StyleSheet, Text, Dimensions, Clipboard } from "react-native"
import { Toast } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { isRTL, getCopyVerseText } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import i18n from "../../utils/i18n.js"
import { getRefFromLoc } from 'bibletags-versification/src/versification'
import { getPassageStr } from "bibletags-ui-helper"
import TapOptions from "./TapOptions"

import { setRef } from "../../redux/actions.js"

const {
  DEFAULT_FONT_SIZE,
  SEARCH_RESULT_REFERENCE_COLOR,
  SEARCH_RESULT_VERSE_COLOR,
  SEARCH_RESULT_SELECTED_COLOR,
  SEARCH_RESULT_MATCH_COLOR,
} = Constants.manifest.extra

const viewStyles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 0,
  },
  // sup: {
  //   position: "relative",
  //   top: "-0.3em",
  // },
})

const textStyles = StyleSheet.create({
  verse: {
    color: SEARCH_RESULT_VERSE_COLOR,
  },
  selected: {
    color: SEARCH_RESULT_SELECTED_COLOR,
  },
  reference: {
    color: SEARCH_RESULT_REFERENCE_COLOR,
    fontWeight: 'bold',
  },
  match: {
    color: SEARCH_RESULT_MATCH_COLOR,
  },
  rtl: {
    writingDirection: 'rtl',
  },
  rightAlign: {
    textAlign: 'right',
  },
  nd: {
    // fontVariant: ['small-caps'],
  },
  no: {
    fontVariant: [],
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
  sc: {
    // fontVariant: ['small-caps'],
  },
})

const fontSizeStyleFactors = {
  // sup: .83,
}

const boldStyles = [
  'bd',
  'bdit',
]

const italicStyles = [
  'em',
  'it',
  'bdit',
]

const lightStyles = [
]

const getStyle = ({ tag, styles }) => styles[(tag || "").replace(/^\+/, '')]

class SearchResult extends React.PureComponent {

  getFont = () => {
    const { displaySettings, languageId, isOriginal } = this.props
    const { font } = displaySettings

    return isOriginal ? `original-${languageId}` : font
  }

  getJSXFromPieces = ({ pieces }) => {
    const { searchString, displaySettings } = this.props

    const { textSize } = displaySettings
    const baseFontSize = DEFAULT_FONT_SIZE * textSize

    return pieces.map((piece, idx) => {
      let { type, tag, text, content, children } = piece

      if(!children && !text && !content) return null
      if([ "c", "cp", "v", "vp" ].includes(tag)) return null

      const bold = boldStyles.includes(tag)
      const italic = italicStyles.includes(tag)
      const light = lightStyles.includes(tag)
      const fontSize = fontSizeStyleFactors[tag] && baseFontSize * (fontSizeStyleFactors[tag] || 1)
      const fontFamily = (bold || italic || light) && getValidFontName({
        font: this.getFont(),
        bold,
        italic,
        light,
      })

      const styles = [
        getStyle({ tag, styles: textStyles }),
        fontSize && { fontSize },
        fontFamily && { fontFamily },
      ].filter(s => s)

      const getPartOfPiece = (text, idx2) => {

        const lowerCaseText = text.toLowerCase()
        const isMatch = searchString
          .split(i18n(" ", {}, "word separator"))
          .some(searchWord => lowerCaseText === searchWord)

        if(text && styles.length === 0 && !isMatch) return text

        return (
          <Text
            key={`${idx}-${idx2}`}
            style={[
              ...styles,
              (isMatch ? textStyles.match : null),
            ]}
          >
            {children
              ? this.getJSXFromPieces({
                pieces: children,
              })
              : (text || content)
            }
          </Text>
        )
      }

      const textPieces = (text || "")
        .split(
          new RegExp(
            `(\\b(?:${
              searchString
                .split(i18n(" ", {}, "word separator"))
                .map(word => (
                  word
                    // escape regex chars in the next two lines
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\\/g, '\\\\')
                ))
                .join('|')
            })\\b)`,
            'gi'
          )
        )
        .filter(s => s)

      if(textPieces.length > 0) {
        return textPieces.map((textPiece, idx2) => getPartOfPiece(textPiece, idx2))
      } else {
        getPartOfPiece(text)
      }

    })
  }

  tapOptions = [
    {
      label: i18n("Read"),
      action: () => {
        const { result, navigation, setRef } = this.props
        const { pieces, loc } = result

        const ref = getRefFromLoc(loc)

        navigation.goBack()
        setRef({ ref })
      }
    },
    {
      label: i18n("Copy"),
      action: () => {
        const { result, versionAbbr, unselect } = this.props
        const { pieces, loc } = result

        const ref = getRefFromLoc(loc)
        const passageStr = getPassageStr({ refs: [ ref ] })
    
        const copyTextContent = getCopyVerseText({ pieces, ref, versionAbbr })

        Clipboard.setString(copyTextContent)
        Toast.show({
          text: i18n("Verse copied"),
          duration: 1700,
        })

        unselect()
      }
    },
  ]

  onPress = ({ nativeEvent }) => {
    const { result, onSelect } = this.props
    const { pageY } = nativeEvent

    onSelect({ loc: result.loc, pageY })
  }

  render() {
    const { result, searchString, languageId, displaySettings,
            selected, selectTapY, onTouchStart, onTouchEnd } = this.props

    const { width, height } = Dimensions.get('window')
    const { textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize
    const fontFamily = getValidFontName({ font: this.getFont() })

    const { pieces, loc } = result

    const passageStr = getPassageStr({
      refs: [
        getRefFromLoc(loc),
      ],
    })

    const showBelow = selectTapY < height / 2

    return (
      <View style={viewStyles.container}>
        <Text
          style={[
            textStyles.reference,
            selected ? textStyles.selected : null,
            (isRTL(languageId) ? textStyles.rightAlign : null),
            {
              fontSize: Math.max(fontSize * .65, 12),
            },
          ]}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onPress={this.onPress}
        >
          {passageStr}
        </Text>
        <Text
          style={[
            textStyles.verse,
            selected ? textStyles.selected : null,
            (isRTL(languageId) ? textStyles.rtl : null),
            { fontSize },
            { fontFamily },
          ]}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onPress={this.onPress}
        >
          {this.getJSXFromPieces({ pieces })}
        </Text>
        {selected &&
          <TapOptions
            options={this.tapOptions}
            centerX={parseInt(width/2, 10)}
            bottomY={showBelow ? 0 : null}
            topY={!showBelow ? -20 : null}
          />
        }
      </View>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchResult)