import React from "react"
import { Button, Text, View } from "native-base"
import { StyleSheet, ScrollView, FlatList } from "react-native"
import { Constants } from "expo"

import VersionChooser from "./VersionChooser"

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

const books = [
  {
    bookId: 1,
    numChapters: 50,
    label: "Genesis",
  },
  {
    bookId: 2,
    numChapters: 38,
    label: "Exodus",
  },
  {
    bookId: 3,
    numChapters: 50,
    label: "Leviticus",
  },
  {
    bookId: 4,
    numChapters: 50,
    label: "Numbers",
  },
  {
    bookId: 5,
    numChapters: 50,
    label: "Deuteronomy",
  },
]

class PassageChooser extends React.PureComponent {

  state = {}

  keyExtractor = ({ bookId }) => bookId.toString()

  renderItem = ({ item, index }) => {
    const { bookId, label } = item

    return (
      <View
        style={[
          styles.book,
          (label === 'Exodus' ? styles.bookSelected : null),
        ]}
      >
        <Text
          style={[
            styles.bookText,
            (label === 'Exodus' ? styles.bookTextSelected : null),
          ]}
        >{label}</Text>
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