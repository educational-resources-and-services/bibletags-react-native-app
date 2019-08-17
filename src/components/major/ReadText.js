import React from "react"
import Constants from "expo-constants"
import { View, ScrollView, Text, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

// import i18n from "../../utils/i18n.js"
import { executeSql, isRTL, getVersionInfo, getCopyVerseText } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'
import VerseText from '../basic/VerseText'
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

const textStylesContrast = StyleSheet.create({
  contrast: {
    color: 'black',
  },
})

const textStylesLowLight = StyleSheet.create({
  mt: {
    color: 'rgba(250, 251, 252, .98)',
  },
  ms: {
    color: 'rgba(250, 251, 252, .98)',
  },
  s1: {
    color: 'rgba(250, 251, 252, .98)',
  },
  s2: {
    color: 'rgba(250, 251, 252, .98)',
  },
  d: {
    color: 'rgba(250, 251, 252, .98)',
  },
  p: {
    color: 'rgba(250, 251, 252, .98)',
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

    this.verses = verses

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

  onVerseTap = ({ selectedVerse, ...otherParams }) => {
    const { onVerseTap, versionId, passageRef } = this.props
    const { bookId, chapter } = passageRef

    if(selectedVerse == null) return

    let verseUsfm
    this.verses.some(({ loc, usfm }) => {
      if(loc === `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}${('00'+selectedVerse).substr(-3)}`) {
        verseUsfm = usfm
        return
      }
    })

    const { wordDividerRegex, abbr } = getVersionInfo(versionId)

    const pieces = getPiecesFromUSFM({
      usfm: `\\c 1\n${verseUsfm.replace(/\\c ([0-9]+)\n?/g, '')}`,
      inlineMarkersOnly: true,
      wordDividerRegex,
    })

    const selectedTextContent = getCopyVerseText({
      pieces,
      ref: {
        ...passageRef,
        verse: selectedVerse,
      },
      versionAbbr: abbr,
    })

    onVerseTap({ selectedVerse, ...otherParams, selectedTextContent })
  }

  getJSX = () => {
    const { pieces } = this.state

    delete this.verse
    return this.getJSXFromPieces({ pieces })
  }

  getJSXFromPieces = ({ pieces }) => {
    const { displaySettings, selectedVerse } = this.props
    const { languageId, isOriginal } = this.state

    const { font, textSize, theme } = displaySettings
    const baseFontSize = DEFAULT_FONT_SIZE * textSize

    let textAlreadyDisplayedInThisView = false

    return pieces.map((piece, idx) => {
      let { type, tag, text, content, children } = piece

      if(!children && !text && !content) return null
      if([ "c", "cp" ].includes(tag)) return null

      if([ "v" ].includes(tag) && content) {
        this.verse = parseInt(content, 10)
      }
      
      const verse = /^(?:ms|mt|s[0-9])$/.test(tag) ? null : this.verse

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
        theme === 'low-light' ? getStyle({ tag, styles: textStylesLowLight}) : null,
        theme === 'high-contrast' ? getStyle({ tag, styles: textStylesContrast}) : null,
        fontSize && { fontSize },
        fontFamily && { fontFamily },
        (selectedVerse !== null && (
          verse === selectedVerse
            ? { color: '#000000' }
            : { color: '#bbbbbb' }
        )),
      ].filter(s => s)

      textAlreadyDisplayedInThisView = true

      let component = (
        <VerseText
          key={idx}
          style={styles}
          onPress={this.onVerseTap}
          verseNumber={verse}
        >
          {children
            ? this.getJSXFromPieces({
              pieces: children,
            })
            : (text || content)
          }
        </VerseText>
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
    const { setRef, onScroll, onTouchStart, onTouchEnd, onLayout, onContentSizeChange } = this.props
    const { pieces } = this.state

    if(!pieces) {
      return (
        <View style={viewStyles.viewContainer} />
      )
    }

    return (
      <ScrollView
        style={viewStyles.container}
        scrollEventThrottle={16}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        ref={setRef}
      >
        <View style={viewStyles.content}>
          {this.getJSX()}
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