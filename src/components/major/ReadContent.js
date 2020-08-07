import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { ScrollView, StyleSheet, Clipboard, Platform, I18nManager } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { useDimensions } from "@react-native-community/hooks"

import useAdjacentRefs from "../../hooks/useAdjacentRefs"
import useSetTimeout from "../../hooks/useSetTimeout"
import useBibleVersions from "../../hooks/useBibleVersions"

import TapOptions from "../basic/TapOptions"
import ReadContentPage from "./ReadContentPage"

import { setRef, setVersionId, setParallelVersionId } from "../../redux/actions"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    width: '300%',
  },
  toastText: {
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
})

const ReadContent = React.memo(({
  passage,
  recentPassages,
  recentSearches,
  myBibleVersions,

  setRef,
  setVersionId,
  setParallelVersionId,
}) => {

  const { ref, versionId, parallelVersionId } = passage

  const [ selectedInfo, setSelectedInfo ] = useState({})
  const [ statePassage, setStatePassage ] = useState(passage)
  const [ primaryLoaded, setPrimaryLoaded ] = useState(false)
  const [ secondaryLoaded, setSecondaryLoaded ] = useState(false)

  const { selectedSection, selectedVerse, selectedTextContent, selectedTapX, selectedTapY } = selectedInfo

  const containerRef = useRef()
  const scrollController = useRef('primary')
  const skipVerseTap = useRef(false)
  const primaryScrollY = useRef(0)

  const { width, height } = useDimensions().window

  const { primaryVersionIds, secondaryVersionIds } = useBibleVersions({ myBibleVersions })

  const [ setOffsetTimeout ] = useSetTimeout()

  if(passage !== statePassage) {
    const refChanged = ref !== statePassage.ref
    const primaryChanged = versionId !== statePassage.versionId
    const secondaryChanged = parallelVersionId !== statePassage.parallelVersionId

    setStatePassage(passage)
    setPrimaryLoaded(primaryLoaded && !refChanged && !primaryChanged)
    setSecondaryLoaded(secondaryLoaded && !refChanged && !secondaryChanged)
    setSelectedInfo({})
  }

  const adjacentRefs = useAdjacentRefs(passage)

  useEffect(
    () => {
      if(primaryVersionIds.length === 0) return

      // in the event that a version has been removed...

      if(!primaryVersionIds.includes(versionId)) {
        setVersionId({ versionId: primaryVersionIds[0] })
      }

      if(parallelVersionId && !secondaryVersionIds.includes(parallelVersionId)) {
        setParallelVersionId({ parallelVersionId: secondaryVersionIds[0] })
      }
    },
    [ primaryVersionIds.length === 0 ],
  )

  const onTouchStart = useCallback(
    scrollCntrlr => {
      scrollController.current = scrollCntrlr

      if(selectedSection) {
        setSelectedInfo({})
        skipVerseTap.current = true
      }
    },
    [ selectedSection ],
  )

  const onTouchEnd = useCallback(() => skipVerseTap.current = undefined, [])

  const setContainerRef = ref => {
    containerRef.current = ref
    setOffsetTimeout(setContentOffset)
  }

  const setContentOffset = useCallback(
    () => {
      if(containerRef.current) {
        containerRef.current.scrollTo({ x: width, animated: false })
      }
    },
    [ width ],
  )

  const onPageSwipeEnd = useCallback(
    ({ nativeEvent }) => {
      const { x } = nativeEvent.contentOffset
      const scrollDiff = parseInt(x, 10) - parseInt(width, 10)

      if(scrollDiff) {
        let goPrev = scrollDiff < 0
        if(Platform.OS === 'android' && I18nManager.isRTL) goPrev = !goPrev
        const ref = adjacentRefs[ goPrev ? 'previous' : 'next' ]

        if(!ref.bookId) {
          setContentOffset()
          return
        }

        primaryScrollY.current = 0

        setRef({
          ref,
          wasSwipe: true,
        })
        setContentOffset()
      }
    },
    [ setRef, setContentOffset, adjacentRefs ],
  )

  const onVerseTap = useCallback(
    ({ selectedSection, selectedVerse, selectedTextContent, pageX, pageY }) => {
      if(skipVerseTap.current) return
      if(selectedVerse == null) return

      setSelectedInfo({
        selectedSection,
        selectedVerse,
        selectedTextContent,
        selectedTapX: pageX,
        selectedTapY: pageY,
      })
    },
    [],
  )

  const tapOptions = useMemo(
    () => ([
      {
        label: i18n("Copy"),
        action: () => {
          Clipboard.setString(selectedTextContent)

          return {
            showResult: true,
            onDone: () => setSelectedInfo({}),
          }
        }
      },
    ]),
    [ selectedTextContent ],
  )

  if(primaryVersionIds.length === 0) return null

  const showingRecentBookmarks = (recentPassages.length + recentSearches.length) !== 1

  const getPage = direction => {
    const pageRef = adjacentRefs[direction] || ref

    return (
      <ReadContentPage
        key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
        direction={direction}
        passage={passage}
        selectedSection={selectedSection}
        selectedVerse={selectedVerse}
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
        primaryScrollY={primaryScrollY}
        scrollController={scrollController}
        setPrimaryLoaded={setPrimaryLoaded}
        setSecondaryLoaded={setSecondaryLoaded}
        onVerseTap={onVerseTap}
      />
    )
  }

  return (
    <>
      <ScrollView
        style={[
          styles.container,
          // (showingRecentBookmarks ? { marginBottom: 84 } : null),
        ]}
        contentContainerStyle={styles.contentContainer}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: width, y: 0 }}
        ref={setContainerRef}
        onMomentumScrollEnd={onPageSwipeEnd}
        //onContentSizeChange={setContentOffset}  // I might need this for device rotation
      >
        {[
          getPage('previous'),
          getPage(),
          getPage('next'),
        ]}
      </ScrollView>
      {!!selectedSection &&
        <TapOptions
          options={tapOptions}
          centerX={selectedTapX}
          bottomY={selectedTapY >= 150 ? (height - selectedTapY + 20) : null}
          topY={selectedTapY < 150 ? (selectedTapY + 40) : null}
        />
      }
    </>
  )

})

const mapStateToProps = ({ passage, recentPassages, recentSearches, myBibleVersions }) => ({
  passage,
  recentPassages,
  recentSearches,
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)