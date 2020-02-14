import React, { useRef, useCallback } from "react"
import Constants from "expo-constants"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

// import { i18n } from "inline-i18n"
import { getVersionInfo, getOriginalVersionInfo } from "../../utils/toolbox.js"
import { getCorrespondingRefs } from 'bibletags-versification/src/versification'
import useAdjacentRefs from '../../hooks/useAdjacentRefs'

import ReadText from './ReadText'

import { setPassageScroll } from "../../redux/actions"

const {
  DIVIDER_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
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
})

const ReadContentPage = React.memo(({
  direction,
  passage,
  selectedSection,
  selectedVerse,
  onTouchEnd,
  onTouchStart,
  primaryScrollY,
  scrollController,
  setPrimaryLoaded,
  setSecondaryLoaded,
  onVerseTap,

  passageScrollY,
  displaySettings,

  setPassageScroll,
}) => {

  const adjacentRefs = useAdjacentRefs(passage)

  const { ref, versionId, parallelVersionId } = passage
  const pageRef = adjacentRefs[direction] || ref

  const primaryRef = useRef()
  const secondaryRef = useRef()
  const primaryContentHeight = useRef(0)
  const secondaryContentHeight = useRef(0)
  const primaryHeight = useRef(0)
  const secondaryHeight = useRef(0)

  const onPrimaryTouchStart = useCallback(() => onTouchStart('primary'), [ onTouchStart ])
  const onSecondaryTouchStart = useCallback(() => onTouchStart('secondary'), [ onTouchStart ])

  const onPrimaryLayout = useCallback(({ nativeEvent }) => primaryHeight.current = nativeEvent.layout.height, [])
  const onSecondaryLayout = useCallback(({ nativeEvent }) => secondaryHeight.current = nativeEvent.layout.height, [])

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
    [ !parallelVersionId, getScrollFactor ],
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

  const onPrimaryContentSizeChange = useCallback((contentWidth, contentHeight) => primaryContentHeight.current = contentHeight, [])
  const onSecondaryContentSizeChange = useCallback(
    (contentWidth, contentHeight) => {
      secondaryContentHeight.current = contentHeight
      setUpParallelScroll()
    },
    [ setUpParallelScroll ],
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

  const onPrimaryVerseTap = useCallback(({ ...params }) => onVerseTap({ selectedSection: 'primary', ...params }), [ onVerseTap ])
  const onSecondaryVerseTap = useCallback(({ ...params }) => onVerseTap({ selectedSection: 'secondary', ...params }), [ onVerseTap ])

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

  const { theme } = displaySettings

  return (
    <View
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

})

const mapStateToProps = ({ displaySettings, passageScrollY }) => ({
  displaySettings,
  passageScrollY,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setPassageScroll,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContentPage)