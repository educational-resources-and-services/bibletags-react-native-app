import React from "react"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { memoStyled } from '../../utils/toolbox'

import RecentRef from "../basic/RecentRef"
import RecentSearch from "../basic/RecentSearch"

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    top: 'auto',
    height: 75,
    zIndex: 5,
    flexDirection: 'row',
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

const RecentSection = ({
  passage,
  history,
  recentPassages,
  recentSearches,
  style,

  themedStyle,
}) => {

  if(recentPassages.length + recentSearches.length <= 1) return null

  return (
    <View
      style={[
        styles.container,
        themedStyle,
        style,
    ]}
      pointerEvents='box-none'
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
              uiStatus={historyIndex === 'current' ? 'selected' : 'unselected'}
            />
          )
        })}
      </View>
      <View style={styles.searches}>
        {recentSearches.map(historyIndex => {
          const recentSearch = history[historyIndex]

          if(!recentSearch) return null  // just in case

          const { searchString, versionId, scrollInfo } = recentSearch

          return (
            <RecentSearch
              key={`${searchString} ${versionId}`}
              searchString={searchString}
              versionId={versionId}
              initialScrollInfo={scrollInfo}
            />
          )
        })}
      </View>
    </View>
  )

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

export default memoStyled(connect(mapStateToProps, matchDispatchToProps)(RecentSection), 'RecentSection')