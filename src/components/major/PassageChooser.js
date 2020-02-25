import React, { useState, useCallback, useEffect, useRef } from "react"
import { StyleSheet, ScrollView, FlatList, Text, View } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering } from 'bibletags-versification/src/versification'
import { i18n } from "inline-i18n"

import { getVersionInfo } from "../../utils/toolbox"
import useBack from "../../hooks/useBack"
import useSetTimeout from "../../hooks/useSetTimeout"
import useMemoObject from "../../hooks/useMemoObject"
import useInstanceValue from '../../hooks/useInstanceValue'
import { setRef, setVersionId, setParallelVersionId, setMode } from "../../redux/actions.js"

import VersionChooser from "./VersionChooser"
import ChooserBook from "../basic/ChooserBook"
import ChooserChapter from "../basic/ChooserChapter"

const bookIdsPerVersion = {}
const numChaptersPerVersionAndBook = {}

const {
  BOOK_CHOOSER_BACKGROUND_COLOR,
  CHAPTER_CHOOSER_BACKGROUND_COLOR,
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
  VERSION_CHOOSER_BACKGROUND_COLOR,
  PARALLEL_VERSION_CHOOSER_BACKGROUND_COLOR,
  PARALLEL_LABEL_VERSION_CHOOSER_BACKGROUND_COLOR,
  CHOOSER_BOOK_LINE_HEIGHT,
} = Constants.manifest.extra

const SPACER_BEFORE_FIRST_BOOK = 5
const NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL = 10

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refChooser: {
    zIndex: 1,
    flexDirection: 'row',
    flex: 1,
    backgroundColor: CHAPTER_CHOOSER_BACKGROUND_COLOR,
  },
  spacerBeforeFirstBook: {
    height: SPACER_BEFORE_FIRST_BOOK,
  },
  bookList: {
    // borderRightWidth: 1,
    // borderRightColor: DIVIDER_COLOR,
    backgroundColor: BOOK_CHOOSER_BACKGROUND_COLOR,
  },
  chapterList: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    padding: 5,
  },
  versionChooserContainer: {
    flexDirection: 'row',
  },
  parallelLabelContainer: {
    backgroundColor: PARALLEL_LABEL_VERSION_CHOOSER_BACKGROUND_COLOR,
    width: 20,
  },
  parallelLabel: {
    position: 'absolute',
    transform: [
      { translateX: -15 },
      { translateY: 15 },
      { rotate: '-90deg' },
    ],
    fontSize: 10,
    width: 50,
    lineHeight: 20,
    textAlign: 'center',
    color: 'white',
  },
})

