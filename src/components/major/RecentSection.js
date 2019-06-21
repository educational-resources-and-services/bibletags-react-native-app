import React from "react"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    top: 'auto',
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
    height: 75,
  },
  refs: {
    marginLeft: 30,
    marginRight: 20,
    flexDirection: 'row',
  },
  searches: {
    flexDirection: 'row',
  },
})

class RecentSection extends React.PureComponent {

  render() {
    const { passage, history, recentPassages, recentSearches, navigation } = this.props

    const numFaderLines = 15

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
            {recentPassages.map(historyIndex => {
              const passageRef = historyIndex === 'current' ? passage.ref : history[historyIndex].ref

              if(!passageRef) return null  // just in case

              return (
                <RecentRef
                  key={`${passageRef.bookId} ${passageRef.chapter}`}
                  passageRef={passageRef}
                  selected={historyIndex === 'current'}
                />
              )
            })}
          </View>
          <View style={styles.searches}>
            {recentSearches.map(historyIndex => {
              const recentSearch = history[historyIndex]

              if(!recentSearch) return null  // just in case

              const { searchString, versionId } = recentSearch

              return (
                <RecentSearch
                  key={`${searchString} ${versionId}`}
                  searchString={searchString}
                  versionId={versionId}
                  navigation={navigation}
                />
              )
            })}
          </View>
        </View>
      </View>
    )
  }
}

const mapStateToProps = ({ passage, history, recentPassages, recentSearches }) => ({
  passage,
  history,
  recentPassages,
  recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentSection)