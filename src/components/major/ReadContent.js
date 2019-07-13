import React from "react"
import { Constants } from "expo"
import { ScrollView, View, StyleSheet, Dimensions } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { debounce } from "../../utils/toolbox.js"
import ReadText from './ReadText'

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

    const adjacentRefs = (
      !refChanged
        ? state.adjacentRefs
        : {
          previous: {
            ...ref,
            chapter: ref.chapter - 1,
          },
          next: {
            ...ref,
            chapter: ref.chapter + 1,
          },
        }
    )

    return {
      primaryLoaded: !!(state.primaryLoaded && !refChanged && !primaryChanged),
      secondaryLoaded: !!(state.secondaryLoaded && !refChanged && !secondaryChanged),
      passage,
      adjacentRefs,
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

  onPrimaryTouchStart = () => this.scrollController = 'primary'
  onSecondaryTouchStart = () => this.scrollController = 'secondary'

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
      debounce(
        setRef,
        {
          ref: adjacentRefs[ x < width ? 'previous' : 'next' ],
          wasSwipe: true,
        },
      )
      this.setContentOffset()
    }
  }

  render() {
    const { passage, recentPassages, recentSearches } = this.props
    const { ref, versionId, parallelVersionId } = passage
    const { primaryLoaded, secondaryLoaded, adjacentRefs } = this.state

    const showingRecentBookmarks = (recentPassages.length + recentSearches.length) !== 1

    const { width } = Dimensions.get('window')

    const getPage = direction => {
      const pageRef = adjacentRefs[direction] || ref

      return (
        <View
          key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
          style={styles.page}
        >
          <ReadText
            key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
            passageRef={pageRef}
            versionId={versionId}
            onTouchStart={!direction ? this.onPrimaryTouchStart : null}
            onScroll={!direction ? this.onPrimaryScroll : null}
            onLayout={!direction ? this.onPrimaryLayout : null}
            onContentSizeChange={!direction ? this.onPrimaryContentSizeChange : null}
            onLoaded={!direction ? this.onPrimaryLoaded : null}
            setRef={!direction ? this.setPrimaryRef : null}
          />
          {!!parallelVersionId &&
            <React.Fragment>
              <View style={styles.divider} />
              <ReadText
                key={`${parallelVersionId} ${pageRef.bookId} ${pageRef.chapter}`}
                passageRef={pageRef}
                versionId={parallelVersionId}
                onTouchStart={!direction ? this.onSecondaryTouchStart : null}
                onScroll={!direction ? this.onSecondaryScroll : null}
                onLayout={!direction ? this.onSecondaryLayout : null}
                onContentSizeChange={!direction ? this.onSecondaryContentSizeChange : null}
                onLoaded={!direction ? this.onSecondaryLoaded : null}
                setRef={!direction ? this.setSecondaryRef : null}
              />
            </React.Fragment>
          }
        </View>
      )
    }

    return (
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
    )
  }
}

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