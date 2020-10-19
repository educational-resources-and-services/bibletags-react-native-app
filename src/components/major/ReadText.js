import React, { useState, useRef, useEffect, useCallback } from "react"
import Constants from "expo-constants"
import { View, ScrollView, StyleSheet, Platform } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPiecesFromUSFM, blockUsfmMarkers, tagInList } from "bibletags-ui-helper/src/splitting"
import usePrevious from "react-use/lib/usePrevious"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { executeSql, getVersionInfo, getCopyVerseText, isIPhoneX, equalObjs,
         iPhoneXInset, readHeaderHeight, readHeaderMarginTop, memo,
         adjustTextForSups, getTagStyle, adjustPiecesForSpecialHebrew } from '../../utils/toolbox'
import { adjustChildrenAndGetStyles } from '../../utils/textStyles'
import bibleVersions from "../../../versions"
import useInstanceValue from "../../hooks/useInstanceValue"

import VerseText from "../basic/VerseText"
import CoverAndSpin from "../basic/CoverAndSpin"

const {
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
        ? 65
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
  q: {
    marginLeft: 20,
  },
  q1: {
    marginLeft: 20,
  },
  q2: {
    marginLeft: 40,
  },
  q3: {
    marginLeft: 60,
  },
  q4: {
    marginLeft: 80,
  },
  q5: {
    marginLeft: 100,
  },
  q6: {
    marginLeft: 120,
  },
  q7: {
    marginLeft: 140,
  },
  // sup: {
  //   position: "relative",
  //   top: "-0.3em",
  // },
})

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

    unfocussedBlockThemedStyle={},
    unfocussedThemedStyle={},
    unselectedBlockThemedStyle={},
    unselectedThemedStyle={},
    semiSelectedVsThemedStyle={},
    selectedWordThemedStyle={},
    selectedVsThemedStyle={},
    matchThemedStyle={},  // used in Verse

    ...tagThemedStyles

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

      let selectedTextContent

      if(verseUsfm) {

        const { wordDividerRegex, abbr } = getVersionInfo(versionId)

        const pieces = getPiecesFromUSFM({
          usfm: `\\c 1\n${verseUsfm.replace(/\\c ([0-9]+)\n?/g, '')}`,
          inlineMarkersOnly: true,
          wordDividerRegex,
        })

        if(pieces) {

          selectedTextContent = getCopyVerseText({
            pieces,
            ref: {
              ...passageRef,
              verse: selectedVerse,
            },
            versionAbbr: abbr,
          })

        }

      }

      onVerseTap({ selectedVerse, ...otherParams, selectedTextContent })
    },
    [ versionId, passageRef ],
  )

  const getJSX = useCallback(
    () => {
      let vs = null
      let textAlreadyDisplayedInThisView = false

      const getJSXFromPieces = ({ pieces, sharesBlockWithSelectedVerse, sharesBlockWithFocussedVerse, doSmallCaps }) => {

        const { font, textSize, lineSpacing, theme } = displaySettings

        pieces = adjustPiecesForSpecialHebrew({ isOriginal, languageId, pieces })

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
          tag = tag && tag.replace(/^\+/, '')
          const doSmallCaps = [ 'nd', 'sc' ].includes(tag) || doSmallCaps

          if([ "b" ].includes(tag)) {
            text = ' '
          }

          if([ "mt" ].includes(tag) && /\\x /.test(content)) {
            const footnoteRegex = /^\\x (.*?)\\x\*$/
            children = content
              .split(/(\\x .*?\\x\*)/g)
              .map(text => (
                footnoteRegex.test(text)
                  ? {
                    content: text.replace(footnoteRegex, '$1'),
                    tag: "x",
                    endTag: "x*",
                  }
                  : {
                    text,
                  }
              ))
          }

          if([ "mt" ].includes(tag) && selectedInfo) {
            verse = -1
          }

          if(!children && !text && !content) return null
          if([ "c", "cp" ].includes(tag)) return null

          vs = verse || vs

          text = adjustTextForSups({ tag, text, pieces: simplifiedPieces, idx })

          const wrapInView = tagInList({ tag, list: blockUsfmMarkers })

          if(wrapInView) {
            textAlreadyDisplayedInThisView = false
          }

          if([ "v", "vp" ].includes(tag) && content) {
            const nextPiece = simplifiedPieces[idx+1] || {}
            if(tag === "v" && nextPiece.tag === "vp") return null
            content = `${textAlreadyDisplayedInThisView ? ` ` : ``}${content}\u00A0`
          }

          let { verseTextStyles, adjustedChildren } = adjustChildrenAndGetStyles({
            bookId,
            tag,
            text,
            content,
            children,
            wrapInView,
            font,
            textSize,
            lineSpacing,
            doSmallCaps,
            languageId,
            isOriginal,
            tagThemedStyles,
          })
    
          const hasSelectedVerseChild = selectedVerse && (adjustedChildren || []).some(child => child.verse === selectedVerse)
          const hadSelectedVerseChild = previousSelectedVerse && (adjustedChildren || []).some(child => child.verse === previousSelectedVerse)
          const hasFocussedVerseChild = focussedVerse && (adjustedChildren || []).some(child => child.verse === focussedVerse)
          const hadFocussedVerseChild = previousFocussedVerse && (adjustedChildren || []).some(child => child.verse === previousFocussedVerse)

          const hasSmallCapsChild = kids => (kids || []).some(kid => [ 'nd', 'sc' ].includes(kid.tag) || hasSmallCapsChild(kid.children))

// TODO: adjust margin sizes based on stuff
          if(
            selectedVerse !== null
            && verse !== undefined
            && verse === selectedVerse
            && !!selectedInfo
          ) {
            verseTextStyles = {
              ...verseTextStyles,
              ...semiSelectedVsThemedStyle,
            }
          }

          if(
            selectedVerse !== null
            && [ 'w', 'f', 'fe', 'x' ].includes(tag)
            && vs === selectedVerse
            && equalObjs(selectedInfo, piece)
          ) {
            verseTextStyles = {
              ...verseTextStyles,
              ...selectedWordThemedStyle,
              textShadowRadius: Platform.OS === 'ios' ? 20 : 50,
            }
          }

          if(
            selectedVerse !== null
            && tag === 'v'
            && vs === selectedVerse
          ) {
            verseTextStyles = {
              ...verseTextStyles,
              ...selectedVsThemedStyle,
            }
          }

          if(
            selectedVerse !== null
            && verse !== undefined
            && verse !== selectedVerse
            && sharesBlockWithSelectedVerse
          ) {
            verseTextStyles = {
              ...verseTextStyles,
              ...unselectedThemedStyle,
            }
          }

          if(
            selectedVerse !== null
            && verse !== selectedVerse
            && wrapInView
            && !hasSelectedVerseChild
          ) {
            verseTextStyles = {
              ...verseTextStyles,
              ...unselectedBlockThemedStyle,
            }
          }

          if(
            focussedVerse !== undefined
            && verse !== undefined
            && verse !== focussedVerse
            && sharesBlockWithFocussedVerse
          ) {
            verseTextStyles = {
              ...verseTextStyles,
              ...unfocussedThemedStyle,
            }
          }

          if(
            focussedVerse !== undefined
            && wrapInView
            && !hasFocussedVerseChild
          ) {
            verseTextStyles = {
              ...verseTextStyles,
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
            && !doSmallCaps
            && !hasSmallCapsChild(adjustedChildren)
          )

          if(!adjustedChildren) {
            textAlreadyDisplayedInThisView = true
          }

          let component = (
            <VerseText
              key={idx}
              style={verseTextStyles}
              onPress={goVerseTap}
              verseNumber={vs}
              info={[ 'w', 'f', 'fe', 'x' ].includes(tag) ? piece : null}
              // delayRenderMs={vs > 1 ? 500 : 0}
              ignoreChildrenChanging={ignoreChildrenChanging}
            >
              {adjustedChildren
                ? getJSXFromPieces({
                  pieces: adjustedChildren,
                  sharesBlockWithSelectedVerse: hasSelectedVerseChild,
                  sharesBlockWithFocussedVerse: hasFocussedVerseChild,
                  doSmallCaps,
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
                  getTagStyle({ tag, styles: viewStyles }),
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