const PassageChooser = ({
  showing,
  paddingBottom,
  hidePassageChooser,
  goVersions,

  passage,
  mode,

  setRef,
  setVersionId,
  setParallelVersionId,
  setMode,
}) => {

  useBack(showing && hidePassageChooser)

  const [ bookId, setBookId ] = useState()
  const [ chapter, setChapter ] = useState()
  const [ bookChooserHeight, setBookChooserHeight ] = useState(0)
  const [ chapterChooserHeight, setChapterChooserHeight ] = useState(0)
  const [ chapterChooserScrollHeight, setChapterChooserScrollHeight ] = useState(0)

  const bookChooserRef = useRef()
  const chapterChooserRef = useRef()

  const [ setScrollTimeout ] = useSetTimeout()

  useEffect(
    () => {
      if(showing) {
        setBookId(passage.ref.bookId)
        setChapter(passage.ref.chapter)
      }
    }, 
    [ showing ],
  )

  useEffect(
    () => {
      // Put them in a timeout so that it doesn't jump when user is tapping a chooser change.
      setScrollTimeout(() => {
        scrollToChosenBook()()
        scrollToChosenChapter()()
      }, 500)
    }, 
    [ passage ],
  )

  const scrollToChosenBook = useInstanceValue(() => {
    const { bookId } = passage.ref

    let index = getBookIds().indexOf(bookId)
    if(index === -1) index = 0
    const maxScroll = CHOOSER_BOOK_LINE_HEIGHT * getBookIds().length - (bookChooserHeight - paddingBottom)
    const scrollAtIndex = CHOOSER_BOOK_LINE_HEIGHT * index
    const minOffset = scrollAtIndex - maxScroll

    bookChooserRef.current.scrollToIndex({
      animated: false,
      index,
      viewPosition: 0,
      viewOffset: Math.max(CHOOSER_BOOK_LINE_HEIGHT * Math.min(2.5, index), minOffset),
    })
  })

  const scrollToChosenChapter = useInstanceValue(() => {
    const { chapter } = passage.ref
    const maxScroll = chapterChooserScrollHeight - chapterChooserHeight
    const numChapters = getNumChapters()

    if(maxScroll <= 0) return
    
    if(chapter <= NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL) {
      chapterChooserRef.current.scrollTo({ y: 0, animated: false })

    } else if(chapter >= numChapters - NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL) {
      chapterChooserRef.current.scrollTo({ y: maxScroll, animated: false })

    } else {
      chapterChooserRef.current.scrollTo({
        y: ((chapter - 1 - NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL) / (getNumChapters() - 1 - NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL*2)) * maxScroll,
        animated: false,
      })
    }

  })

  const updateVersion = useCallback(
    versionId => {
      setVersionId({ versionId })

      if(versionId === passage.parallelVersionId && SECONDARY_VERSIONS.length > 1) {
        setParallelVersionId({
          parallelVersionId: (
            SECONDARY_VERSIONS.includes(passage.versionId)
              ? passage.versionId
              : SECONDARY_VERSIONS[
                SECONDARY_VERSIONS[0] !== versionId
                  ? 0
                  : 1
              ]
          ),
        })
      }

      hidePassageChooser()
    },
    [ setVersionId, setParallelVersionId, hidePassageChooser, passage ],
  )

  const updateParallelVersion = useCallback(
    parallelVersionId => {
      setMode({ mode: 'parallel' })
      setParallelVersionId({ parallelVersionId })

      if(parallelVersionId === passage.versionId && PRIMARY_VERSIONS.length > 1) {
        setVersionId({
          versionId: (
            PRIMARY_VERSIONS.includes(passage.parallelVersionId)
              ? passage.parallelVersionId
              : PRIMARY_VERSIONS[
                PRIMARY_VERSIONS[0] !== parallelVersionId
                  ? 0
                  : 1
              ]
          ),
        })
      }

      hidePassageChooser()
    },
    [ setVersionId, setParallelVersionId, setMode, hidePassageChooser, passage ],
  )

  const closeParallelMode = useCallback(
    () => {
      setMode({ mode: 'basic' })
      hidePassageChooser()
    },
    [ hidePassageChooser, setMode ],
  )

  const updateChapter = useCallback(
    chapter => {
      setChapter(chapter)

      setRef({
        ref: {
          bookId,
          chapter,
          scrollY: 0,
        },
      })

      hidePassageChooser()
    },
    [ setRef, hidePassageChooser, bookId ],
  )
  
  const updateBook = useCallback(
    bookId => {
      setBookId(bookId)
      setChapter(null)
    },
    [],
  )

  const getBookIds = () => {
    const { versionId } = passage

    if(!bookIdsPerVersion[versionId]) {
      const versionInfo = getVersionInfo(versionId)
      bookIdsPerVersion[versionId] = getBookIdListWithCorrectOrdering({ versionInfo })
    }

    return bookIdsPerVersion[versionId]
  }

  const keyExtractor = useCallback(bookId => bookId.toString(), [])

  const renderItem = useCallback(
    ({ item, index }) => (
      <>
        {index === 0 &&
          <View style={styles.spacerBeforeFirstBook} />
        }
        <ChooserBook
          bookId={item}
          uiStatus={item === bookId ? "selected" : "unselected"}
          onPress={updateBook}
        />
        {index === getBookIds().length - 1 &&
          <View
            style={{
              paddingBottom,
            }}
          />
        }
      </>
    ),
    [ paddingBottom, bookId ],
  )

  const getItemLayout = useCallback(
    (data, index) => ({
      length: CHOOSER_BOOK_LINE_HEIGHT,
      offset: CHOOSER_BOOK_LINE_HEIGHT * index + SPACER_BEFORE_FIRST_BOOK,
      index,
    }),
    [],
  )

  getNumChapters = () => {
    const { versionId } = passage
    const key = `${versionId}:${bookId}`

    if(!numChaptersPerVersionAndBook[key]) {
      const versionInfo = getVersionInfo(versionId)
      numChaptersPerVersionAndBook[key] = getNumberOfChapters({
        versionInfo,
        bookId,
      }) || 0
    }
    
    return numChaptersPerVersionAndBook[key]
  }

  const onBooksLayout = useCallback(({ nativeEvent: { layout: { height: bookChooserHeight }}}) => setBookChooserHeight(bookChooserHeight), [])
  const onChaptersLayout = useCallback(({ nativeEvent: { layout: { height: chapterChooserHeight }}}) => setChapterChooserHeight(chapterChooserHeight), [])
  const onChaptersContentSizeChange = useCallback((x, chapterChooserScrollHeight) => setChapterChooserScrollHeight(chapterChooserScrollHeight), [])


  const extraData = useMemoObject({
    bookId,
    chapter,
    bookChooserHeight,
    chapterChooserHeight,
    chapterChooserScrollHeight,
    paddingBottom,
  })

  // const showParallelVersionChooser = mode === 'parallel' && (PRIMARY_VERSIONS.length > 1 || SECONDARY_VERSIONS.length > 1)
  // const showVersionChooser = PRIMARY_VERSIONS.length > 1 || showParallelVersionChooser
  // const showParallelVersionChooser = mode === 'parallel' && SECONDARY_VERSIONS.length > 1
  // const showVersionChooser = PRIMARY_VERSIONS.length > 1
  const showVersionChooser = true

  return (
    <View style={styles.container}>
      {showVersionChooser &&
        <VersionChooser
          versionIds={PRIMARY_VERSIONS}
          update={updateVersion}
          selectedVersionId={passage.versionId}
          backgroundColor={VERSION_CHOOSER_BACKGROUND_COLOR}
          goVersions={goVersions}
        />
      }
      <View style={styles.versionChooserContainer}>
        <View style={styles.parallelLabelContainer}>
          <Text
            style={styles.parallelLabel}
            numberOfLines={1}
          >
            {i18n("Parallel")}
          </Text>
        </View>
        <VersionChooser
          versionIds={SECONDARY_VERSIONS}
          update={updateParallelVersion}
          selectedVersionId={mode === 'parallel' ? passage.parallelVersionId : null}
          backgroundColor={PARALLEL_VERSION_CHOOSER_BACKGROUND_COLOR}
          goVersions={goVersions}
          closeParallelMode={mode === 'parallel' ? closeParallelMode : null}
        />
      </View>
      <View
        style={styles.refChooser}
      >
        <View
          style={styles.bookList}
        >
          <FlatList
            data={getBookIds()}
            extraData={extraData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            ref={bookChooserRef}
            onLayout={onBooksLayout}
          />
        </View>
        <ScrollView
          ref={chapterChooserRef}
          onContentSizeChange={onChaptersContentSizeChange}
          onLayout={onChaptersLayout}
        >
          <View
            style={[
              styles.chapterList,
              {
                paddingBottom,
              },
            ]}
          >
            {Array(getNumChapters()).fill(0).map((x, idx) => (
              <ChooserChapter
                key={idx+1}
                chapter={idx+1}
                uiStatus={idx+1 === chapter ? "selected" : "unselected"}
                onPress={updateChapter}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  )

}

const mapStateToProps = ({ passage, displaySettings }) => ({
  passage,
  mode: displaySettings.mode,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
  setMode,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(PassageChooser)