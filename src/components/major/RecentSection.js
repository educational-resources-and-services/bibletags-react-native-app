import React from "react"
import { View, StyleSheet } from "react-native"

import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    top: 'auto',
    height: 110,
    zIndex: 5,
  },
  faderLine: {
    height: 3,
    backgroundColor: 'white',
  },
  main: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'row',
  },
  refs: {
    marginLeft: 30,
    marginRight: 30,
    flexDirection: 'row',
  },
})

class RecentSection extends React.PureComponent {

  render() {
    // const { bookId, selected } = this.props

    const numFaderLines = 15
    const recentRefs = [
      {
        bookId: 21,
        chapter: 22,
      },
      {
        bookId: 5,
        chapter: 1,
      },
      {
        bookId: 10,
        chapter: 5,
      },
    ]

    return (
      <View
        style={[
          styles.container,
        ]}
      >
        {Array(numFaderLines).fill(0).map((x, idx) => (
          <View
            key={idx}
            style={[
              styles.faderLine,
              {
                opacity: 1 - Math.pow(((numFaderLines - idx) / (numFaderLines + 1)), 2),
              },
            ]}
          />
        ))}
        <View style={styles.main}>
          <View style={styles.refs}>
            {recentRefs.map(({ bookId, chapter }, idx) => (
              <RecentRef
                key={`${bookId} ${chapter}`}
                index={idx}
                bookId={bookId}
                chapter={chapter}
                selected={idx === 2}
              />
            ))}
          </View>
        </View>
      </View>
    )
  }
}

export default RecentSection