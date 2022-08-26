import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { StyleSheet, ScrollView, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPiecesFromUSFM } from "@bibletags/bibletags-ui-helper"
import { getRefsFromUsfmRefStr } from "@bibletags/bibletags-ui-helper"
import { getLocFromRef } from "@bibletags/bibletags-versification"
import { i18n } from "inline-i18n"

import { getVersionInfo, executeSql } from '../../utils/toolbox'

import Footnote from "./Footnote"
import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footnoteScrollView: {
    flexShrink: 1,
    flexGrow: 0,
  },
  verseScrollView: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    minHeight: '35%',  // This could be better by being a fixed value based on the text size and window height
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, .15)',
  },
  verseScrollViewContentContainer: {
    padding: 20,
  },
})

const displaySettingsOverride = {
  hideNotes: true,
}

const LowerPanelFootnote = ({
  selectedSection,
  selectedInfo,
  isCf,
  onSizeChangeFunctions,
  style,

  passage,
}) => {

  const selectedVersionId = (
    selectedSection === 'primary'
      ? passage.versionId
      : passage.parallelVersionId
  )

  const { content } = selectedInfo || {}
  const { wordDividerRegex } = getVersionInfo(selectedVersionId)

  const pieces = useMemo(
    () => {
      const pieces = getPiecesFromUSFM({
        usfm: content.replace(/^. /, isCf ? `\\fk ${i18n("Cross references")} \\ft ` : ``),
        inlineMarkersOnly: true,  // this should become false to allow for \fp
        wordDividerRegex,
      })

      // change the tag for xt when it does not have attrib
      pieces.forEach(piece => {
        if(piece.tag === `xt` && !piece.attrib) {
          piece.tag = `xt-noref`
        }
      })

      // TEMP - I need a solution for original language notes to be translatable
      pieces.forEach(piece => {
        if(piece.content === 'Q ') {
          piece.content = 'Qere '
        }
        if(piece.content === 'K ') {
          piece.content = 'Ketiv '
        }
      })

      return pieces
    },
    [ content, selectedVersionId ],
  )

  const [ footnoteScrollHeight, setFootnoteScrollHeight ] = useState(60)
  const [ scriptureRefs, setScriptureRefs ] = useState({})
  const [ selectedAttr, setSelectedAttr ] = useState()
  const [ selectedVersePieces, setSelectedVersePieces ] = useState([])

  const selectedRefs = scriptureRefs[selectedAttr]

  const verseScrollRef = useRef()

  useEffect(
    () => {
      const scriptureRefs = {}
      let selectedAttr

      const totalPiecesByType = { xt: 0, other: 0 }
      const findNumCharsInPiecesPerType = pcs => {
        pcs.forEach(({ tag, children, text, content }) => {
          if(children) {
            findNumCharsInPiecesPerType(children)
          }
          if([ "fk", "zFootnoteType" ].includes(tag)) return  // these don't count
          totalPiecesByType[tag === `xt` ? `xt` : `other`] += (text || content || ``).length
        })
      }
      findNumCharsInPiecesPerType(pieces)

      pieces
        .filter(({ tag, attrib }) => (tag === 'xt' && attrib))
        .forEach(({ attrib }) => {
          scriptureRefs[attrib] = getRefsFromUsfmRefStr(attrib.substr(1))
          selectedAttr = selectedAttr || attrib
        })

      setScriptureRefs(scriptureRefs)
      if(totalPiecesByType.xt > totalPiecesByType.other) {
        setSelectedAttr(selectedAttr)
      }
    },
    [ pieces ],
  )

  const onFootnoteTap = useCallback(
    ({ selectedInfo }) => {
      const { attrib, tag } = selectedInfo || {}
      if(tag === 'xt' && attrib) {
        setSelectedAttr(attrib)
        if(verseScrollRef.current) {
          verseScrollRef.current.scrollTo({ y: 0, animated: false })
        }
      }
    },
    [],
  )

  const onVerseTap = useCallback(() => {}, [])

  useEffect(
    () => {
      if(!selectedRefs) return

      (async () => {

        const { rows: { _array: verses } } = await executeSql({
          versionId: selectedVersionId,
          bookId: selectedRefs[0].bookId,
          statement: ({ bookId, limit }) => `SELECT * FROM ${selectedVersionId}VersesBook${bookId} WHERE loc >= ? AND loc <= ? ORDER BY loc LIMIT ${limit}`,
          args: [
            getLocFromRef(selectedRefs[0]),
            getLocFromRef(selectedRefs[1] || selectedRefs[0]),
          ],
          limit: 5,  // will show ellipsis if more were sought
          removeWordPartDivisions: true,
        })

        setSelectedVersePieces(
          verses
            .map(verse => (
              getPiecesFromUSFM({
                usfm: `\\c ${selectedRefs[0].chapter}\n${verse.usfm}${i18n(" ", "word separator")}`,
                inlineMarkersOnly: true,
                wordDividerRegex,
              })
            ))
            .flat()
        )

      })()
    },
    [ selectedVersionId, selectedRefs ],
  )

  const onFootnoteContentSizeChange = useCallback(
    (...params) => {
      setFootnoteScrollHeight(params[1])
      onSizeChangeFunctions[0](...params)
    },
    [],
  )

  return (
    <View style={styles.container}>

      <ScrollView
        style={[
          styles.footnoteScrollView,
          { height: footnoteScrollHeight },
        ]}
        alwaysBounceVertical={false}
        onContentSizeChange={onFootnoteContentSizeChange}
      >
        <Footnote
          key={content}  // needed to fix Android bug where updated text sometimes doesn't show (e.g. In Isaiah 16:4 ESV, tap the cf and then the note)
          selectedVersionId={selectedVersionId}
          selectedInfo={selectedInfo}
          pieces={pieces}
          selectedAttr={selectedAttr}
          onFootnoteTap={onFootnoteTap}
        />
        {!selectedRefs && <IPhoneXBuffer extraSpace={true} />}
      </ScrollView>

      {!!selectedRefs &&
        <ScrollView
          style={styles.verseScrollView}
          contentContainerStyle={styles.verseScrollViewContentContainer}
          alwaysBounceVertical={false}
          onContentSizeChange={onSizeChangeFunctions[1]}
          ref={verseScrollRef}
        >
          <Verse
            passageRef={selectedRefs[0]}
            versionId={selectedVersionId}
            pieces={selectedVersePieces}
            style={style}
            onVerseTap={onVerseTap}
            displaySettingsOverride={displaySettingsOverride}
          />
          <IPhoneXBuffer extraSpace={true} />
        </ScrollView>
      }

      {!selectedRefs && <View onLayout={onSizeChangeFunctions[1]} />}

    </View>
  )

}

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LowerPanelFootnote)