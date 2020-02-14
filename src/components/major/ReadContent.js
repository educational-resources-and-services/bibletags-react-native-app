import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import Constants from "expo-constants"
import { ScrollView, View, StyleSheet, Clipboard, Platform, I18nManager } from "react-native"
import { Toast } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { i18n } from "inline-i18n"
import { debounce, getVersionInfo, getOriginalVersionInfo } from "../../utils/toolbox.js"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering, getCorrespondingRefs } from 'bibletags-versification/src/versification'
import { useDimensions } from 'react-native-hooks'

import ReadText from './ReadText'
import TapOptions from '../basic/TapOptions'

import { setRef, setVersionId, setParallelVersionId, setPassageScroll } from "../../redux/actions"

const {
  DIVIDER_COLOR,
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
  page: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
  },
  lowLightPage: {
    backgroundColor: 'black',
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER_COLOR,
  },
  contrast: {
    backgroundColor: '#333333',
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
  displaySettings,

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

  const adjacentRefs = useMemo(
    () => {
      const versionInfo = getVersionInfo(versionId)
      const { bookId } = ref
      const bookIdsWithCorrectOrdering = getBookIdListWithCorrectOrdering({ versionInfo })

      const numChapters = getNumberOfChapters({
        versionInfo,
        bookId,
      }) || 0

      let previous = {
        ...ref,
        chapter: ref.chapter - 1,
      }

      let next = {
        ...ref,
        chapter: ref.chapter + 1,
      }

      if(ref.chapter <= 1) {
        const previousBookId = bookIdsWithCorrectOrdering[ bookIdsWithCorrectOrdering.indexOf(bookId) - 1 ]
        const numChaptersPreviousBook = getNumberOfChapters({
          versionInfo,
          bookId: previousBookId,
        }) || 0

        previous = {
          ...previous,
          chapter: numChaptersPreviousBook,
          bookId: previousBookId,
        }
      }

      if(ref.chapter >= numChapters) {
        const nextBookId = bookIdsWithCorrectOrdering[ bookIdsWithCorrectOrdering.indexOf(bookId) + 1 ]

        next = {
          ...next,
          chapter: 1,
          bookId: nextBookId,
        }
      }

      return {
        previous,
        next,
      }
    },
    [ ref ],
  )

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

  const { theme } = displaySettings

  const getPage = direction => {
    const pageRef = adjacentRefs[direction] || ref

    let correspondingRefs = [ pageRef ]
    const originalVersionInfo = getOriginalVersionInfo(pageRef.bookId)
    
    if(parallelVersionId && originalVersionInfo) {

      if(versionId !== originalVersionInfo.versionId) {
        correspondingRefs = getCorrespondingRefs({
          baseVersion: {
            info: getVersionInfo(versionId),
            ref: {
              ...pageRef,
              verse: 1,
            },
          },
          lookupVersionInfo: originalVersionInfo,
        }) || correspondingRefs
      }

      if(parallelVersionId !== originalVersionInfo.versionId) {
        correspondingRefs = getCorrespondingRefs({
          baseVersion: {
            info: originalVersionInfo,
            ref: correspondingRefs[0],
          },
          lookupVersionInfo: getVersionInfo(parallelVersionId),
        }) || correspondingRefs
      }

    }

    const parallelPageRef = correspondingRefs[0]

    return (
      <View
        key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
        style={[
          styles.page,
          (theme === 'low-light' ? styles.lowLightPage : null),
        ]}
      >
        <ReadText
          key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
          passageRef={pageRef}
          versionId={versionId}
          selectedVerse={
            selectedSection === 'primary'
              ? selectedVerse
              : (
                selectedSection === 'secondary'
                  ? -1
                  : null
              )
          }
          onTouchStart={!direction ? onPrimaryTouchStart : null}
          onTouchEnd={!direction ? onTouchEnd : null}
          onScroll={!direction ? onPrimaryScroll : null}
          onLayout={!direction ? onPrimaryLayout : null}
          onContentSizeChange={!direction ? onPrimaryContentSizeChange : null}
          onLoaded={!direction ? onPrimaryLoaded : null}
          onVerseTap={!direction ? onPrimaryVerseTap : null}
          setRef={!direction ? setPrimaryRef : null}
          isVisible={!direction}
        />
        {!!parallelVersionId &&
          <>
            <View
              style={[
                styles.divider,
                theme === 'high-contrast' ? styles.contrast : null,
              ]}
            />
            <ReadText
              key={`${parallelVersionId} ${parallelPageRef.bookId} ${parallelPageRef.chapter}`}
              passageRef={parallelPageRef}
              versionId={parallelVersionId}
              selectedVerse={
                selectedSection === 'secondary'
                  ? selectedVerse
                  : (
                    selectedSection === 'primary'
                      ? -1
                      : null
                  )
              }
              onTouchStart={!direction ? onSecondaryTouchStart : null}
              onTouchEnd={!direction ? onTouchEnd : null}
              onScroll={!direction ? onSecondaryScroll : null}
              onLayout={!direction ? onSecondaryLayout : null}
              onContentSizeChange={!direction ? onSecondaryContentSizeChange : null}
              onLoaded={!direction ? onSecondaryLoaded : null}
              onVerseTap={!direction ? onSecondaryVerseTap : null}
              setRef={!direction ? setSecondaryRef : null}
              isVisible={!direction}
            />
          </>
        }
      </View>
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

const mapStateToProps = ({ passage, passageScrollY, recentPassages, recentSearches, displaySettings }) => ({
  passage,
  passageScrollY,
  recentPassages,
  recentSearches,
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
  setPassageScroll,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)