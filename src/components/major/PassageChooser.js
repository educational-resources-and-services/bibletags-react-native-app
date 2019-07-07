import React from "react"
import { Button, Text, View } from "native-base"
import { StyleSheet, ScrollView, FlatList } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering } from 'bibletags-versification/src/versification'
import { getVersionInfo } from "../../utils/toolbox"

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
} = Constants.manifest.extra

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
  spacerBeforeFirstBook: {
    height: 5,
  },
  bookList: {
    // borderRightWidth: 1,
    // borderRightColor: DIVIDER_COLOR,
    backgroundColor: BOOK_CHOOSER_BACKGROUND_COLOR,
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

  state = {}

  static getDerivedStateFromProps(props, state) {
    const { showing, passage } = props
    const stateUpdate = { showing }

    if(showing && !state.showing) {
      stateUpdate.bookId = passage.ref.bookId
      stateUpdate.chapter = passage.ref.chapter
    }

    return stateUpdate
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

  render() {
    const { showing, paddingBottom, hidePassageChooser, passage, mode, goVersions } = this.props
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
            backgroundColor={VERSION_CHOOSER_BACKGROUND_COLOR}
            goVersions={goVersions}
          />
        }
        {showParallelVersionChooser &&
          <VersionChooser
            versionIds={SECONDARY_VERSIONS}
            update={this.updateParallelVersion}
            selectedVersionId={passage.parallelVersionId}
            backgroundColor={PARALLEL_VERSION_CHOOSER_BACKGROUND_COLOR}
            goVersions={goVersions}
          />
        }
        <View style={styles.refChooser}>
          <View style={styles.bookList}>
            <FlatList
              data={this.getBookIds()}
              extraData={this.state}
              keyExtractor={this.keyExtractor}
              renderItem={this.renderItem}
            />
          </View>
          <ScrollView>
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
  mode: displaySettings.mode,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(PassageChooser)