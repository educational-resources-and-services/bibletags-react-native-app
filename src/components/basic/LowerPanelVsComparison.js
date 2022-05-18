import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react"
import { StyleSheet, View, ScrollView, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { getCorrespondingRefs, getLocFromRef } from "@bibletags/bibletags-versification"
import { getWordsHash } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"

import useBibleVersions from "../../hooks/useBibleVersions"
import useVersePieces from "../../hooks/useVersePieces"
import useMemoObject from "../../hooks/useMemoObject"
import useTagSet from "../../hooks/useTagSet"
import useSetSelectedTagInfo from "../../hooks/useSetSelectedTagInfo"
// import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { getVersionInfo, equalObjs, getOriginalVersionInfo, memo } from "../../utils/toolbox"

import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"
import NotYetTagged from "./NotYetTagged"
import OriginalWordInfo from "./OriginalWordInfo"

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
  selectedVerseUsfm,
  selectedInfo,
  selectedTagInfo,
  updateSelectedData,
  onSizeChangeFunctions,
  style,
  maxHeight,

  eva: { style: themedStyle={} },

  passage,
  myBibleVersions,
}) => {

  // const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  // const [
  //   // phantomTextStyle={},
  // ] = altThemedStyleSets

  const [ index, setIndex ] = useState(0)
  const { versionIds } = useBibleVersions({ myBibleVersions })
  const scrollRef = useRef()

  const selectedVersionId = (
    selectedSection === 'primary'
      ? passage.versionId
      : passage.parallelVersionId
  )

  const bothVersionIds = useMemoObject([ passage.versionId, passage.parallelVersionId ].filter(Boolean))
  const versionIdsToShow = useMemo(
    () => versionIds.filter(id => !bothVersionIds.includes(id)),
    [ versionIds, bothVersionIds ],
  )

  const versionIdShowing = versionIdsToShow[index]

  const [ selectedWordIdx, setSelectedWordIdx ] = useState(0)

  const { wordDividerRegex, isOriginal } = getVersionInfo(versionIdShowing)
  const selectedRef = useMemoObject({ versionId: selectedVersionId, ...passage.ref, verse: selectedVerse })
  const wordsHash = getWordsHash({ usfm: selectedVerseUsfm, wordDividerRegex })

  const { tagSet, iHaveSubmittedATagSet } = useTagSet({
    loc: getLocFromRef(selectedRef),
    versionId: selectedVersionId,
    wordsHash,
    skip: !isOriginal,
  })

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

  const { originalWordsInfo, hasNoCoorespondingOriginalWord, onOriginalWordVerseTap } = useSetSelectedTagInfo({
    skip: !isOriginal,
    tagSet,
    pieces,
    selectedInfo,
    selectedTagInfo,
    selectedVersionId,
    bookId: passage.ref.bookId,
    updateSelectedData,
  })

  const adjustedSelectedWordIdx = selectedWordIdx > originalWordsInfo.length - 1 ? 0 : selectedWordIdx
  const { morph, strong, lemma } = originalWordsInfo[adjustedSelectedWordIdx] || {}

  const wordNotYetTagged = !!(
    (tagSet || {}).status === 'automatch'
    && selectedInfo
    && hasNoCoorespondingOriginalWord
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

  useEffect(
    () => {
      scrollRef.current.scrollTo({ y: 0, animated: false })
    },
    [ pieces ],
  )

  useLayoutEffect(
    () => {
      if(!isOriginal) {
        onSizeChangeFunctions[6](0,0)
        updateSelectedData({
          selectedInfo: null,
          selectedTagInfo: null,
        })
      }
    },
    [ isOriginal ],
  )

  const hasSelectedInfo = !!selectedInfo
  const originalIdxInVersionIdsToShow = versionIdsToShow.indexOf(`original`)
  useLayoutEffect(
    () => {
      if(!isOriginal && hasSelectedInfo && originalIdxInVersionIdsToShow !== -1) {
        setIndex(originalIdxInVersionIdsToShow)
      }
    },
    [ hasSelectedInfo ],
  )

  // TODO: show vs num (and chapter when different) before each verse when not the same

  const showNotYetTagged = !selectedTagInfo && (!selectedInfo || [ 'automatch', 'none', undefined ].includes((tagSet || {}).status))

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentContainer}
        onContentSizeChange={onSizeChangeFunctions[5]}
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
          originalWordsInfo={originalWordsInfo}
          selectedWordIdx={selectedWordIdx}
          setSelectedWordIdx={setSelectedWordIdx}
          onVerseTap={onOriginalWordVerseTap}
        />
      </ScrollView>
      {piecesVersionId === 'original' && showNotYetTagged &&
        <NotYetTagged
          passage={passageWithVerse}
          tagSet={tagSet}
          iHaveSubmittedATagSet={iHaveSubmittedATagSet}
          wordNotYetTagged={wordNotYetTagged}
          onLayout={onSizeChangeFunctions[6]}
        />
      }
      {piecesVersionId === 'original' && !showNotYetTagged &&
        <OriginalWordInfo
          morph={morph}
          strong={strong}
          lemma={lemma}
          onSizeChange={onSizeChangeFunctions[6]}
          extendedHeight={maxHeight - 310}
        />
      }
      <BottomNavigation
        selectedIndex={index}
        onSelect={setIndex}
        onLayout={onSizeChangeFunctions[7]}
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
        onLayout={onSizeChangeFunctions[8]}
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

export default memo(connect(mapStateToProps, matchDispatchToProps)(LowerPanelVsComparison), { name: 'LowerPanelVsComparison' })