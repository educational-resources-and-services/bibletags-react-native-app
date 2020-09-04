import React, { useState, useCallback, useEffect, useRef } from "react"
import { ScrollView, StyleSheet, Platform, I18nManager } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
// import { i18n } from "inline-i18n"
import { useDimensions } from "@react-native-community/hooks"
import { useLayout } from '@react-native-community/hooks'

import useAdjacentRefs from "../../hooks/useAdjacentRefs"
import useSetTimeout from "../../hooks/useSetTimeout"
import useBibleVersions from "../../hooks/useBibleVersions"
import useInstanceValue from "../../hooks/useInstanceValue"

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
  selectedInfo,
  setSelectedInfo,

  passage,
  myBibleVersions,

  setRef,
  setVersionId,
  setParallelVersionId,
}) => {

  const { ref, versionId, parallelVersionId } = passage

  const [ statePassage, setStatePassage ] = useState(passage)
  const [ primaryLoaded, setPrimaryLoaded ] = useState(false)
  const [ secondaryLoaded, setSecondaryLoaded ] = useState(false)

  const { selectedSection, selectedVerse } = selectedInfo
  const getSelectedInfo = useInstanceValue(selectedInfo)

  const containerRef = useRef()
  const scrollController = useRef('primary')
  const primaryScrollY = useRef(0)

  const { width } = useDimensions().window
  const { onLayout, height } = useLayout()

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

  const onTouchStart = useCallback(scrollCntrlr => { scrollController.current = scrollCntrlr }, [])

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
    ({ selectedSection, selectedVerse, selectedTextContent, selectedWordInfo, pageX, pageY }={}) => {

      const currentSelectedInfo = getSelectedInfo()

      if(
        currentSelectedInfo.selectedSection
        && !(
          currentSelectedInfo.selectedSection === selectedSection
          && currentSelectedInfo.selectedVerse === selectedVerse
        )
      ) {
        setSelectedInfo({})
        return
      }

      if(selectedVerse == null) return

      setSelectedInfo({
        selectedSection,
        selectedVerse,
        selectedTextContent,
        selectedTapX: pageX,
        selectedTapY: pageY,
        selectedWordInfo,
      })
    },
    [ setSelectedInfo ],
  )

  if(primaryVersionIds.length === 0) return null

  const getPage = direction => {
    const pageRef = adjacentRefs[direction] || ref

    return (
      <ReadContentPage
        key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
        direction={direction}
        passage={passage}
        selectedSection={direction ? null : selectedSection}
        selectedVerse={direction ? null : selectedVerse}
        onTouchStart={onTouchStart}
        // onTouchEnd={onTouchEnd}
        primaryScrollY={primaryScrollY}
        scrollController={scrollController}
        setPrimaryLoaded={setPrimaryLoaded}
        setSecondaryLoaded={setSecondaryLoaded}
        onVerseTap={onVerseTap}
        height={height}
      />
    )
  }

  return (
    <>
      <ScrollView
        style={[
          styles.container,
        ]}
        contentContainerStyle={styles.contentContainer}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: width, y: 0 }}
        ref={setContainerRef}
        onMomentumScrollEnd={onPageSwipeEnd}
        //onContentSizeChange={setContentOffset}  // I might need this for device rotation
        onLayout={onLayout}
      >
        {[
          getPage('previous'),
          getPage(),
          getPage('next'),
        ]}
      </ScrollView>
    </>
  )

})

const mapStateToProps = ({ passage, myBibleVersions }) => ({
  passage,
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)