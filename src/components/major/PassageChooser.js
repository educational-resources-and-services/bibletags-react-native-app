import React from "react"
import { Button, Text, View } from "native-base"
import { StyleSheet, ScrollView, FlatList } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering } from 'bibletags-versification/src/versification'
import { getVersionInfo, setUpTimeout, unmountTimeouts } from "../../utils/toolbox"

import VersionChooser from "./VersionChooser"
import ChooserBook from "../basic/ChooserBook"
import ChooserChapter from "../basic/ChooserChapter"
import BackFunction from "../basic/BackFunction"

import { setRef, setVersionId, setParallelVersionId } from "../../redux/actions.js"

const {
  BOOK_CHOOSER_BACKGROUND_COLOR,
  CHAPTER_CHOOSER_BACKGROUND_COLOR,
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
  VERSION_CHOOSER_BACKGROUND_COLOR,
  PARALLEL_VERSION_CHOOSER_BACKGROUND_COLOR,
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
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    backgroundColor: CHAPTER_CHOOSER_BACKGROUND_COLOR,
  },
  refChooserLowLight: {
    backgroundColor: 'black',
  },
  spacerBeforeFirstBook: {
    height: SPACER_BEFORE_FIRST_BOOK,
  },
  bookList: {
    // borderRightWidth: 1,
    // borderRightColor: DIVIDER_COLOR,
    backgroundColor: BOOK_CHOOSER_BACKGROUND_COLOR,
  },
  bookListLowLight: {
    backgroundColor: 'rgba(48, 48, 48, 1)',
  },
  chapterList: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    padding: 5,
  },
})

class PassageChooser extends React.PureComponent {

  state = {
    bookChooserHeight: 0,
    chapterChooserHeight: 0,
    chapterChooserScrollHeight: 0,
  }

  static getDerivedStateFromProps(props, state) {
    const { showing, passage } = props
    const stateUpdate = { showing }

    if(showing && !state.showing) {
      stateUpdate.bookId = passage.ref.bookId
      stateUpdate.chapter = passage.ref.chapter
    }

    return stateUpdate
  }

  componentDidMount() {
    this.scrollToChosen()
  }

  componentDidUpdate(prevProps) {
    const { passage } = this.props

    if(prevProps.passage !== passage) {
      this.scrollToChosen()
    }
  }

  componentWillUnmount = unmountTimeouts

  scrollToChosen = () => {
    // Put them in a timeout so that it doesn't jump when user is tapping a chooser change.
    setUpTimeout(() => {
      this.scrollToChosenBook()
      this.scrollToChosenChapter()
    }, 500, this)
  }

  scrollToChosenBook = () => {
    const { passage, paddingBottom } = this.props
    const { bookChooserHeight } = this.state
    const { bookId } = passage.ref

    let index = this.getBookIds().indexOf(bookId)
    if(index === -1) index = 0
    const maxScroll = CHOOSER_BOOK_LINE_HEIGHT * this.getBookIds().length - (bookChooserHeight - paddingBottom)
    const scrollAtIndex = CHOOSER_BOOK_LINE_HEIGHT * index
    const minOffset = scrollAtIndex - maxScroll

    this.bookChooserRef.scrollToIndex({
      animated: false,
      index,
      viewPosition: 0,
      viewOffset: Math.max(CHOOSER_BOOK_LINE_HEIGHT * Math.min(2.5, index), minOffset),
    })
  }

  scrollToChosenChapter = () => {
    const { passage } = this.props
    const { chapterChooserHeight, chapterChooserScrollHeight } = this.state
    
    const { chapter } = passage.ref
    const maxScroll = chapterChooserScrollHeight - chapterChooserHeight
    const numChapters = this.getNumChapters()
    
    if(maxScroll <= 0) return
    
    if(chapter <= NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL) {
      this.chapterChooserRef.scrollTo({ y: 0, animated: false })

    } else if(chapter >= numChapters - NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL) {
      this.chapterChooserRef.scrollTo({ y: maxScroll, animated: false })

    } else {
      this.chapterChooserRef.scrollTo({
        y: ((chapter - 1 - NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL) / (this.getNumChapters() - 1 - NUM_CHAPTERS_TO_STICK_TO_MAX_SCROLL*2)) * maxScroll,
        animated: false,
      })
    }

  }

  updateVersion = versionId => {
    const { setVersionId, setParallelVersionId, hidePassageChooser, passage } = this.props

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
  }

  updateParallelVersion = parallelVersionId => {
    const { setVersionId, setParallelVersionId, hidePassageChooser, passage } = this.props

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
  }

  updateChapter = chapter => {
    const { setRef, hidePassageChooser } = this.props
    const { bookId } = this.state

    this.setState({ chapter })

    setRef({
      ref: {
        bookId,
        chapter,
        scrollY: 0,
      },
    })

    hidePassageChooser()
  }
  
  updateBook = bookId => this.setState({ bookId, chapter: null })

  bookIdsPerVersion = {}

