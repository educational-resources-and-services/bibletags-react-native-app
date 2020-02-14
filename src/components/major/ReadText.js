import React, { useState, useRef, useEffect, useCallback } from "react"
import Constants from "expo-constants"
import { View, ScrollView, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { executeSql, isRTLText, getVersionInfo, getCopyVerseText, getTextFont,
         adjustFontSize, adjustLineHeight } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import VerseText from '../basic/VerseText'
import { getPiecesFromUSFM, blockUsfmMarkers, tagInList } from "bibletags-ui-helper/src/splitting.js"
import bibleVersions from '../../../versions.js'
import useInstanceValue from "../../hooks/useInstanceValue.js"

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

const ReadText = React.memo(({
  versionId,
  passageRef,
  selectedVerse,
  isVisible,
  forwardRef,
  onContentSizeChange,
  onLoaded,
  onVerseTap,
  onScroll,
  onTouchStart,
  onTouchEnd,
  onLayout,

  displaySettings,
}) => {

  const [ state, setState ] = useState({})
  const { pieces, languageId, isOriginal } = state

  const { bookId, chapter } = passageRef

  const verses = useRef()
  const contentSizeParams = useRef()

  useEffect(
    () => {
      if(pieces && onLoaded) {
        onLoaded()
      }
    },
    [ pieces ],
  )

  useEffect(
    () => {
      (async () => {

        if(!bibleVersions.some(({ id }) => id === versionId)) return  // failsafe

        const { rows: { _array: vss } } = await executeSql({
          versionId,
          statement: `SELECT * FROM ${versionId}Verses WHERE loc LIKE ?`,
          args: [
            `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}%`,
          ],
          removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
          removeWordPartDivisions: true,
        })

        verses.current = vss

        const { wordDividerRegex, languageId, isOriginal=false } = getVersionInfo(versionId)

        const pieces = getPiecesFromUSFM({
          usfm: vss.map(({ usfm }) => usfm).join('\n'),
          wordDividerRegex,
        })

        setState({
          pieces,
          languageId,
          isOriginal,
        })

      })()
    },
    [],
  )

  const fireOnContentSizeChange = useCallback(
    () => {
      if(onContentSizeChange && contentSizeParams.current) {
        onContentSizeChange(...contentSizeParams.current)
      }
    },
    [ onContentSizeChange ],
  )

  useEffect(
    () => {
      // The following line (and related methods) is needed for adjusting numbers
      // to keep the scroll in parallel, WHEN next/previous chapter has been
      // swiped.
      fireOnContentSizeChange()
  
      if(!isVisible && (forwardRef || {}).current) {
        forwardRef.current.scrollTo({ y: 0, animated: false })
      }
    },
    [ isVisible ],
  )

  const goContentSizeChange = useCallback(
    (...params) => {
      contentSizeParams.current = params
      fireOnContentSizeChange()
    },
    [ fireOnContentSizeChange ],
  )

  const getOnVerseTap = useInstanceValue(onVerseTap)

  const goVerseTap = useCallback(
    ({ selectedVerse, ...otherParams }) => {
      if(selectedVerse == null) return

      let verseUsfm
      verses.current.some(({ loc, usfm }) => {
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

      const onVerseTap = getOnVerseTap()
      onVerseTap && onVerseTap({ selectedVerse, ...otherParams, selectedTextContent })
    },
    [ versionId, passageRef ],
  )

  const getJSX = useCallback(
    () => {
      let vs = null

      const getJSXFromPieces = ({ pieces }) => {

        const { font, textSize, lineSpacing, theme } = displaySettings
        const baseFontSize = adjustFontSize({ fontSize: DEFAULT_FONT_SIZE * textSize, isOriginal, languageId, bookId })

        let textAlreadyDisplayedInThisView = false

        const simplifiedPieces = []
        pieces.forEach(piece => {
          const { tag, text } = piece
          const previousPiece = simplifiedPieces.slice(-1)[0]

          if(
            previousPiece
            && (!tag || tag === 'w')
            && (!previousPiece.tag || previousPiece.tag === 'w')
            && text
            && previousPiece.text
          ) {
            previousPiece.text += text
          } else {
            simplifiedPieces.push({ ...piece })
          }
        })

        return simplifiedPieces.map((piece, idx) => {
          let { type, tag, text, content, children } = piece

          if(!children && !text && !content) return null
          if([ "c", "cp" ].includes(tag)) return null

          if([ "v" ].includes(tag) && content) {
            vs = parseInt(content, 10)
          }
          
          const verse = /^(?:ms|mt|s[0-9])$/.test(tag) ? null : vs

          if([ "v", "vp" ].includes(tag) && content) {
            const nextPiece = simplifiedPieces[idx+1] || {}
            if(tag === "v" && nextPiece.tag === "vp") return null
            content = `${textAlreadyDisplayedInThisView ? ` ` : ``}${content}\u00A0`
          }

          const wrapInView = tagInList({ tag, list: blockUsfmMarkers })

          const bold = boldStyles.includes(tag)
          const italic = italicStyles.includes(tag)
          const light = lightStyles.includes(tag)
          const fontSize = (wrapInView || fontSizeStyleFactors[tag]) && baseFontSize * (fontSizeStyleFactors[tag] || 1)
          const lineHeight = fontSize && adjustLineHeight({ lineHeight: fontSize * lineSpacing, isOriginal, languageId, bookId })
          const fontFamily = (wrapInView || bold || italic || light || (isOriginal && tag === "v")) && getValidFontName({
            font: getTextFont({ font, isOriginal, languageId, bookId, tag }),
            bold,
            italic,
            light,
          })

          const styles = [
            wrapInView && isRTLText({ languageId, bookId }) && textStyles.rtl,
            getStyle({ tag, styles: textStyles }),
            theme === 'low-light' ? getStyle({ tag, styles: textStylesLowLight}) : null,
            theme === 'high-contrast' ? getStyle({ tag, styles: textStylesContrast}) : null,
            fontSize && { fontSize },
            lineHeight && { lineHeight },
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
              onPress={goVerseTap}
              verseNumber={verse}
            >
              {children
                ? getJSXFromPieces({
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

      return getJSXFromPieces({ pieces })
    },
    [ pieces, displaySettings, selectedVerse, bookId, languageId, isOriginal ],
  )

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
      onContentSizeChange={goContentSizeChange}
      ref={forwardRef}
    >
      <View style={viewStyles.content}>
        {getJSX()}
      </View>
    </ScrollView>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadText)