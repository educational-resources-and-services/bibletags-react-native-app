import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react"
import { StyleSheet, View, ScrollView, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { getCorrespondingRefs, getLocFromRef } from "@bibletags/bibletags-versification"
import { getWordsHash } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"
import { useDimensions } from "@react-native-community/hooks"

import useBibleVersions from "../../hooks/useBibleVersions"
import useVersePieces from "../../hooks/useVersePieces"
import useEqualObjsMemo from "../../hooks/useEqualObjsMemo"
import useTagSet from "../../hooks/useTagSet"
import useSetSelectedTagInfo from "../../hooks/useSetSelectedTagInfo"
// import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { getVersionInfo, equalObjs, getOriginalVersionInfo, memo } from "../../utils/toolbox"

import IPhoneXBuffer from "./IPhoneXBuffer"
import Verse from "./Verse"
import NotYetTagged from "./NotYetTagged"
import OriginalWordInfo from "./OriginalWordInfo"
import CoverAndSpin from "./CoverAndSpin"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  originalWordInfo: {
    paddingTop: 0,
  },
  noCompareVersionsContainer: {
    padding: 20,
    opacity: .5,
    minHeight: 150,
  },
  scrollView: {
  },
  scrollViewContentContainer: {
    padding: 20,
  },
  verseContainer: {
  },
  preLoadSpacer: {
    height: 60,
  },
  coverAndSpin: {
    bottom: 60,
  },
  tab: {
    paddingHorizontal: 5,
  },
})

const displaySettingsOverride = {
  hideNotes: true,
}

const LowerPanelVsComparison = ({
  selectedSection,
  selectedVerse,
  selectedVerseUsfm,
  selectedInfo,
  selectedTagInfo,
  updateSelectedData,
  onSizeChangeFunctions,
  clearRecordedHeights,
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
  const { downloadedVersionIds, versionsCurrentlyDownloading } = useBibleVersions({ myBibleVersions, restrictToTestamentBookId: passage.ref.bookId })
  const scrollRef = useRef()

  const { width } = useDimensions().window
  const maxVersionIdsAccordingToDeviceWidth = parseInt(width / 60, 10)

  const selectedVersionId = (
    selectedSection === 'primary'
      ? passage.versionId
      : passage.parallelVersionId
  )

  const versionIdsToShow = useMemo(
    () => (
      downloadedVersionIds
        .filter(id => ![ passage.versionId, passage.parallelVersionId ].includes(id))
        .slice(0, maxVersionIdsAccordingToDeviceWidth)
    ),
    [ downloadedVersionIds, passage.versionId, passage.parallelVersionId, maxVersionIdsAccordingToDeviceWidth ],
  )
  const effectiveIndex = index < versionIdsToShow.length ? index : 0

  const versionIdShowing = versionIdsToShow[effectiveIndex]

  const [ selectedWordIdx, setSelectedWordIdx ] = useState(0)

  const { wordDividerRegex, isOriginal } = getVersionInfo(versionIdShowing)
  const selectedRef = useEqualObjsMemo({ versionId: selectedVersionId, ...passage.ref, verse: selectedVerse })
  const wordsHash = selectedVersionId !== 'original' && getWordsHash({ usfm: selectedVerseUsfm, wordDividerRegex })

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

  const isPriorToDisplayOfVerse = useRef(true)
  useLayoutEffect(
    () => {
      if(piecesVersionId) {
        isPriorToDisplayOfVerse.current = false
      }
    },
    [ !!piecesVersionId ],
  )

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
  const wordId = (originalWordsInfo[adjustedSelectedWordIdx] || {})[`x-id`]

  const wordNotYetTagged = !!(
    (tagSet || {}).status === 'automatch'
    && selectedInfo
    && hasNoCoorespondingOriginalWord
  )

  const showNotYetTagged = !selectedTagInfo && (!selectedInfo || [ 'automatch', 'none', undefined ].includes((tagSet || {}).status))

  useEffect(
    () => {
      if(scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: false })
      }
    },
    [ pieces ],
  )

  useLayoutEffect(
    () => {
      if(piecesVersionId) {
        clearRecordedHeights()
      }
    },
    [ piecesVersionId ],
  )

  useLayoutEffect(
    () => {
      if(!isOriginal) {
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

  if(versionIdsToShow.length === 0) {
    return (
      <>
        <View
          onLayout={onSizeChangeFunctions[0]}
          style={styles.noCompareVersionsContainer}
        >
          {versionsCurrentlyDownloading && <CoverAndSpin />}
          {!versionsCurrentlyDownloading &&
            <Text>
              {i18n("Tapping a verse number provides a quick comparison between your Bible versions. To get started, add Bible versions by tapping the pencil icon within the passage chooser.")}
            </Text>
          }
          <IPhoneXBuffer
            extraSpace={true}
          />
        </View>
        <View onLayout={onSizeChangeFunctions[1]} />
      </>
    )
  }

  // TODO: show vs num (and chapter when different) before each verse when not the same

  return (
    <View style={styles.container}>
      {!piecesVersionId && <CoverAndSpin style={styles.coverAndSpin} size="small" />}
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
          containerStyle={styles.verseContainer}
          style={[
            styles.verse,
            style,
          ]}
          originalWordsInfo={originalWordsInfo}
          selectedWordIdx={selectedWordIdx}
          setSelectedWordIdx={setSelectedWordIdx}
          onVerseTap={onOriginalWordVerseTap}
          displaySettingsOverride={displaySettingsOverride}
        />
      </ScrollView>
      <View onLayout={onSizeChangeFunctions[1]}>
        {isPriorToDisplayOfVerse.current && !piecesVersionId && <View style={styles.preLoadSpacer} />}
        {piecesVersionId === 'original' && showNotYetTagged &&
          <NotYetTagged
            passage={passageWithVerse}
            tagSet={tagSet}
            iHaveSubmittedATagSet={iHaveSubmittedATagSet}
            wordNotYetTagged={wordNotYetTagged}
          />
        }
        {piecesVersionId === 'original' && !showNotYetTagged &&
          <OriginalWordInfo
            noPaddingTop={true}
            morph={morph}
            strong={strong}
            lemma={lemma}
            wordId={wordId}
            originalLoc={getLocFromRef(correspondingRefsByVersion.original[0])}  // TODO: This will not necessarily be correct if there are 2+ verses in the original; needs a fix
            extendedHeight={maxHeight - 310}
          />
        }
        <BottomNavigation
          selectedIndex={effectiveIndex}
          onSelect={setIndex}
        >
          {versionIdsToShow.map(id => (
            <BottomNavigationTab
              key={id}
              style={styles.tab}
              title={
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {getVersionInfo(id).abbr}
                </Text>
              }
            />
          ))}
        </BottomNavigation>
        <IPhoneXBuffer
          extraSpace={true}
        />
      </View>
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