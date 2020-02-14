import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import Constants from "expo-constants"
import { ScrollView, StyleSheet, Clipboard, Platform, I18nManager } from "react-native"
import { Toast } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { i18n } from "inline-i18n"
import { debounce } from "../../utils/toolbox.js"
import { useDimensions } from 'react-native-hooks'
import useAdjacentRefs from '../../hooks/useAdjacentRefs'

import TapOptions from '../basic/TapOptions'
import ReadContentPage from "./ReadContentPage"

import { setRef, setVersionId, setParallelVersionId, setPassageScroll } from "../../redux/actions"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

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
  passageScrollY,
  recentPassages,
  recentSearches,

  setRef,
  setVersionId,
  setParallelVersionId,
  setPassageScroll,
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
  const primaryRef = useRef()
  const secondaryRef = useRef()
  const primaryContentHeight = useRef(0)
  const secondaryContentHeight = useRef(0)
  const primaryHeight = useRef(0)
  const secondaryHeight = useRef(0)

  const { width, height } = useDimensions().window

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
      // in the event that a version has been removed...

      if(!PRIMARY_VERSIONS.includes(versionId)) {
        setVersionId({ versionId: PRIMARY_VERSIONS[0] })
      }

      if(parallelVersionId && !SECONDARY_VERSIONS.includes(parallelVersionId)) {
        setParallelVersionId({ parallelVersionId: SECONDARY_VERSIONS[0] })
      }
    }
    ,[],
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

  const onPrimaryTouchStart = useCallback(() => onTouchStart('primary'), [ onTouchStart ])
  const onSecondaryTouchStart = useCallback(() => onTouchStart('secondary'), [ onTouchStart ])

  const onPrimaryLayout = useCallback(({ nativeEvent }) => primaryHeight.current = nativeEvent.layout.height, [])
  const onSecondaryLayout = useCallback(({ nativeEvent }) => secondaryHeight.current = nativeEvent.layout.height, [])

  const onPrimaryContentSizeChange = useCallback((contentWidth, contentHeight) => primaryContentHeight.current = contentHeight, [])
  const onSecondaryContentSizeChange = useCallback(
    (contentWidth, contentHeight) => {
      secondaryContentHeight.current = contentHeight
      setUpParallelScroll()
    },
    [ setUpParallelScroll ],
  )

  const getScrollFactor = useCallback(
    () => {
      const primaryMaxScroll = Math.max(primaryContentHeight.current - primaryHeight.current, 0)
      const secondaryMaxScroll = Math.max(secondaryContentHeight.current - secondaryHeight.current, 0)

      return primaryMaxScroll / secondaryMaxScroll
    },
    [],
  )

  const onPrimaryScroll = useCallback(
    ({ nativeEvent }) => {
      primaryScrollY.current = nativeEvent.contentOffset.y

      setPassageScroll({
        y: primaryScrollY.current,
      })

      if(!secondaryRef.current) return
      if(scrollController.current !== 'primary') return
      if(!parallelVersionId) return

      const y = primaryScrollY.current / getScrollFactor()
      secondaryRef.current.scrollTo({ y, animated: false })
    }
    ,
    [ setPassageScroll, !parallelVersionId, getScrollFactor ],
  )

  const onSecondaryScroll = useCallback(
    ({ nativeEvent }) => {
      if(!primaryRef.current) return
      if(scrollController.current !== 'secondary') return
      if(!parallelVersionId) return

      const y = nativeEvent.contentOffset.y * getScrollFactor()
      primaryRef.current.scrollTo({ y, animated: false })
    },
    [ !parallelVersionId, getScrollFactor ],
  )

  const setUpParallelScroll = useCallback(
    () => {
      onPrimaryTouchStart()
      onPrimaryScroll({
        nativeEvent: {
          contentOffset: {
            y: primaryScrollY.current,
          }
        }
      })
    },
    [ onPrimaryTouchStart, onPrimaryScroll ],
  )

  const onPrimaryLoaded = useCallback(
    () => {
      primaryScrollY.current = passageScrollY
      const doInitialScroll = () => primaryRef.current.scrollTo({ y: primaryScrollY.current, animated: false })

      doInitialScroll
      setTimeout(doInitialScroll)  // may not fire without the setTimeout

      setUpParallelScroll()
      setPrimaryLoaded(true)
    },
    [ passageScrollY, setUpParallelScroll ],
  )

  const onSecondaryLoaded = useCallback(() => setSecondaryLoaded(true), [])

  const setPrimaryRef = useCallback(ref => primaryRef.current = ref, [])
  const setSecondaryRef = useCallback(ref => secondaryRef.current = ref, [])

  const setContainerRef = ref => {
    containerRef.current = ref
    setTimeout(setContentOffset)
  }

  const setContentOffset = useCallback(
    () => containerRef.current.scrollTo({ x: width, animated: false }),
    [ width ],
  )

  const onPageSwipeEnd = useCallback(
    ({ nativeEvent }) => {
      const { x } = nativeEvent.contentOffset

      if(x !== width) {
        let goPrev = x < width
        if(Platform.OS === 'android' && I18nManager.isRTL) goPrev = !goPrev
        const ref = adjacentRefs[ goPrev ? 'previous' : 'next' ]

        if(!ref.bookId) {
          setContentOffset()
          return
        }

        primaryScrollY.current = 0

        debounce(
          setRef,
          {
            ref,
            wasSwipe: true,
          },
        )
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

  const onPrimaryVerseTap = useCallback(({ ...params }) => onVerseTap({ selectedSection: 'primary', ...params }), [ onVerseTap ])
  const onSecondaryVerseTap = useCallback(({ ...params }) => onVerseTap({ selectedSection: 'secondary', ...params }), [ onVerseTap ])

  const tapOptions = useMemo(
    () => ([
      {
        label: i18n("Copy"),
        action: () => {
          Clipboard.setString(selectedTextContent)
          Toast.show({
            text: i18n("Verse copied to clipboard"),
            textStyle: styles.toastText,
            duration: 1700,
          })
          setSelectedInfo({})
        }
      },
    ]),
    [ selectedTextContent ],
  )

  const showingRecentBookmarks = (recentPassages.length + recentSearches.length) !== 1

  const getPage = direction => {
    const pageRef = adjacentRefs[direction] || ref

    return (
      <ReadContentPage
        key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}

        direction={direction}
        selectedSection={selectedSection}
        selectedVerse={selectedVerse}
        passage={passage}
        onTouchEnd={onTouchEnd}

        onPrimaryTouchStart={onPrimaryTouchStart}
        onPrimaryScroll={onPrimaryScroll}
        onPrimaryLayout={onPrimaryLayout}
        onPrimaryContentSizeChange={onPrimaryContentSizeChange}
        onPrimaryLoaded={onPrimaryLoaded}
        onPrimaryVerseTap={onPrimaryVerseTap}
        setPrimaryRef={setPrimaryRef}

        onSecondaryTouchStart={onSecondaryTouchStart}
        onSecondaryScroll={onSecondaryScroll}
        onSecondaryLayout={onSecondaryLayout}
        onSecondaryContentSizeChange={onSecondaryContentSizeChange}
        onSecondaryLoaded={onSecondaryLoaded}
        onSecondaryVerseTap={onSecondaryVerseTap}
        setSecondaryRef={setSecondaryRef}
      />
    )
  }

  return (
    <>
      <ScrollView
        style={[
          styles.container,
          (showingRecentBookmarks ? { marginBottom: 84 } : null),
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

const mapStateToProps = ({ passage, passageScrollY, recentPassages, recentSearches }) => ({
  passage,
  passageScrollY,
  recentPassages,
  recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
  setPassageScroll,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)