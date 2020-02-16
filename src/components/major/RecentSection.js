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
  faderLineLowLight: {
    backgroundColor: 'black',
  },
  main: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'row',
    height: 75,
  },
  mainLowLight: {
    backgroundColor: 'black',
  },
  refs: {
    marginLeft: 30,
    marginRight: 25,
    flexDirection: 'row',
  },
  searches: {
    flexDirection: 'row',
  },
})

const RecentSection = React.memo(({
  passage,
  history,
  recentPassages,
  recentSearches,
  displaySettings,
}) => {

  const { theme } = displaySettings

  if(recentPassages.length + recentSearches.length === 1) return null

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
            (theme === 'low-light' ? styles.faderLineLowLight : null),
            {
              opacity: 1 - Math.pow(((numFaderLines - idx) / (numFaderLines + 1)), 2),
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.main,
          (theme === 'low-light' ? styles.mainLowLight : null),
        ]}
      >
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
              />
            )
          })}
        </View>
      </View>
    </View>
  )

})

const mapStateToProps = ({ passage, history, recentPassages, recentSearches, displaySettings }) => ({
  passage,
  history,
  recentPassages,
  recentSearches,
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentSection)