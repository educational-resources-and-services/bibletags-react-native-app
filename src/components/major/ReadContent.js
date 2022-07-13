import React, { useCallback, useEffect, useRef, useMemo, useState, useLayoutEffect } from "react"
import { FlatList, StyleSheet, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { useDimensions } from "@react-native-community/hooks"
import { useLayout } from '@react-native-community/hooks'
import { getNumberOfChapters } from "@bibletags/bibletags-versification"
import usePrevious from "react-use/lib/usePrevious"

import useBibleVersions from "../../hooks/useBibleVersions"
import useInstanceValue from "../../hooks/useInstanceValue"
import { equalObjs, getVersionInfo } from "../../utils/toolbox"

import ReadContentPage from "./ReadContentPage"

import { setRef, setVersionId, setParallelVersionId, removeParallelVersion } from "../../redux/actions"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

const viewabilityConfig = {
  minimumViewTime: 10,
  viewAreaCoveragePercentThreshold: 60,
  waitForInteraction: true,
}

const ReadContent = React.memo(({
  selectedData,
  setSelectedData,

  passage,
  myBibleVersions,

  setRef,
  setVersionId,
  setParallelVersionId,
  removeParallelVersion,
}) => {

  const { ref, versionId, parallelVersionId } = passage
  const getRef = useInstanceValue(ref)
  const lastSetRef = useRef(ref)
  const prevVersionId = usePrevious(versionId)

  useEffect(
    () => {
      // TODO: disabled until I get them scrolling together and work out how to do tagging
      if(parallelVersionId) removeParallelVersion()
    },
    [],
  )

  const getSelectedData = useInstanceValue(selectedData)

  const containerRef = useRef()

  const { width } = useDimensions().window
  const { onLayout, height } = useLayout()

  const [ initialScrollExecuted, setInitialScrollExecuted ] = useState(false)
  const getInitialScrollExecuted = useInstanceValue(initialScrollExecuted)

  const [ renderedBooksAndChapters, setRenderedBooksAndChapters ] = useState({})
  const setIsRendered = useCallback(
    ({ bookId, chapter, isRendered }) => {
      setRenderedBooksAndChapters(renderedBooksAndChapters => ({
        ...renderedBooksAndChapters,
        [`${bookId} ${chapter}`]: !!isRendered,
      }))
    },
    [],
  )

  const { downloadedPrimaryVersionIds, downloadedSecondaryVersionIds } = useBibleVersions({ myBibleVersions })

  const booksAndChapters = useMemo(
    () => {
      const versionInfo = getVersionInfo(versionId)
      return (
        Array(versionInfo.partialScope === 'ot' ? 39 : 66)
          .fill()
          .map((x, idx) => (
            versionInfo.partialScope === 'nt' && idx+1 < 40
              ? []
              : (
                Array(
                  getNumberOfChapters({
                    versionInfo,
                    bookId: idx + 1,
                  })
                ).fill().map((x, idx2) => ({
                  bookId: idx + 1,
                  chapter: idx2 + 1,
                }))
              )
          ))
          .flat()
      )
    },
    [ versionId ],
  )
  const getBooksAndChapters = useInstanceValue(booksAndChapters)

  const setContentOffset = useCallback(
    ({ afterTimeout }={}) => {
      const booksAndChapters = getBooksAndChapters()
      const ref = getRef()
      const scrollToIndex = booksAndChapters.findIndex(({ bookId, chapter }) => (bookId === ref.bookId && chapter === ref.chapter))
      if(scrollToIndex >= 0) {
        const doTheScroll = () => {
          containerRef.current.scrollToIndex({
            index: scrollToIndex,
            animated: false,
          })
        }
        if(afterTimeout) {
          setTimeout(doTheScroll)
        } else {
          doTheScroll()
        }
      }
    },
    [],
  )

  const onScroll = useCallback(
    () => {
      if((getSelectedData() || {}).selectedVerse !== undefined) {
        setSelectedData({})
      }
    },
    [],
  )

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if(viewableItems.length === 1 && getInitialScrollExecuted()) {

        const booksAndChapters = getBooksAndChapters()
        const ref = getRef()

        const { index } = viewableItems[0]
        const currentIndex = booksAndChapters.findIndex(({ bookId, chapter }) => (bookId === ref.bookId && chapter === ref.chapter))

        if(index !== currentIndex && booksAndChapters[index]) {
          lastSetRef.current = booksAndChapters[index]
          setRef({
            ref: booksAndChapters[index],
            wasSwipe: true,
          })
        }

      }
    },
    [],
  )

  const keyExtractor = useCallback(item => JSON.stringify(item), [])

  const getItemLayout = useCallback(
    (data, index) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [ width ],
  )

  const onLayoutAndSetInitialScrollIndex = useCallback(
    (...params) => {
      setContentOffset()
      setInitialScrollExecuted(true)
      onLayout(...params)
    },
    [ setContentOffset, onLayout ],
  )

  const onVerseTap = useCallback(
    ({ selectedSection, selectedVerse, selectedVerseUsfm, selectedTextContent, selectedInfo, pageX, pageY }={}) => {

      const currentSelectedData = getSelectedData()

      if(
        currentSelectedData.selectedSection
        && !(
          currentSelectedData.selectedSection === selectedSection
          && currentSelectedData.selectedVerse === selectedVerse
        )
      ) {
        setSelectedData({})
        return
      }

      if(selectedVerse == null) return

      setSelectedData({
        selectedSection,
        selectedVerse,
        selectedVerseUsfm,
        selectedTextContent,
        selectedTapX: pageX,
        selectedTapY: pageY,
        selectedInfo,
      })
    },
    [ setSelectedData ],
  )

  const currentIsRendered = !!renderedBooksAndChapters[`${passage.ref.bookId} ${passage.ref.chapter}`]
  const renderItem = useCallback(
    ({ item: ref }) => {

      const thisPagePassage = { versionId, parallelVersionId, ref }
      const isCurrentPassagePage = (
        ref.bookId === passage.ref.bookId
        && ref.chapter === passage.ref.chapter
      )

      if(!initialScrollExecuted) {
        return <View style={{ width, height }} />
      }

      return (
        <ReadContentPage
          key={JSON.stringify(thisPagePassage)}
          passage={thisPagePassage}
          isCurrentPassagePage={isCurrentPassagePage}
          {...(isCurrentPassagePage ? selectedData : {})}
          onVerseTap={onVerseTap}
          height={height}
          width={width}
          waitOnInitialRender={!isCurrentPassagePage && !currentIsRendered}
          setIsRendered={setIsRendered}
        />
      )
    },
    [ versionId, parallelVersionId, passage, selectedData, height, onVerseTap, width, initialScrollExecuted, setIsRendered, currentIsRendered ],
  )

  useEffect(
    () => {
      if(downloadedPrimaryVersionIds.length === 0) return

      // in the event that a version has been removed...

      if(!downloadedPrimaryVersionIds.includes(versionId)) {
        setVersionId({ versionId: downloadedPrimaryVersionIds[0] })
      }

      if(parallelVersionId && !downloadedSecondaryVersionIds.includes(parallelVersionId)) {
        setParallelVersionId({ parallelVersionId: downloadedSecondaryVersionIds[0] })
      }
    },
    [ downloadedPrimaryVersionIds.length === 0 ],
  )

  useLayoutEffect(
    () => {
      // update content offset if passage changed (except if it was a swipe)
      const partialScopeChanged = getVersionInfo(versionId).partialScope !== getVersionInfo(prevVersionId).partialScope
      if(!equalObjs(ref, lastSetRef.current) || partialScopeChanged) {
        lastSetRef.current = ref
        setContentOffset({ afterTimeout: partialScopeChanged })  // without this, the scroll doesn't work
      }
    },
    [ ref, versionId ],
  )

  if(downloadedPrimaryVersionIds.length === 0) return null

  return (
    <>
      <FlatList
        data={booksAndChapters}
        extraData={renderItem}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
        initialNumToRender={0}
        maxToRenderPerBatch={2}
        keyExtractor={keyExtractor}
        windowSize={3}
        style={styles.container}
        viewabilityConfig={viewabilityConfig}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        onLayout={initialScrollExecuted ? onLayout : onLayoutAndSetInitialScrollIndex}
        ref={containerRef}
      />
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
  removeParallelVersion,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)