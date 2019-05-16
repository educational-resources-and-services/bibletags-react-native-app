import React from "react"
import { Button, Text, View } from "native-base"
import { StyleSheet, ScrollView, FlatList } from "react-native"
import { Constants } from "expo"

import VersionChooser from "./VersionChooser"
import { getBibleBookName } from "bibletags-ui-helper"

const {
  BOOK_CHOOSER_BACKGROUND_COLOR="#e9e9ef",
  CHAPTER_CHOOSER_BACKGROUND_COLOR="#f4f4f8",
  CHOOSER_SELECTED_BACKGROUND_COLOR="#3a3937",
  CHOOSER_SELECTED_TEXT_COLOR="white",
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  bookList: {
    // borderRightWidth: 1,
    // borderRightColor: DIVIDER_COLOR,
    backgroundColor: BOOK_CHOOSER_BACKGROUND_COLOR,
  },
  book: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  bookText: {
    lineHeight: 40,
  },
  bookSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  bookTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
  chapterList: {
    flex: 1,
    backgroundColor: CHAPTER_CHOOSER_BACKGROUND_COLOR,
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    padding: 5,
  },
  chapter: {
    width: 50,
    borderRadius: 25,
  },
  chapterText: {
    lineHeight: 50,
    textAlign: 'center',
  },
  chapterSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  chapterTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
})

// TODO: I need to get the book ordering per the head version (from bibletags-versification)
const books = Array(39).fill(0).map((x, idx) => idx+1)

class PassageChooser extends React.PureComponent {

  state = {}

  keyExtractor = bookId => bookId.toString()

  renderItem = ({ item: bookId, index }) => {
    return (
      <View
        style={[
          styles.book,
          (bookId === 2 ? styles.bookSelected : null),
        ]}
      >
        <Text
          style={[
            styles.bookText,
            (bookId === 2 ? styles.bookTextSelected : null),
          ]}
        >{getBibleBookName(bookId)}</Text>
      </View>
    )
  }

  render() {
    const { something } = this.props

    return (
      <View style={styles.container}>
        <View style={styles.bookList}>
          <FlatList
            data={books}
            extraData={this.state}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
          />
        </View>
        <ScrollView>
          <View style={styles.chapterList}>

            {/* TODO: I need to get the number of chapters per the head version (from bibletags-versification) */}

            {Array(50).fill(0).map((x, idx) => (
              <View
                key={idx}
                style={[
                  styles.chapter,
                  (idx+1 === 3 ? styles.chapterSelected : null),
                ]}
              >
                <Text
                  style={[
                    styles.chapterText,
                    (idx+1 === 3 ? styles.chapterTextSelected : null),
                  ]}
                >{idx+1}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }
}

export default PassageChooser