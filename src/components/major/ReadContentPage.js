import React, { useRef, useCallback, useState } from "react"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
// import { i18n } from "inline-i18n"
import { getCorrespondingRefs } from "bibletags-versification/src/versification"

import { getVersionInfo, getOriginalVersionInfo, memo } from "../../utils/toolbox"
import useAdjacentRefs from "../../hooks/useAdjacentRefs"
import { setPassageScroll } from "../../redux/actions"

import ReadText from "./ReadText"

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    },
  divider: {
    height: 1,
  },
})

const ReadContentPage = (({
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
  height,
  style,

  themedStyle,

  passageScrollY,

  setPassageScroll,
}) => {

  const [ focussedVerse, setFocussedVerse ] = useState(
    (
      !direction
      && passageScrollY
      && typeof passageScrollY === 'object'
      && passageScrollY.verse
    ) || undefined
  )

  const adjacentRefs = useAdjacentRefs(passage)

  const { ref, versionId, parallelVersionId } = passage
  const pageRef = adjacentRefs[direction] || ref

  const primaryRef = useRef()
  const secondaryRef = useRef()
  const primaryContentHeight = useRef(0)
  const secondaryContentHeight = useRef(0)
  const primaryHeight = useRef(0)
  const secondaryHeight = useRef(0)
  const numberOfVersesInPrimary = useRef(0)

  const onPrimaryTouchStart = useCallback(
    event => {
      event && setFocussedVerse()
      onTouchStart('primary')
    },
    [ onTouchStart ],
  )

  const onSecondaryTouchStart = useCallback(
    event => {
      event && setFocussedVerse()
      onTouchStart('secondary')
    },
    [ onTouchStart ],
  )

  const onPrimaryLayout = useCallback(
    ({ nativeEvent }) => {
      primaryHeight.current = nativeEvent.layout.height
      checkPrimaryLoaded()
    },
    [],
  )

  const onSecondaryLayout = useCallback(({ nativeEvent }) => secondaryHeight.current = nativeEvent.layout.height, [])

  const getScrollFactor = useCallback(
    () => {
      const primaryMaxScroll = Math.max(primaryContentHeight.current - height/2, 0)
      const secondaryMaxScroll = Math.max(secondaryContentHeight.current - height/2, 0)

      return primaryMaxScroll / secondaryMaxScroll
    },
    [ height ],
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

  const onPrimaryContentSizeChange = useCallback(
    (contentWidth, contentHeight) => {
      primaryContentHeight.current = contentHeight
      checkPrimaryLoaded()
    },
    [],
  )

  const onSecondaryContentSizeChange = useCallback(
    (contentWidth, contentHeight) => {
      secondaryContentHeight.current = contentHeight
      setUpParallelScroll()
    },
    [ setUpParallelScroll ],
  )

  const reportNumberOfVerses = useCallback(num => { numberOfVersesInPrimary.current = num }, [])

  const checkPrimaryLoaded = useCallback(
    () => {
      if(!(
        primaryHeight.current
        && primaryContentHeight.current
      )) return  // something is not ready yet

      if(Number.isInteger(passageScrollY)) {
        primaryScrollY.current = passageScrollY

      } else {
        const { verse } = passageScrollY || {}
        if(verse && numberOfVersesInPrimary.current) {
          const avgHeightPerVerse = parseInt(primaryContentHeight.current / numberOfVersesInPrimary.current, 10)
          const toMiddleAdjustment = parseInt((primaryHeight.current - avgHeightPerVerse) / 2, 10)
          const primaryMaxScroll = Math.max(primaryContentHeight.current - primaryHeight.current, 0)
          primaryScrollY.current = Math.max(0, Math.min(avgHeightPerVerse * (verse - 1) - toMiddleAdjustment, primaryMaxScroll))
        } else {
          primaryScrollY.current = 0
        }
      }

      const doInitialScroll = () => {
        if(primaryRef.current) {
          primaryRef.current.scrollTo({ y: primaryScrollY.current, animated: false })
        }
      }

      doInitialScroll
      setTimeout(doInitialScroll)  // may not fire without the setTimeout

      setUpParallelScroll()
      setPrimaryLoaded(true)
    },
    [ passageScrollY, setUpParallelScroll ],
  )

  const onSecondaryLoaded = useCallback(() => setSecondaryLoaded(true), [])

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

  return (
    <View
      style={styles.page}
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
        focussedVerse={focussedVerse}
        onTouchStart={!direction ? onPrimaryTouchStart : null}
        onTouchEnd={!direction ? onTouchEnd : null}
        onScroll={!direction ? onPrimaryScroll : null}
        onLayout={!direction ? onPrimaryLayout : null}
        height={parallelVersionId ? height/2 : height}
        onContentSizeChange={!direction ? onPrimaryContentSizeChange : null}
        onVerseTap={!direction ? onPrimaryVerseTap : null}
        forwardRef={!direction ? primaryRef : null}
        isVisible={!direction}
        reportNumberOfVerses={reportNumberOfVerses}
      />
      {!!parallelVersionId &&
        <>
          <View
            style={[
              styles.divider,
              themedStyle,
              style,
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
            focussedVerse={focussedVerse}
            onTouchStart={!direction ? onSecondaryTouchStart : null}
            onTouchEnd={!direction ? onTouchEnd : null}
            onScroll={!direction ? onSecondaryScroll : null}
            onLayout={!direction ? onSecondaryLayout : null}
            height={height/2}
            onContentSizeChange={!direction ? onSecondaryContentSizeChange : null}
            onLoaded={!direction ? onSecondaryLoaded : null}
            onVerseTap={!direction ? onSecondaryVerseTap : null}
            forwardRef={!direction ? secondaryRef : null}
            isVisible={!direction}
            isParallel={true}
          />
        </>
      }
    </View>
  )

})

const mapStateToProps = ({ passageScrollY }) => ({
  passageScrollY,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setPassageScroll,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(ReadContentPage), { name: 'ReadContentPage' })