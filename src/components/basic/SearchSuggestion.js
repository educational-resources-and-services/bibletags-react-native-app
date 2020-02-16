import React, { useCallback } from "react"
import { View, StyleSheet, Text, I18nManager } from "react-native"
import { ListItem, Body } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { getVersionInfo, isRTLText } from '../../utils/toolbox.js'
import { i18n } from "inline-i18n"
import useRouterState from "../../hooks/useRouterState"

import RelativeTime from "./RelativeTime"

const styles = StyleSheet.create({
  searchString: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'left',
  },
  secondLine: {
    flexDirection: 'row',
    marginTop: 2,
  },
  versionAbbr: {
    fontWeight: '400',
    fontSize: 12,
  },
  subtitleView: {
    flex: 1,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, .6)',
    fontSize: 13,
    textAlign: 'left',
  },
  time: {
    fontSize: 13,
  },
  contrast: {
    color: 'black',
  },
  listItem: {
    marginLeft: 0,
    paddingLeft: 16,
  },
  listItemLowLight: {
    borderBottomColor: 'rgba(139, 139, 143, 1)',
    backgroundColor: 'black',
  },
  searchStringLowLight: {
    color: 'white',
  },
  subtitleLowLight: {
    color: 'rgba(145, 145, 145, 1)',
  },
  timeLowLight: {
    color: 'rgba(217, 217, 217, 1)',
  },
})

const SearchSuggestion = React.memo(({
  searchString,
  versionId,
  lastViewTime,
  numberResults,
  setEditing,
  updateEditedSearchString,

  displaySettings,
}) => {

  const { historyReplace, routerState } = useRouterState()

  const goSearch = useCallback(
    () => {
      updateEditedSearchString(searchString)
      setEditing(false)

      historyReplace(null, {
        ...routerState,
        searchString,
        versionId,
        editOnOpen: false,
      })
    },
    [ searchString, versionId, setEditing, updateEditedSearchString, routerState ],
  )

  const { abbr, languageId } = getVersionInfo(versionId)

  return (
    <ListItem
      style={[
        styles.listItem,
        displaySettings.theme === 'low-light' ? styles.listItemLowLight: null
      ]}
      button={true}
      onPress={goSearch}
    >
      <Body>
        <View>
          <Text 
            style={[
              styles.searchString,
              displaySettings.theme === 'low-light' ? styles.searchStringLowLight : null,
            ]}>
            {I18nManager.isRTL ? `\u2067`: `\u2066`}
            {i18n("“{{searchString}}”", {
              searchString: isRTLText({ languageId, searchString }) ? `\u2067${searchString}\u2069` : `\u2066${searchString}\u2069`,
            })}
            {`  `}
            <Text style={styles.versionAbbr}>{abbr}</Text>
          </Text>
        </View>
        <View 
          style={[
            styles.secondLine,
          ]}
        >
          <View style={styles.subtitleView}>
            <Text
              style={[
                styles.subtitle,
                displaySettings.theme === 'high-contrast' ? styles.contrast : null,
                displaySettings.theme === 'low-light' ? styles.subtitleLowLight : null,
              ]}
          >
            {i18n("{{num_results}} result(s)", { num_results: numberResults })}
          </Text>
          </View>
          <View>
            <RelativeTime
              style={[
                styles.time,
                displaySettings.theme === 'low-light' ? styles.timeLowLight : null,
              ]}
              time={lastViewTime}
            />
          </View>
        </View>
      </Body>
    </ListItem>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchSuggestion)