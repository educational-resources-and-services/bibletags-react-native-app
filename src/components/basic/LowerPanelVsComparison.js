import React, { useState, useEffect } from "react"
import Constants from "expo-constants"
import { StyleSheet, View, ScrollView } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { getLocFromRef } from "bibletags-versification/src/versification"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting"

import useBibleVersions from "../../hooks/useBibleVersions"
import { getVersionInfo, executeSql } from "../../utils/toolbox"
import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
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
  selectedVerse,
  style,

  passage,
  myBibleVersions,
}) => {

  const [ index, setIndex ] = useState(0)
  const [ pieces, setPieces ] = useState([])
  const [ piecesVersionId, setPiecesVersionId ] = useState()
  const { versionIds } = useBibleVersions({ myBibleVersions })

  const currentVersionIds = [
    passage.versionId,
    passage.parallelVersionId,
  ].filter(Boolean)

  const versionIdsToShow = versionIds.filter(id => !currentVersionIds.includes(id))
  const versionIdShowing = versionIdsToShow[index]

  useEffect(
    () => {
      (async () => {
        const { rows: { _array: [ verse ] } } = await executeSql({
          versionId: versionIdShowing,
          statement: ({ bookId, limit }) => `SELECT * FROM ${versionIdShowing}VersesBook${bookId} WHERE loc = ? LIMIT ${limit}`,
          args: [
            getLocFromRef({
              ...passage.ref,
              verse: selectedVerse,
            }),
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

        setPieces(
          getPiecesFromUSFM({
            usfm: `\\c ${passage.ref.chapter}\n${verse.usfm.replace(/\\c ([0-9]+)\n?/g, '')}`,
            inlineMarkersOnly: true,
            wordDividerRegex,
          })
        )
        setPiecesVersionId(versionIdShowing)

      })()
    },
    [ versionIdShowing, passage.ref, selectedVerse ],
  )

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