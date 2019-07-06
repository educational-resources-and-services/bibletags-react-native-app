import React from "react"
import { Constants } from "expo"
import { View, ScrollView, Text, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { executeSql, isRTL, getVersionInfo } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'
import { getPiecesFromUSFM, blockUsfmMarkers, tagInList } from "bibletags-ui-helper/src/splitting.js"
import bibleVersions from '../../../versions.js'

const {
  DEFAULT_FONT_SIZE,
  HEBREW_CANTILLATION_MODE,
  TEXT_MAJOR_TITLE_COLOR,
  TEXT_MAJOR_SECTION_HEADING_COLOR,
  TEXT_SECTION_HEADING_1_COLOR,
  TEXT_SECTION_HEADING_2_COLOR,
} = Constants.manifest.extra

const viewStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
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
    color: TEXT_MAJOR_TITLE_COLOR,
    textAlign: "center",
    // fontVariant: ["small-caps"],
  },
  ms: {
    textAlign: "center",
    color: TEXT_MAJOR_SECTION_HEADING_COLOR,
  },
  s1: {
    color: TEXT_SECTION_HEADING_1_COLOR,
  },
  s2: {
    color: TEXT_SECTION_HEADING_2_COLOR,
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
    isOriginal: false,
  }

  componentDidMount() {
    this.getText()
  }

  getText = async () => {
    const { versionId, passageRef, onLoaded } = this.props
    const { bookId, chapter } = passageRef

    if(!bibleVersions.some(({ id }) => id === versionId)) return  // failsafe

    const { rows: { _array: verses } } = await executeSql({
      versionId,
      statement: `SELECT * FROM ${versionId}Verses WHERE loc LIKE ?`,
      args: [
        `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}%`,
      ],
      removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
      removeWordPartDivisions: true,
    })

    const { wordDividerRegex, languageId, isOriginal=false } = getVersionInfo(versionId)

    const pieces = getPiecesFromUSFM({
      usfm: verses.map(({ usfm }) => usfm).join('\n'),
      wordDividerRegex,
    })

    this.setState({
      pieces,
      languageId,
      isOriginal,
    }, onLoaded)
  }

  getJSXFromPieces = ({ pieces, verse }) => {
    const { displaySettings } = this.props
    const { languageId, isOriginal } = this.state

    const { font, textSize } = displaySettings
    const baseFontSize = DEFAULT_FONT_SIZE * textSize

    verse = verse || 1

    let textAlreadyDisplayedInThisView = false

    return pieces.map((piece, idx) => {
      let { type, tag, text, content, children } = piece

      if(!children && !text && !content) return null
      if([ "c", "cp" ].includes(tag)) return null

      if([ "v", "vp" ].includes(tag) && content) {
        const nextPiece = pieces[idx+1] || {}
        if(tag === "v" && nextPiece.tag === "vp") return null
        content = `${textAlreadyDisplayedInThisView ? ` ` : ``}${content}\u00A0`
      }

      const wrapInView = tagInList({ tag, list: blockUsfmMarkers })

      const bold = boldStyles.includes(tag)
      const italic = italicStyles.includes(tag)
      const light = lightStyles.includes(tag)
      const fontSize = (wrapInView || fontSizeStyleFactors[tag]) && baseFontSize * (fontSizeStyleFactors[tag] || 1)
      const fontFamily = (wrapInView || bold || italic || light) && getValidFontName({
        font: isOriginal ? `original-${languageId}` : font,
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
    const { setRef, onScroll, onTouchStart, onLayout, onContentSizeChange } = this.props
    const { pieces } = this.state

    if(!pieces) {
      return (
        <View style={viewStyles.viewContainer} />
      )
    }

    if(!onScroll) {
      return (
        <View style={viewStyles.viewContainer}>
          <View style={viewStyles.content}>
            {this.getJSXFromPieces({ pieces })}
          </View>
        </View>
      )
    }

    return (
      <ScrollView
        style={viewStyles.container}
        scrollEventThrottle={16}
        onTouchStart={onTouchStart}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        ref={setRef}
      >
        <View style={viewStyles.content}>
          {this.getJSXFromPieces({ pieces })}
        </View>
      </ScrollView>
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