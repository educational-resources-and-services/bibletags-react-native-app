import React from "react"
import { Constants } from "expo"
import { View, StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { isRTL } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
// import i18n from "../../utils/i18n.js"
import { getRefFromLoc } from 'bibletags-versification/src/versification'
import { getPassageStr } from "bibletags-ui-helper"

const {
  DEFAULT_FONT_SIZE,
  SEARCH_RESULT_REFERENCE_COLOR,
  SEARCH_RESULT_VERSE_COLOR,
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
        const isMatch = text === searchString

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
            `(${
              searchString
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\\/g, '\\\\')
            })`,
            'g'
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

  render() {
    const { result, searchString, languageId, displaySettings } = this.props

    const { textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize
    const fontFamily = getValidFontName({ font: this.getFont() })

    const { pieces, loc } = result

    const passageStr = getPassageStr({
      refs: [
        getRefFromLoc(loc),
      ],
    })

    return (
      <View style={viewStyles.container}>
        <Text
          style={[
            textStyles.reference,
            (isRTL(languageId) ? textStyles.rightAlign : null),
            {
              fontSize: Math.max(fontSize * .65, 12),
            },
          ]}
        >
          {passageStr}
        </Text>
        <Text
          style={[
            textStyles.verse,
            (isRTL(languageId) ? textStyles.rtl : null),
            { fontSize },
            { fontFamily },
          ]}
        >
          {this.getJSXFromPieces({ pieces })}
        </Text>
      </View>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchResult)