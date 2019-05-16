import React from "react"
import { Button, Text, View } from "native-base"
import { StyleSheet, ScrollView, FlatList } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import VersionChooser from "./VersionChooser"
import ChooserBook from "../basic/ChooserBook"
import ChooserChapter from "../basic/ChooserChapter"

import { setRef, setVersionId, setParallelVersionId } from "../../redux/actions.js"

const {
  BOOK_CHOOSER_BACKGROUND_COLOR,
  CHAPTER_CHOOSER_BACKGROUND_COLOR,
  PRIMARY_VERSIONS,
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

// TODO: I need to get the book ordering per the head version (from bibletags-versification)
const books = Array(39).fill(0).map((x, idx) => idx+1)
books.push('spacer')

class PassageChooser extends React.PureComponent {

  constructor(props) {
    super(props)

    const { passage: { ref: { bookId }} } = this.props

    this.state = {
      bookId,
    }
  }

  updateVersion = versionId => {
    const { setVersionId, hideShowPassageChooser } = this.props

    setVersionId({ versionId })
    hideShowPassageChooser()
  }

  updateParallelVersion = parallelVersionId => {
    const { setParallelVersionId, hideShowPassageChooser } = this.props

    setParallelVersionId({ parallelVersionId })
    hideShowPassageChooser()
  }

  updateChapter = chapter => {
    const { setRef, hideShowPassageChooser } = this.props
    const { bookId } = this.state

    setRef({
      ref: {
        bookId,
        chapter,
        scrollY: 0,
      },
    })

    hideShowPassageChooser()
  }
  
  updateBook = bookId => this.setState({ bookId })

  keyExtractor = bookId => bookId.toString()

  renderItem = ({ item, index }) => {
    const { paddingBottom } = this.props
    const { bookId } = this.state

    if(item === 'spacer') {
      return (
        <View
          style={{
            paddingBottom,
          }}
        />
      )
    }

    return (
      <ChooserBook
        bookId={item}
        selected={item === bookId}
        onPress={this.updateBook}
      />
    )
  }

  render() {
    const { passage, paddingBottom } = this.props

    return (
      <View style={styles.container}>
        <VersionChooser
          versionIds={PRIMARY_VERSIONS}
          update={this.updateVersion}
          selectedVersionId={passage.versionId}
        />
        <View style={styles.refChooser}>
          <View style={styles.bookList}>
            <FlatList
              data={books}
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

              {/* TODO: I need to get the number of chapters per the head version (from bibletags-versification) */}

              {Array(150).fill(0).map((x, idx) => (
                <ChooserChapter
                  key={idx+1}
                  chapter={idx+1}
                  selected={idx+1 === passage.ref.chapter}
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

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
  setParallelVersionId,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(PassageChooser)