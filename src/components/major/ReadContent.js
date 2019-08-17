import React from "react"
import Constants from "expo-constants"
import { ScrollView, View, StyleSheet, Dimensions, Clipboard, Platform } from "react-native"
import { Toast } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { RTL } from "../../../language.js"
import i18n from "../../utils/i18n.js"
import { debounce, getVersionInfo } from "../../utils/toolbox.js"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering } from 'bibletags-versification/src/versification'
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
})

class ReadContent extends React.PureComponent {

  state = {}

  static getDerivedStateFromProps(props, state) {
    const { passage } = props
    const { ref, versionId, parallelVersionId } = passage
    const statePassage = state.passage || {}

    if(passage === state.passage) return null

    const refChanged = ref !== statePassage.ref
    const primaryChanged = versionId !== statePassage.versionId
    const secondaryChanged = parallelVersionId !== statePassage.parallelVersionId

    const versionInfo = getVersionInfo(versionId)
    const bookIdsWithCorrectOrdering = getBookIdListWithCorrectOrdering({ versionInfo })
    const { bookId } = ref

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

    const adjacentRefs = (
      !refChanged
        ? state.adjacentRefs
        : {
          previous,
          next,
        }
    )

    return {
      primaryLoaded: !!(state.primaryLoaded && !refChanged && !primaryChanged),
      secondaryLoaded: !!(state.secondaryLoaded && !refChanged && !secondaryChanged),
      passage,
      adjacentRefs,
      selectedVerse: null,
      selectedSection: null,
      selectedTextContent: '',
      selectedTapX: 0,
      selectedTapY: 0,
    }
  }

  componentDidMount() {
    const { passage, setVersionId, setParallelVersionId } = this.props
    const { versionId, parallelVersionId } = passage

    // in the event that a version has been removed...

    if(!PRIMARY_VERSIONS.includes(versionId)) {
      setVersionId({ versionId: PRIMARY_VERSIONS[0] })
    }

    if(parallelVersionId && !SECONDARY_VERSIONS.includes(parallelVersionId)) {
      setParallelVersionId({ parallelVersionId: SECONDARY_VERSIONS[0] })
    }
  }

  setUpParallelScroll = () => {

    this.onPrimaryTouchStart()
    this.onPrimaryScroll({
      nativeEvent: {
        contentOffset: {
          y: this.primaryScrollY,
        }
      }
    })
  }

  hasParallel = () => !!this.props.passage.parallelVersionId

  getScrollFactor = () => {
    const primaryMaxScroll = Math.max(this.primaryContentHeight - this.primaryHeight, 0)
    const secondaryMaxScroll = Math.max(this.secondaryContentHeight - this.secondaryHeight, 0)

    return primaryMaxScroll / secondaryMaxScroll
  }

  clearSelection = () => {
    this.setState({
      selectedSection: null,
      selectedVerse: null,
      selectedTextContent: '',
    })
  }

  onPrimaryTouchStart = () => this.onTouchStart('primary')
  onSecondaryTouchStart = () => this.onTouchStart('secondary')

  onTouchStart = scrollController => {
    const { selectedSection } = this.state

    this.scrollController = scrollController

    if(selectedSection) {
      this.clearSelection()
      this.skipVerseTap = true
    }
  }

  onTouchEnd = () => delete this.skipVerseTap

  primaryScrollY = 0

  onPrimaryScroll = ({ nativeEvent }) => {
    const { setPassageScroll } = this.props
    this.primaryScrollY = nativeEvent.contentOffset.y

    setPassageScroll({
      y: this.primaryScrollY,
    })

    if(!this.secondaryRef) return
    if(this.scrollController !== 'primary') return
    if(!this.hasParallel()) return

    const y = this.primaryScrollY / this.getScrollFactor()
    this.secondaryRef.scrollTo({ y, animated: false })
  }

  onSecondaryScroll = ({ nativeEvent }) => {
    if(!this.primaryRef) return
    if(this.scrollController !== 'secondary') return
    if(!this.hasParallel()) return

    const y = nativeEvent.contentOffset.y * this.getScrollFactor()
    this.primaryRef.scrollTo({ y, animated: false })
  }

  onPrimaryLayout = ({ nativeEvent }) => this.primaryHeight = nativeEvent.layout.height
  onSecondaryLayout = ({ nativeEvent }) => this.secondaryHeight = nativeEvent.layout.height

  onPrimaryContentSizeChange = (contentWidth, contentHeight) => this.primaryContentHeight = contentHeight
  onSecondaryContentSizeChange = (contentWidth, contentHeight) => {
    this.secondaryContentHeight = contentHeight
    this.setUpParallelScroll()
  }

  onPrimaryLoaded = () => {
    const { passageScrollY } = this.props

    this.primaryRef.scrollTo({ y: passageScrollY, animated: false })
    this.primaryScrollY = passageScrollY

    this.setUpParallelScroll()

    this.setState({ primaryLoaded: true })
  }

