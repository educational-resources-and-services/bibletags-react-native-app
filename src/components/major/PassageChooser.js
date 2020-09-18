import React, { useState, useCallback, useEffect, useRef } from "react"
import { StyleSheet, ScrollView, FlatList, Text, View, I18nManager } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering } from "bibletags-versification/src/versification"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useBibleVersions from "../../hooks/useBibleVersions"
import { getVersionInfo, isIPhoneX, memo } from "../../utils/toolbox"
import useBack from "../../hooks/useBack"
import useSetTimeout from "../../hooks/useSetTimeout"
import useMemoObject from "../../hooks/useMemoObject"
import useInstanceValue from "../../hooks/useInstanceValue"
import { setRef, setVersionId, setParallelVersionId, removeParallelVersion } from "../../redux/actions"

import VersionChooser from "./VersionChooser"
import ChooserBook from "../basic/ChooserBook"
import ChooserChapter from "../basic/ChooserChapter"

const bookIdsPerVersion = {}
const numChaptersPerVersionAndBook = {}

const SPACER_BEFORE_FIRST_BOOK = 5
const NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL = 10

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: isIPhoneX ? 26 : 0,
  },
  refChooser: {
    zIndex: 1,
    flexDirection: 'row',
    flex: 1,
  },
  spacerBeforeFirstBook: {
    height: SPACER_BEFORE_FIRST_BOOK,
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
    width: 20,
  },
  parallelLabel: {
    position: 'absolute',
    transform: [
      { translateX: I18nManager.isRTL ? 15 : -15 },
      { translateY: 15 },
      { rotate: I18nManager.isRTL ? '90deg' : '-90deg' },
    ],
    fontSize: 10,
    width: 50,
    lineHeight: 20,
    textAlign: 'center',
  },
})

const PassageChooser = ({
  showing,
  paddingBottom,
  hidePassageChooser,
  goVersions,
  style,
  labelStyle,
  bookListStyle,
  parallelLabelContainerStyle,

  themedStyle,

  passage,
  myBibleVersions,

  setRef,
  setVersionId,
  setParallelVersionId,
  removeParallelVersion,
}) => {

  useBack(showing && hidePassageChooser)

  const [ bookId, setBookId ] = useState()
  const [ chapter, setChapter ] = useState()
  const [ bookChooserHeight, setBookChooserHeight ] = useState(0)
  const [ chapterChooserHeight, setChapterChooserHeight ] = useState(0)

  const bookChooserRef = useRef()
  const chapterChooserRef = useRef()
  const chapterChooserScrollHeight = useRef(0)

  const { primaryVersionIds, secondaryVersionIds, getParallelIsAvailable } = useBibleVersions({ myBibleVersions })

  const [ setUpdatePassageInUITimeout ] = useSetTimeout()

  const { baseThemedStyle, labelThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ parallelLabelContainerThemedStyle={}, bookListThemedStyle={}, extras={} ] = altThemedStyleSets
  const chooserBookLineHeight = extras.bookLineHeight || 40

  useEffect(
    () => {
      setBookId(passage.ref.bookId)
      setChapter(passage.ref.chapter)
      setUpdatePassageInUITimeout(() => {
        scrollToChosenBook()()
        scrollToChosenChapter()()  // might not work if changing book and num chapters differs, but that's okay as it is called again by onChaptersContentSizeChange
      }, 300)
    },
    [ passage ],
  )

  const scrollToChosenBook = useInstanceValue(() => {
    let index = getBookIds().indexOf(bookId)
    if(index === -1) index = 0
    const maxScroll = chooserBookLineHeight * getBookIds().length - (bookChooserHeight - paddingBottom)
    const scrollAtIndex = chooserBookLineHeight * index
    const minOffset = scrollAtIndex - maxScroll

    bookChooserRef.current.scrollToIndex({
      animated: false,
      index,
      viewPosition: 0,
      viewOffset: Math.max(chooserBookLineHeight * Math.min(2.5, index), minOffset),
    })
  })

  const scrollToChosenChapter = useInstanceValue(() => {
    const maxScroll = chapterChooserScrollHeight.current - chapterChooserHeight
    const numChapters = getNumChapters()

    if(!chapter) {
      chapterChooserRef.current.scrollTo({ y: 0, animated: false })
    }

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

      if(versionId === passage.parallelVersionId && secondaryVersionIds.length > 1) {
        setParallelVersionId({
          parallelVersionId: (
            secondaryVersionIds.includes(passage.versionId)
              ? passage.versionId
              : secondaryVersionIds[
                secondaryVersionIds[0] !== versionId
                  ? 0
                  : 1
              ]
          ),
        })
      }

      hidePassageChooser()
    },
    [ hidePassageChooser, passage ],
  )

  const updateParallelVersion = useCallback(
    parallelVersionId => {
      setParallelVersionId({ parallelVersionId })

      if(parallelVersionId === passage.versionId && primaryVersionIds.length > 1) {
        setVersionId({
          versionId: (
            primaryVersionIds.includes(passage.parallelVersionId)
              ? passage.parallelVersionId
              : primaryVersionIds[
                primaryVersionIds[0] !== parallelVersionId
                  ? 0
                  : 1
              ]
          ),
        })
      }

      hidePassageChooser()
    },
    [ hidePassageChooser, passage ],
  )

  const closeParallelMode = useCallback(
    () => {
      removeParallelVersion()
      hidePassageChooser()
    },
    [ hidePassageChooser ],
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
    [ hidePassageChooser, bookId ],
  )
  
  const updateBook = useCallback(
    bookId => {
      setBookId(bookId)
      setChapter(null)
      chapterChooserRef.current.scrollTo({ y: 0, animated: false })  // might not work if changing book and num chapters differs, but that's okay as it is called again by onChaptersContentSizeChange
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
      length: chooserBookLineHeight,
      offset: chooserBookLineHeight * index + SPACER_BEFORE_FIRST_BOOK,
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
  const onChaptersContentSizeChange = useCallback(
    (x, chChooserScrollHt) => {
      chapterChooserScrollHeight.current = chChooserScrollHt
      scrollToChosenChapter()()
    },
    [],
  )

  const extraData = useMemoObject({
    bookId,
    paddingBottom,
  })

  const showVersionChooser = true

  return (
    <View style={styles.container}>
      {showVersionChooser &&
        <VersionChooser
          versionIds={primaryVersionIds}
          update={updateVersion}
          selectedVersionId={passage.versionId}
          type="primary"
          goVersions={goVersions}
        />
      }
      {getParallelIsAvailable() &&
        <View style={styles.versionChooserContainer}>
          <View 
            style={[
              styles.parallelLabelContainer,
              parallelLabelContainerThemedStyle,
              parallelLabelContainerStyle,
            ]}
          >
            <Text
              style={[
                styles.parallelLabel,
                labelThemedStyle,
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {i18n("Parallel")}
            </Text>
          </View>
          <VersionChooser
            versionIds={secondaryVersionIds}
            update={updateParallelVersion}
            selectedVersionId={passage.parallelVersionId}
            type="secondary"
            goVersions={goVersions}
            closeParallelMode={!!passage.parallelVersionId && closeParallelMode}
            hideEditVersions={true}
          />
        </View>
      }
      <View
        style={[
          styles.refChooser,
          baseThemedStyle,
          style,
        ]}
      >
        <View
          style={[
            bookListThemedStyle,
            bookListStyle,
          ]}
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

export default memo(connect(mapStateToProps, matchDispatchToProps)(PassageChooser), { name: 'PassageChooser' })