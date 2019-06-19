import React from "react"
import { Constants } from "expo"
import { View, StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { isRTL } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
// import i18n from "../../utils/i18n.js"

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const viewStyles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 0,
  },
  // sup: {
  //   position: "relative",
  //   top: "-0.3em",
  // },
})

const textStyles = StyleSheet.create({
  rtl: {
    writingDirection: "rtl",
  },
  nd: {
    // fontVariant: ["small-caps"],
  },
  no: {
    fontVariant: [],
    fontStyle: "normal",
    fontWeight: "normal",
  },
  sc: {
    // fontVariant: ["small-caps"],
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

  getJSXFromPieces = ({ pieces }) => {
    const { displaySettings } = this.props

    const { font, textSize } = displaySettings
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
        font,
        bold,
        italic,
        light,
      })

      const styles = [
        getStyle({ tag, styles: textStyles }),
        fontSize && { fontSize },
        fontFamily && { fontFamily },
      ].filter(s => s)

      if(text && styles.length === 0) return text

      return (
        <Text
          key={idx}
          style={styles}
        >
          {children
            ? this.getJSXFromPieces({
              pieces: children,
            })
            : (text || content)
          }
        </Text>
      )

    })
  }

  render() {
    const { pieces, searchString, languageId, displaySettings } = this.props

    const { font, textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize
    const fontFamily = getValidFontName({ font })

    return (
      <View style={viewStyles.content}>
        <Text
          style={[
            isRTL(languageId) ? textStyles.rtl : null,
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