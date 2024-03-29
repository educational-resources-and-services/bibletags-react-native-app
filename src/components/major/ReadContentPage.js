import React, { useRef, useCallback, useState } from "react"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
// import { i18n } from "inline-i18n"
import { getCorrespondingRefs } from "@bibletags/bibletags-versification"

import { getVersionInfo, getOriginalVersionInfo, memo, readHeaderHeight, readHeaderMarginTop } from "../../utils/toolbox"
import useInstanceValue from "../../hooks/useInstanceValue"
import { setPassageScroll } from "../../redux/actions"

import ReadText from "./ReadText"

const styles = StyleSheet.create({
  page: {
    height: '100%',
  },
  divider: {
    height: 1,
  },
})

const ReadContentPage = (({
  passage,
  isCurrentPassagePage,
  selectedSection,
  selectedVerse,
  selectedInfo,
  selectedTagInfo,
  onVerseTap,
  width,
  height,
  style,
  waitOnInitialRender,
  setIsRendered,

  eva: { style: themedStyle={} },

  passageScrollY,

  setPassageScroll,
}) => {

  const [ focussedVerse, setFocussedVerse ] = useState(() => {
    const fVs = (
      isCurrentPassagePage
      && (passageScrollY || {}).verse
    )
    return (fVs || fVs === 0) ? fVs : undefined
  })

  const primaryScrollY = useRef(0)
  const scrollController = useRef('primary')

  const { ref, versionId, parallelVersionId } = passage

  const primaryRef = useRef()
  const secondaryRef = useRef()
  const primaryContentHeight = useRef(0)
  const secondaryContentHeight = useRef(0)
  const primaryHeight = useRef(0)
  const secondaryHeight = useRef(0)
  const numberOfVersesInPrimary = useRef(0)

  const heightPerVersion = parallelVersionId ? height/2 : height

  const onTouchStart = useCallback(scrollCntrlr => { scrollController.current = scrollCntrlr }, [])

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
      getCheckPrimaryLoaded()()
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

      // const offset = primaryScrollY.current / getScrollFactor()
      // secondaryRef.current.scrollToOffset({ offset, animated: false })
    }
    ,
    [ !parallelVersionId, getScrollFactor ],
  )

  const onSecondaryScroll = useCallback(
    ({ nativeEvent }) => {
      if(!primaryRef.current) return
      if(scrollController.current !== 'secondary') return
      if(!parallelVersionId) return

      // const offset = nativeEvent.contentOffset.y * getScrollFactor()
      // primaryRef.current.scrollToOffset({ offset, animated: false })
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
      getCheckPrimaryLoaded()()
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

  const getCheckPrimaryLoaded = useInstanceValue(
    () => {
      if(!(
        primaryHeight.current
        && primaryContentHeight.current
      )) return  // something is not ready yet

      if(Number.isInteger(passageScrollY)) {
        primaryScrollY.current = passageScrollY

      } else {
        const { verse } = passageScrollY || {}
        // replace this with actually getting the layout of the verse and putting it in the middle
        if(verse && numberOfVersesInPrimary.current) {
          const paddingBottom = heightPerVersion - (readHeaderMarginTop + readHeaderHeight) + 75
          const avgHeightPerVerse = parseInt((primaryContentHeight.current - paddingBottom) / numberOfVersesInPrimary.current, 10)
          const toMiddleAdjustment = parseInt((primaryHeight.current - avgHeightPerVerse) / 2, 10)
          const primaryMaxScroll = Math.max(primaryContentHeight.current - primaryHeight.current, 0)
          primaryScrollY.current = Math.max(0, Math.min(avgHeightPerVerse * (verse - 1) - toMiddleAdjustment, primaryMaxScroll))
        } else {
          primaryScrollY.current = 0
        }
      }

      const doInitialScroll = () => {
        if(primaryRef.current) {
          // primaryRef.current.scrollToOffset({ offset: primaryScrollY.current, animated: false })
        }
      }

      doInitialScroll
      setTimeout(doInitialScroll)  // may not fire without the setTimeout

      setUpParallelScroll()
    }
  )

  const onPrimaryVerseTap = useCallback(({ ...params }) => onVerseTap({ selectedSection: 'primary', ...params }), [ onVerseTap ])
  const onSecondaryVerseTap = useCallback(({ ...params }) => onVerseTap({ selectedSection: 'secondary', ...params }), [ onVerseTap ])

  let correspondingRefs = [ ref ]
  const originalVersionInfo = getOriginalVersionInfo(ref.bookId)
  
  if(parallelVersionId && originalVersionInfo) {

    if(versionId !== originalVersionInfo.id) {
      correspondingRefs = getCorrespondingRefs({
        baseVersion: {
          info: getVersionInfo(versionId),
          ref: {
            ...ref,
            verse: 1,
          },
        },
        lookupVersionInfo: originalVersionInfo,
      }) || correspondingRefs
    }

    if(parallelVersionId !== originalVersionInfo.id) {
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
      style={[
        styles.page,
        { width },
      ]}
    >
      <ReadText
        key={`${versionId} ${ref.bookId} ${ref.chapter}`}
        passageRef={ref}
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
        selectedInfo={selectedSection === 'primary' ? selectedInfo : null}
        selectedTagInfo={selectedSection === 'primary' ? selectedTagInfo : null}
        focussedVerse={focussedVerse}
        onTouchStart={isCurrentPassagePage ? onPrimaryTouchStart : null}
        onScroll={isCurrentPassagePage ? onPrimaryScroll : null}
        onLayout={onPrimaryLayout}
        height={heightPerVersion}
        onContentSizeChange={onPrimaryContentSizeChange}
        onVerseTap={isCurrentPassagePage ? onPrimaryVerseTap : null}
        forwardRef={primaryRef}
        isVisible={isCurrentPassagePage}
        reportNumberOfVerses={reportNumberOfVerses}
        waitOnInitialRender={waitOnInitialRender}
        setIsRendered={setIsRendered}
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
            selectedInfo={selectedSection === 'secondary' ? selectedInfo : null}
            selectedTagInfo={selectedSection === 'secondary' ? selectedTagInfo : null}
            focussedVerse={focussedVerse}
            onTouchStart={isCurrentPassagePage ? onSecondaryTouchStart : null}
            onScroll={isCurrentPassagePage ? onSecondaryScroll : null}
            onLayout={onSecondaryLayout}
            height={heightPerVersion}
            onContentSizeChange={onSecondaryContentSizeChange}
            onVerseTap={isCurrentPassagePage ? onSecondaryVerseTap : null}
            forwardRef={secondaryRef}
            isVisible={isCurrentPassagePage}
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