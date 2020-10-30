import React, { useState, useMemo, useEffect, useCallback } from "react"
import Constants from "expo-constants"
import { StyleSheet, ScrollView, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting"
import { getRefsFromUsfmRefStr } from "bibletags-ui-helper"
import { getLocFromRef } from "bibletags-versification/src/versification"
import { i18n } from "inline-i18n"

import { getVersionInfo, executeSql } from '../../utils/toolbox'

import Footnote from "./Footnote"
import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, .15)',
  },
  scrollViewContentContainer: {
    padding: 20,
  },
})

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

  const [ scriptureRefs, setScriptureRefs ] = useState({})
  const [ selectedAttr, setSelectedAttr ] = useState()
  const [ selectedVersePieces, setSelectedVersePieces ] = useState([])

  const selectedRefs = scriptureRefs[selectedAttr]

  useEffect(
    () => {
      const scriptureRefs = {}
      let selectedAttr

      pieces
        .filter(({ tag, attrib }) => (tag === 'xt' && attrib))
        .forEach(({ attrib }) => {
          scriptureRefs[attrib] = getRefsFromUsfmRefStr(attrib.substr(1))
          selectedAttr = selectedAttr || attrib
        })

      setScriptureRefs(scriptureRefs)
      setSelectedAttr(selectedAttr)
    },
    [ pieces ],
  )

  const onFootnoteTap = useCallback(
    ({ selectedInfo }) => {
      const { attrib, tag } = selectedInfo || {}
      if(tag === 'xt' && attrib) {
        setSelectedAttr(attrib)
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
          removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
          removeWordPartDivisions: true,
        })

        setSelectedVersePieces(
          verses
            .map(verse => {
              const preppedUsfm = verse.usfm
                .replace(/\\m(?:t[0-9]?|te[0-9]?|s[0-9]?|r) .*\n?/g, '')  // get rid of book headings
                .replace(/\\c ([0-9]+)\n?/g, '')  // get rid of chapter marker, since it is put in below
    
              return getPiecesFromUSFM({
                usfm: `\\c ${selectedRefs[0].chapter}\n${preppedUsfm}`,
                inlineMarkersOnly: true,
                wordDividerRegex,
              })
            })
            .flat()
        )

      })()
    },
    [ selectedVersionId, selectedRefs ],
  )

  return (
    <View style={styles.container}>
      <Footnote
        selectedVersionId={selectedVersionId}
        selectedInfo={selectedInfo}
        pieces={pieces}
        selectedAttr={selectedAttr}
        onFootnoteTap={onFootnoteTap}
        onLayout={onSizeChangeFunctions[0]}
      />
      {selectedRefs &&
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContentContainer}
          alwaysBounceVertical={false}
          onContentSizeChange={onSizeChangeFunctions[1]}
        >
          <Verse
            passageRef={selectedRefs[0]}
            versionId={selectedVersionId}
            pieces={selectedVersePieces}
            style={style}
            onVerseTap={onVerseTap}
          />
        </ScrollView>
      }
      <IPhoneXBuffer
        extraSpace={true}
        onLayout={onSizeChangeFunctions[2]}
      />
    </View>
  )

}

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LowerPanelFootnote)