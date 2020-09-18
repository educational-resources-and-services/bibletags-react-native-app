import React, { useState, useRef, useEffect, useCallback } from "react"
import Constants from "expo-constants"
import { View, ScrollView, StyleSheet, Platform } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPiecesFromUSFM, blockUsfmMarkers, tagInList } from "bibletags-ui-helper/src/splitting"
import usePrevious from "react-use/lib/usePrevious"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { executeSql, isRTLText, getVersionInfo, getCopyVerseText, getTextFont,
         isForceUserFontTag, adjustFontSize, adjustLineHeight, isIPhoneX, equalObjs,
         iPhoneXInset, readHeaderHeight, readHeaderMarginTop, memo } from '../../utils/toolbox'
import { getValidFontName } from "../../utils/bibleFonts"
import bibleVersions from "../../../versions"
import useInstanceValue from "../../hooks/useInstanceValue"

import VerseText from "../basic/VerseText"
import CoverAndSpin from "../basic/CoverAndSpin"

const {
  DEFAULT_FONT_SIZE,
  HEBREW_CANTILLATION_MODE,
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
    paddingTop: (
      Platform.OS === 'android'
        ? 55
        : (76 + (
          isIPhoneX
            ? iPhoneXInset['portrait'].topInset
            : 0
        ))
    ),
  },
  parallelContent: {
    paddingTop: 20,
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
  q1: {
    // marginRight: 25,
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
  mt: { //major title
    textAlign: "center",
    // fontVariant: ["small-caps"],
  },
  ms: { // major section heading
    textAlign: "center",
  },
  s1: {},  //section heading 1
  s2: {},  //section heading 2
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

const ReadText = ({
  versionId,
  passageRef,
  selectedVerse,
  selectedInfo,
  focussedVerse,
  isVisible,
  isParallel,
  forwardRef,
  onContentSizeChange,
  onLoaded,
  onVerseTap,
  onScroll,
  onTouchStart,
  onTouchEnd,
  onLayout,
  height,
  reportNumberOfVerses,

  themedStyle,

  displaySettings,
}) => {

  const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    majorTitleThemedStyle={},
    majorSectionHeadingThemedStyle={},
    section1HeadingThemedStyle={},
    section2HeadingThemedStyle={},
    pehThemedStyle={},
    samechThemedStyle={},
    selahThemedStyle={},
    unfocussedBlockThemedStyle={},
    unfocussedThemedStyle={},
    unselectedBlockThemedStyle={},
    unselectedThemedStyle={},
    semiSelectedVsThemedStyle={},
    selectedWordThemedStyle={},
    selectedVsThemedStyle={},
  ] = altThemedStyleSets

  const [ state, setState ] = useState({})
  const { pieces, languageId, isOriginal } = state

  const { bookId, chapter } = passageRef

  const verses = useRef()
  const contentSizeParams = useRef()

  const previousSelectedVerse = usePrevious(selectedVerse)
  const previousFocussedVerse = usePrevious(focussedVerse)

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

        if(!bookId) return  // adjacent to beginning or end of Bible
        if(!bibleVersions.some(({ id }) => id === versionId)) return  // failsafe

        const { rows: { _array: vss } } = await executeSql({
          versionId,
          bookId,
          statement: () => `SELECT * FROM ${versionId}VersesBook${bookId} WHERE loc LIKE ? ORDER BY loc`,
          args: [
            `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}%`,
          ],
          removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
          removeWordPartDivisions: true,
        })

        verses.current = vss

        reportNumberOfVerses && reportNumberOfVerses(vss.length)

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
      const onVerseTap = getOnVerseTap()

      if(!onVerseTap) return

      if(selectedVerse == null) {
        onVerseTap()
        return
      }

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

      onVerseTap({ selectedVerse, ...otherParams, selectedTextContent })
    },
    [ versionId, passageRef ],
  )

  const getJSX = useCallback(
    () => {
      let vs = null
      let textAlreadyDisplayedInThisView = false

      const getJSXFromPieces = ({ pieces, sharesBlockWithSelectedVerse, sharesBlockWithFocussedVerse }) => {

        const { font, textSize, lineSpacing, theme } = displaySettings
        const baseFontSize = adjustFontSize({ fontSize: DEFAULT_FONT_SIZE * textSize, isOriginal, languageId, bookId })

        // For original Hebrew text, split off פ and ס chars that signal a break in flow.
        if(isOriginal && languageId.split('+').includes('heb')) {
          pieces = pieces
            .map(piece => {
              if(!piece.lemma && /^[ ׃]*פ$/.test(piece.text || "")) {
                return [
                  {
                    ...piece,
                    text: piece.text.slice(0, -1),
                  },
                  {
                    endTag: "peh*",
                    tag: "peh",
                    text: ' פ',
                  },
                ]
              } else if(!piece.lemma && /^[ ׃]*ס$/.test(piece.text || "")) {
                return [
                  {
                    ...piece,
                    text: piece.text.slice(0, -1),
                  },
                  {
                    endTag: "samech*",
                    tag: "samech",
                    text: ' ס   ',
                  },
                ]
              } else if(piece.lemma === 'סֶלָה' && !piece.parentTagIsSelah) {
                return [
                  {
                    endTag: "selah*",
                    tag: "selah",
                    children: [{
                      ...piece,
                      parentTagIsSelah: true,
                    }],
                  },
                ]
              } else {
                return [ piece ]
              }
            })
            .flat()
        }

        const simplifiedPieces = []
        pieces.forEach(piece => {
          const { tag, text } = piece
          const previousPiece = simplifiedPieces.slice(-1)[0]

          if(
            previousPiece
            && !tag
            && !previousPiece.tag
            && text
            && previousPiece.text
          ) {
            previousPiece.text += text
          } else {
            simplifiedPieces.push({ ...piece })
          }
        })

        return simplifiedPieces.map((piece, idx) => {
          let { type, tag, text, content, children, verse } = piece

          if(!children && !text && !content) return null
          if([ "c", "cp" ].includes(tag)) return null

          vs = verse || vs

          if([ "f", "fe" ].includes(tag)) {  // footnote
            text = ` ● `  // or ✱
          }

          const wrapInView = tagInList({ tag, list: blockUsfmMarkers })

          if(wrapInView) {
            textAlreadyDisplayedInThisView = false
          }

          if([ "v", "vp" ].includes(tag) && content) {
            const nextPiece = simplifiedPieces[idx+1] || {}
            if(tag === "v" && nextPiece.tag === "vp") return null
            content = `${textAlreadyDisplayedInThisView ? ` ` : ``}${content}\u00A0`
          }

          const bold = boldStyles.includes(tag)
          const italic = italicStyles.includes(tag)
          const light = lightStyles.includes(tag)
          const fontSize = (wrapInView || fontSizeStyleFactors[tag]) && baseFontSize * (fontSizeStyleFactors[tag] || 1)
          const lineHeight = fontSize && adjustLineHeight({ lineHeight: fontSize * lineSpacing, isOriginal, languageId, bookId })
          const fontFamily = (wrapInView || bold || italic || light || (isOriginal && isForceUserFontTag(tag))) && getValidFontName({
            font: getTextFont({ font, isOriginal, languageId, bookId, tag }),
            bold,
            italic,
            light,
          })

          let style = StyleSheet.flatten([
            wrapInView && isRTLText({ languageId, bookId }) && textStyles.rtl,
            getStyle({ tag, styles: textStyles }),
            {
              mt: majorTitleThemedStyle,
              ms: majorSectionHeadingThemedStyle,
              s1: section1HeadingThemedStyle,
              s2: section2HeadingThemedStyle,
              peh: pehThemedStyle,
              samech: samechThemedStyle,
              selah: selahThemedStyle,
            }[tag],
            fontSize && { fontSize },
            lineHeight && { lineHeight },
            fontFamily && { fontFamily },
          ])

          const hasSelectedVerseChild = selectedVerse && (children || []).some(child => child.verse === selectedVerse)
          const hadSelectedVerseChild = previousSelectedVerse && (children || []).some(child => child.verse === previousSelectedVerse)
          const hasFocussedVerseChild = focussedVerse && (children || []).some(child => child.verse === focussedVerse)
          const hadFocussedVerseChild = previousFocussedVerse && (children || []).some(child => child.verse === previousFocussedVerse)

          if(
            selectedVerse !== null
            && verse !== undefined
            && verse === selectedVerse
            && !!selectedInfo
          ) {
            style = {
              ...style,
              ...semiSelectedVsThemedStyle,
            }
          }

          if(
            selectedVerse !== null
            && [ 'w', 'f', 'fe' ].includes(tag)
            && vs === selectedVerse
            && equalObjs(selectedInfo, piece)
          ) {
            style = {
              ...style,
              ...selectedWordThemedStyle,
              textShadowRadius: Platform.OS === 'ios' ? 20 : 50,
            }
          }

          if(
            selectedVerse !== null
            && tag === 'v'
            && vs === selectedVerse
          ) {
            style = {
              ...style,
              ...selectedVsThemedStyle,
            }
          }

          if(
            selectedVerse !== null
            && verse !== undefined
            && verse !== selectedVerse
            && sharesBlockWithSelectedVerse
          ) {
            style = {
              ...style,
              ...unselectedThemedStyle,
            }
          }

          if(
            selectedVerse !== null
            && wrapInView
            && !hasSelectedVerseChild
          ) {
            style = {
              ...style,
              ...unselectedBlockThemedStyle,
            }
          }

          if(
            focussedVerse !== undefined
            && verse !== undefined
            && verse !== focussedVerse
            && sharesBlockWithFocussedVerse
          ) {
            style = {
              ...style,
              ...unfocussedThemedStyle,
            }
          }

          if(
            focussedVerse !== undefined
            && wrapInView
            && !hasFocussedVerseChild
          ) {
            style = {
              ...style,
              ...unfocussedBlockThemedStyle,
            }
          }

          const ignoreChildrenChanging = (
            vs !== selectedVerse
            && vs !== previousSelectedVerse
            && !hasSelectedVerseChild
            && !hadSelectedVerseChild
            && !hasFocussedVerseChild
            && !hadFocussedVerseChild
          )

          if(!children) {
            textAlreadyDisplayedInThisView = true
          }

          let component = (
            <VerseText
              key={idx}
              style={style}
              onPress={goVerseTap}
              verseNumber={vs}
              info={[ 'w', 'f', 'fe' ].includes(tag) ? piece : null}
              // delayRenderMs={vs > 1 ? 500 : 0}
              ignoreChildrenChanging={ignoreChildrenChanging}
            >
              {children
                ? getJSXFromPieces({
                  pieces: children,
                  sharesBlockWithSelectedVerse: hasSelectedVerseChild,
                  sharesBlockWithFocussedVerse: hasFocussedVerseChild,
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
    [ pieces, displaySettings, selectedVerse, selectedInfo, focussedVerse, bookId, languageId, isOriginal, isVisible ],
  )

  if(!pieces) {
    return (
      <View style={viewStyles.viewContainer}>
        <CoverAndSpin />
      </View>
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
      <View
        style={[
          viewStyles.content,
          isParallel ? viewStyles.parallelContent : null,
          {
            paddingBottom: (
              height - (
                (
                  isParallel
                    ? 0
                    : (readHeaderMarginTop + readHeaderHeight)
                )
                + 75
              )
            ),
          },
        ]}
      >
        {getJSX()}
      </View>
    </ScrollView>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

 export default memo(connect(mapStateToProps, matchDispatchToProps)(ReadText), { name: 'ReadText' })