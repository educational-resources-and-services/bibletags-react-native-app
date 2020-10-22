import React, { useState, useEffect, useMemo } from "react"
import Constants from "expo-constants"
import { StyleSheet, View, ScrollView, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { getLocFromRef, getCorrespondingRefs } from "bibletags-versification/src/versification"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting"
import { i18n } from "inline-i18n"

import useBibleVersions from "../../hooks/useBibleVersions"
import { getVersionInfo, executeSql, equalObjs, getOriginalVersionInfo } from "../../utils/toolbox"
import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  noCompareVersions: {
    padding: 20,
    opacity: .5,
  },
  scrollView: {
    minHeight: 60,
  },
  scrollViewContentContainer: {
    padding: 20,
  },
  verse: {
  },
})

const LowerPanelVsComparison = ({
  selectedSection,
  selectedVerse,
  style,

  passage,
  myBibleVersions,
}) => {

  const [ index, setIndex ] = useState(0)
  const [ pieces, setPieces ] = useState([])
  const [ piecesVersionId, setPiecesVersionId ] = useState()
  const { versionIds } = useBibleVersions({ myBibleVersions })

  const selectedVersionId = (
    selectedSection === 'primary'
      ? passage.versionId
      : passage.parallelVersionId
  )

  const versionIdsToShow = useMemo(
    () => versionIds.filter(id => id !== selectedVersionId),
    [ versionIds, selectedVersionId ],
  )

  const versionIdShowing = versionIdsToShow[index]

  const correspondingRefsByVersion = useMemo(
    () => {
      const refsByVersion = {}
      const baseRef = {
        ...passage.ref,
        verse: selectedVerse,
      }

      versionIdsToShow.forEach(versionId => {

        refsByVersion[versionId] = [ baseRef ]
        const originalVersionInfo = getOriginalVersionInfo(baseRef.bookId)
  
        if(passage.versionId !== originalVersionInfo.id) {
          refsByVersion[versionId] = getCorrespondingRefs({
            baseVersion: {
              info: getVersionInfo(passage.versionId),
              ref: baseRef,
            },
            lookupVersionInfo: originalVersionInfo,
          }) || refsByVersion[versionId]
        }
  
        if(versionId !== originalVersionInfo.id) {
          refsByVersion[versionId] = refsByVersion[versionId]
            .map(correspondingRef => (
              getCorrespondingRefs({
                baseVersion: {
                  info: originalVersionInfo,
                  ref: correspondingRef,
                },
                lookupVersionInfo: getVersionInfo(versionId),
              }) || refsByVersion[versionId]
            ))
            .flat()
            // need the reduce funciton in case a version corresponds to two orig verses which correspond to different wordRanges in the same verse
            // TODO: It would be better to handle wordRange's in the verse comparison. If I do so, this will need adjustment.
            .reduce((uniqueRefs, ref) => (
              uniqueRefs.some(uniqueRef => equalObjs(uniqueRef, ref))
                ? uniqueRefs
                : [
                  ...uniqueRefs,
                  ref,
                ]
            ), [])
        }

      })

      return refsByVersion
    },
    [ passage, versionIdsToShow, selectedVerse ],
  )

  useEffect(
    () => {
      (async () => {
        const { rows: { _array: [ verse ] } } = await executeSql({
          versionId: versionIdShowing,
          bookId: passage.ref.bookId,
          statement: ({ bookId, limit }) => `SELECT * FROM ${versionIdShowing}VersesBook${bookId} WHERE loc IN ? ORDER BY loc LIMIT ${limit}`,
          args: [
            correspondingRefsByVersion[versionIdShowing].map(ref => getLocFromRef(ref)),
          ],
          limit: 1,
          removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
          removeWordPartDivisions: true,
        })

        if(!verse) {
          setPieces([])
          return
        }

        const { wordDividerRegex } = getVersionInfo(versionIdShowing)

        const preppedUsfm = verse.usfm
          .replace(/\\m(?:t[0-9]?|te[0-9]?|s[0-9]?|r) .*\n?/g, '')  // get rid of book headings
          .replace(/\\c ([0-9]+)\n?/g, '')  // get rid of chapter marker, since it is put in below

        setPieces(
          getPiecesFromUSFM({
            usfm: `\\c ${passage.ref.chapter}\n${preppedUsfm}`,
            inlineMarkersOnly: true,
            wordDividerRegex,
          })
        )
        setPiecesVersionId(versionIdShowing)

      })()
    },
    [ versionIdShowing, correspondingRefsByVersion[versionIdShowing], selectedVerse ],
  )

  if(versionIdsToShow.length === 0) {
    return (
      <>
        <Text style={styles.noCompareVersions}>
          {i18n("Tapping a verse number provides a quick comparison between your Bible versions. To get started, add Bible versions by tapping the pencil icon within the passage chooser.")}
        </Text>
        <IPhoneXBuffer extraSpace={true} />
      </>
    )
  }

  // TODO: show vs num (and chapter when different) before each verse when not the same

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentContainer}
        alwaysBounceVertical={false}
      >
        <Verse
          passageRef={passage.ref}
          versionId={piecesVersionId}
          pieces={pieces}
          style={[
            styles.verse,
            style,
          ]}
        />
      </ScrollView>
      <BottomNavigation
        selectedIndex={index}
        onSelect={setIndex}
      >
        {versionIdsToShow.map(id => (
          <BottomNavigationTab
            key={id}
            title={getVersionInfo(id).abbr}
          />
        ))}
      </BottomNavigation>
      <IPhoneXBuffer extraSpace={true} />
    </View>
  )

}

const mapStateToProps = ({ passage, myBibleVersions }) => ({
  passage,
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LowerPanelVsComparison)