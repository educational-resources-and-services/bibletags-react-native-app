import React from "react"
import { Constants } from "expo"
import { View, Text, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { executeSql, isRTL } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'
import { getPiecesFromUSFM, blockUsfmMarkers, tagInList } from "bibletags-ui-helper/src/splitting.js"
import bibleVersions from '../../../versions.js'

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const viewStyles = StyleSheet.create({
  container: {
  },
  mt: {
    marginTop: 10,
    marginBottom: 10,
  },
  ms: {
    marginTop: 7,
    marginBottom: 5,
  },
  s1: {
    marginTop: 10,
    marginBottom: 10,
  },
  s2: {
    marginTop: 10,
    marginBottom: 5,
  },
  d: {
    marginTop: 5,
    marginBottom: 5,
  },
  p: {
    marginTop: 5,
    marginBottom: 5,
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
  mt: {
    color: "rgba(0,0,0,.5)",
    textAlign: "center",
    // fontVariant: ["small-caps"],
  },
  ms: {
    textAlign: "center",
    color: "rgba(0,0,0,.42)",
  },
  s1: {
    color: "rgba(0,0,0,.35)",
  },
  s2: {
    color: "rgba(0,0,0,.5)",
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
  mt: 1.6,
  ms: 1.2,
  // s1: 1.1,
  s2: .85,
  // sup: .83,
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

const getStyle = ({ tag, styles }) => styles[(tag || "").replace(/^\+/, '')]

class ReadText extends React.PureComponent {

  state = {
    pieces: null,
    languageId: 'eng',
  }

  componentDidMount() {
    this.getText()
  }

  getText = async () => {
    const { versionId, passageRef } = this.props

    const { bookId, chapter } = passageRef

    const { rows: { _array: verses } } = await executeSql({
      versionId,
      statement: `SELECT * FROM ${versionId}Verses WHERE loc LIKE ?`,
      args: [
        `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}%`,
      ],
    })

    let wordDividerRegex, languageId

    bibleVersions.some(version => {
      if(version.id === versionId) {
        wordDividerRegex = version.wordDividerRegex
        languageId = version.languageId
      }
    })

    const pieces = getPiecesFromUSFM({
      usfm: verses.map(({ usfm }) => usfm).join('\n'),
      // usfm: verses.slice(0,3).map(({ usfm }) => usfm).join('\n'),
      wordDividerRegex,
    })

    this.setState({
      pieces,
      languageId,
    })
    // TODO: handle scrollY
  }

  getJSXFromPieces = ({ pieces, verse }) => {
    const { displaySettings } = this.props
    const { languageId } = this.state

    const { font, textSize } = displaySettings
    const baseFontSize = DEFAULT_FONT_SIZE * textSize

// \d tag for psalms

// refine styles

// display chapter numbers when in a different chapter
// speed up (check options adjustments)
// fonts
// books image in drawer
// push out?

    verse = verse || 1

    let textAlreadyDisplayedInThisView = false

    return pieces.map((piece, idx) => {
      let { type, tag, text, content, children } = piece

      if(!children && !text && !content) return null
      if([ "c", "cp" ].includes(tag)) return null

      if([ "v", "vp" ].includes(tag) && content) {
        const nextPiece = pieces[idx+1] || {}
        if(tag === "v" && nextPiece.tag === "vp") return null
        content = `${textAlreadyDisplayedInThisView ? ` ` : ``}${content} `
      }

      const wrapInView = tagInList({ tag, list: blockUsfmMarkers })

      const bold = boldStyles.includes(tag)
      const italic = italicStyles.includes(tag)
      const light = lightStyles.includes(tag)
      const fontSize = (wrapInView || fontSizeStyleFactors[tag]) && baseFontSize * (fontSizeStyleFactors[tag] || 1)
      const fontFamily = (wrapInView || bold || italic || light) && getValidFontName({
        font,
        bold,
        italic,
        light,
      })

      const styles = [
        wrapInView && isRTL(languageId) && textStyles.rtl,
        getStyle({ tag, styles: textStyles }),
        fontSize && { fontSize },
        fontFamily && { fontFamily },
      ].filter(s => s)

      textAlreadyDisplayedInThisView = true

      if(text && styles.length === 0) return text

      let component = (
        <Text
          key={idx}
          style={styles}
        >
          {children
            ? this.getJSXFromPieces({
              pieces: children,
              verse,
            })
            : (text || content)
          }
        </Text>
      )

      if(wrapInView) {
        component = (
          <View
            key={idx}
            style={[
              getStyle({ tag, styles: viewStyles }),
            ]}
          >
            {component}
          </View>
        )
      }

      return component

    })
  }

  render() {
    const { displaySettings } = this.props
    const { pieces } = this.state

    const { font, textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize

    if(!pieces) return null


// console.log('pieces', JSON.stringify(pieces))
    return (
      <View
        style={[
          viewStyles.container,
        ]}
      >
        {this.getJSXFromPieces({ pieces })}
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

export default connect(mapStateToProps, matchDispatchToProps)(ReadText)