  getBookIds = () => {
    const { passage } = this.props
    const { versionId } = passage

    if(!this.bookIdsPerVersion[versionId]) {

      const versionInfo = getVersionInfo(versionId)

      this.bookIdsPerVersion[versionId] = getBookIdListWithCorrectOrdering({ versionInfo })

    }
    
    return this.bookIdsPerVersion[versionId]
  }

  keyExtractor = bookId => bookId.toString()

  renderItem = ({ item, index }) => {
    const { paddingBottom } = this.props
    const { bookId } = this.state

    return (
      <React.Fragment>
        {index === 0 &&
          <View style={styles.spacerBeforeFirstBook} />
        }
        <ChooserBook
          bookId={item}
          selected={item === bookId}
          onPress={this.updateBook}
        />
        {index === this.getBookIds().length - 1 &&
          <View
            style={{
              paddingBottom,
            }}
          />
        }
      </React.Fragment>
    )
  }

  getItemLayout = (data, index) => ({
    length: CHOOSER_BOOK_LINE_HEIGHT,
    offset: CHOOSER_BOOK_LINE_HEIGHT * index + SPACER_BEFORE_FIRST_BOOK,
    index,
  })

  numChaptersPerVersionAndBook = {}

  getNumChapters = () => {
    const { passage } = this.props
    const { bookId } = this.state
    const { versionId } = passage

    const key = `${versionId}:${bookId}`

    if(!this.numChaptersPerVersionAndBook[key]) {

      const versionInfo = getVersionInfo(versionId)

      this.numChaptersPerVersionAndBook[key] = getNumberOfChapters({
        versionInfo,
        bookId,
      }) || 0

    }
    
    return this.numChaptersPerVersionAndBook[key]
  }

  setBookChooserRef = ref => this.bookChooserRef = ref
  setChapterChooserRef = ref => this.chapterChooserRef = ref

  onBooksLayout = ({ nativeEvent: { layout: { height: bookChooserHeight }}}) => this.setState({ bookChooserHeight })
  onChaptersLayout = ({ nativeEvent: { layout: { height: chapterChooserHeight }}}) => this.setState({ chapterChooserHeight })
  onChaptersContentSizeChange = (x, chapterChooserScrollHeight) => this.setState({ chapterChooserScrollHeight })

  render() {
    const { showing, paddingBottom, hidePassageChooser, passage, mode, goVersions, displaySettings } = this.props
    const { chapter } = this.state

    // const showParallelVersionChooser = mode === 'parallel' && (PRIMARY_VERSIONS.length > 1 || SECONDARY_VERSIONS.length > 1)
    // const showVersionChooser = PRIMARY_VERSIONS.length > 1 || showParallelVersionChooser
    // const showParallelVersionChooser = mode === 'parallel' && SECONDARY_VERSIONS.length > 1
    // const showVersionChooser = PRIMARY_VERSIONS.length > 1
    const showParallelVersionChooser = mode === 'parallel'
    const showVersionChooser = true

    return (
      <View style={styles.container}>
        {showing && <BackFunction func={hidePassageChooser} />}
        {showVersionChooser &&
          <VersionChooser
            versionIds={PRIMARY_VERSIONS}
            update={this.updateVersion}
            selectedVersionId={passage.versionId}
            backgroundColor={
              displaySettings.theme === 'low-light' 
              ? 
                'rgba(48, 48, 48, 1)'
              : 
                VERSION_CHOOSER_BACKGROUND_COLOR
            }
            goVersions={goVersions}
          />
        }
        {showParallelVersionChooser &&
          <VersionChooser
            versionIds={SECONDARY_VERSIONS}
            update={this.updateParallelVersion}
            selectedVersionId={passage.parallelVersionId}
            backgroundColor={
              displaySettings.theme === 'low-light' 
              ? 
                'rgba(79, 79, 79, 1)'
              : 
              PARALLEL_VERSION_CHOOSER_BACKGROUND_COLOR
            }
            goVersions={goVersions}
          />
        }
        <View
          style={[
              styles.refChooser,
              (displaySettings.theme === 'low-light' ? styles.refChooserLowLight : null),
          ]}
        >
          <View 
            style={[
              styles.bookList,
              (displaySettings.theme === 'low-light' ? styles.bookListLowLight : null),
            ]}
          >
            <FlatList
              data={this.getBookIds()}
              extraData={this.state}
              keyExtractor={this.keyExtractor}
              renderItem={this.renderItem}
              getItemLayout={this.getItemLayout}
              ref={this.setBookChooserRef}
              onLayout={this.onBooksLayout}
            />
          </View>
          <ScrollView
            ref={this.setChapterChooserRef}
            onContentSizeChange={this.onChaptersContentSizeChange}
            onLayout={this.onChaptersLayout}
          >
            <View
              style={[
                styles.chapterList,
                {
                  paddingBottom,
                },
              ]}
            >
              {Array(this.getNumChapters()).fill(0).map((x, idx) => (
                <ChooserChapter
                  key={idx+1}
                  chapter={idx+1}
                  selected={idx+1 === chapter}
                  onPress={this.updateChapter}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    )
  }
}

const mapStateToProps = ({ passage, displaySettings }) => ({
  passage,
  displaySettings,
  mode: displaySettings.mode,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(PassageChooser)