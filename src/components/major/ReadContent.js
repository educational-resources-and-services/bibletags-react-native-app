import React from "react"
import { Constants } from "expo"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import ReadText from './ReadText'

const {
  DIVIDER_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER_COLOR,
  },
})

class ReadContent extends React.PureComponent {

  hasParallel = () => !!this.props.passage.parallelVersionId

  getScrollFactor = () => {
    const primaryMaxScroll = Math.max(this.primaryContentHeight - this.primaryHeight, 0)
    const secondaryMaxScroll = Math.max(this.secondaryContentHeight - this.secondaryHeight, 0)

    return primaryMaxScroll / secondaryMaxScroll
  }

  onPrimaryTouchStart = () => this.scrollController = 'primary'
  onSecondaryTouchStart = () => this.scrollController = 'secondary'

  onPrimaryScroll = ({ nativeEvent }) => {
    if(!this.secondaryRef) return
    if(this.scrollController !== 'primary') return
    if(!this.hasParallel()) return

    const y = nativeEvent.contentOffset.y / this.getScrollFactor()
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
  onSecondaryContentSizeChange = (contentWidth, contentHeight) => this.secondaryContentHeight = contentHeight

  setPrimaryRef = ref => this.primaryRef = ref
  setSecondaryRef = ref => this.secondaryRef = ref

  render() {
    const { passage, recentPassages, recentSearches } = this.props
    const { ref, versionId, parallelVersionId } = passage

    const showingRecentBookmarks = (recentPassages.length + recentSearches.length) !== 1

    return (
      <View
        style={[
          styles.container,
          (showingRecentBookmarks ? { paddingBottom: 84 } : null),
        ]}
      >
        <ReadText
          key={`${versionId} ${ref.bookId} ${ref.chapter}`}
          passageRef={ref}
          versionId={versionId}
          onTouchStart={this.onPrimaryTouchStart}
          onScroll={this.onPrimaryScroll}
          onLayout={this.onPrimaryLayout}
          onContentSizeChange={this.onPrimaryContentSizeChange}
          setRef={this.setPrimaryRef}
        />
        {!!parallelVersionId &&
          <React.Fragment>
            <View style={styles.divider} />
            <ReadText
              key={`${parallelVersionId} ${ref.bookId} ${ref.chapter}`}
              passageRef={ref}
              versionId={parallelVersionId}
              onTouchStart={this.onSecondaryTouchStart}
              onScroll={this.onSecondaryScroll}
              onLayout={this.onSecondaryLayout}
              onContentSizeChange={this.onSecondaryContentSizeChange}
              setRef={this.setSecondaryRef}
            />
          </React.Fragment>
        }
      </View>
    )
  }
}

const mapStateToProps = ({ passage, recentPassages, recentSearches }) => ({
  passage,
  recentPassages,
  recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)