import React, { useState, useEffect, useMemo, useRef } from "react"
import { StyleSheet, View, ScrollView, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { getCorrespondingRefs } from "@bibletags/bibletags-versification"
import { i18n } from "inline-i18n"

import useBibleVersions from "../../hooks/useBibleVersions"
import useVersePieces from "../../hooks/useVersePieces"
import { getVersionInfo, equalObjs, getOriginalVersionInfo } from "../../utils/toolbox"

import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"
import NotYetTagged from "./NotYetTagged"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  onSizeChangeFunctions,
  style,

  passage,
  myBibleVersions,
}) => {

  const [ index, setIndex ] = useState(0)
  const { versionIds } = useBibleVersions({ myBibleVersions })
  const scrollRef = useRef()

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

  const passageWithVerse = useMemo(
    () => ({
      ...passage,
      ref: {
        ...passage.ref,
        verse: selectedVerse,
      },
    }),
    [ passage, selectedVerse ],
  )

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

  const { pieces, piecesVersionId } = useVersePieces({
    versionId: versionIdShowing,
    refs: correspondingRefsByVersion[versionIdShowing],
  })

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

  useEffect(
    () => {
      scrollRef.current.scrollTo({ y: 0, animated: false })
    },
    [ pieces ],
  )

  // TODO: show vs num (and chapter when different) before each verse when not the same

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentContainer}
        onContentSizeChange={onSizeChangeFunctions[0]}
        alwaysBounceVertical={false}
        ref={scrollRef}
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
        {piecesVersionId === 'original' &&
          <NotYetTagged
            passage={passageWithVerse}
          />
        }
      </ScrollView>
      <BottomNavigation
        selectedIndex={index}
        onSelect={setIndex}
        onLayout={onSizeChangeFunctions[1]}
      >
        {versionIdsToShow.map(id => (
          <BottomNavigationTab
            key={id}
            title={getVersionInfo(id).abbr}
          />
        ))}
      </BottomNavigation>
      <IPhoneXBuffer
        extraSpace={true}
        onLayout={onSizeChangeFunctions[2]}
      />
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