  onSecondaryLoaded = () => this.setState({ secondaryLoaded: true })

  setPrimaryRef = ref => this.primaryRef = ref
  setSecondaryRef = ref => this.secondaryRef = ref

  setRef = ref => {
    this.ref = ref
    setTimeout(this.setContentOffset)
  }

  setContentOffset = () => {
    const { width } = Dimensions.get('window')
    this.ref.scrollTo({ x: width, animated: false })
  }

  onPageSwipeEnd = ({ nativeEvent }) => {
    const { setRef } = this.props
    const { adjacentRefs } = this.state

    const { x } = nativeEvent.contentOffset
    const { width } = Dimensions.get('window')

    if(x !== width) {
      let goPrev = x < width
      if(Platform.OS === 'android' && RTL) goPrev = !goPrev
      const ref = adjacentRefs[ goPrev ? 'previous' : 'next' ]

      if(!ref.bookId) {
        this.setContentOffset()
        return
      }

      debounce(
        setRef,
        {
          ref,
          wasSwipe: true,
        },
      )
      this.setContentOffset()
    }
  }


  onPrimaryVerseTap = ({ ...params }) => this.onVerseTap({ selectedSection: 'primary', ...params })
  onSecondaryVerseTap = ({ ...params }) => this.onVerseTap({ selectedSection: 'secondary', ...params })

  onVerseTap = ({ selectedSection, selectedVerse, selectedTextContent, pageX, pageY }) => {
    if(this.skipVerseTap) return
    if(selectedVerse == null) return

    this.setState({
      selectedSection,
      selectedVerse,
      selectedTextContent,
      selectedTapX: pageX,
      selectedTapY: pageY,
    })
  }

  tapOptions = [
    {
      label: i18n("Copy"),
      action: () => {
        const { selectedTextContent } = this.state

        Clipboard.setString(selectedTextContent)
        Toast.show({
          text: i18n("Verse copied to clipboard"),
          duration: 1700,
        })
        this.clearSelection()
      }
    },
  ]

  render() {
    const { passage, recentPassages, recentSearches, displaySettings } = this.props
    const { ref, versionId, parallelVersionId } = passage
    const { primaryLoaded, secondaryLoaded, adjacentRefs, selectedSection, selectedVerse,
            selectedTextContent, selectedTapX, selectedTapY } = this.state

    const showingRecentBookmarks = (recentPassages.length + recentSearches.length) !== 1

    const { theme } = displaySettings

    const { width, height } = Dimensions.get('window')

    const getPage = direction => {
      const pageRef = adjacentRefs[direction] || ref

      return (
        <View
          key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
          style={[
            styles.page,
            (theme === 'low-light' ? styles.lowLightPage : null ),
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
            onTouchStart={!direction ? this.onPrimaryTouchStart : null}
            onTouchEnd={!direction ? this.onTouchEnd : null}
            onScroll={!direction ? this.onPrimaryScroll : null}
            onLayout={!direction ? this.onPrimaryLayout : null}
            onContentSizeChange={!direction ? this.onPrimaryContentSizeChange : null}
            onLoaded={!direction ? this.onPrimaryLoaded : null}
            onVerseTap={!direction ? this.onPrimaryVerseTap : null}
            setRef={!direction ? this.setPrimaryRef : null}
          />
          {!!parallelVersionId &&
            <React.Fragment>
              <View style={styles.divider} />
              <ReadText
                key={`${parallelVersionId} ${pageRef.bookId} ${pageRef.chapter}`}
                passageRef={pageRef}
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
                onTouchStart={!direction ? this.onSecondaryTouchStart : null}
                onTouchEnd={!direction ? this.onTouchEnd : null}
                onScroll={!direction ? this.onSecondaryScroll : null}
                onLayout={!direction ? this.onSecondaryLayout : null}
                onContentSizeChange={!direction ? this.onSecondaryContentSizeChange : null}
                onLoaded={!direction ? this.onSecondaryLoaded : null}
                onVerseTap={!direction ? this.onSecondaryVerseTap : null}
                setRef={!direction ? this.setSecondaryRef : null}
              />
            </React.Fragment>
          }
        </View>
      )
    }

    return (
      <React.Fragment>
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
          ref={this.setRef}
          onMomentumScrollEnd={this.onPageSwipeEnd}
          //onContentSizeChange={this.setContentOffset}  // I might need this for device rotation
        >
          {[
            getPage('previous'),
            getPage(),
            getPage('next'),
          ]}
        </ScrollView>
        {!!selectedSection &&
          <TapOptions
            options={this.tapOptions}
            centerX={selectedTapX}
            bottomY={selectedTapY >= 150 ? (height - selectedTapY + 20) : null}
            topY={selectedTapY < 150 ? (selectedTapY + 40) : null}
          />
        }
      </React.Fragment>
    )
  }
}

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