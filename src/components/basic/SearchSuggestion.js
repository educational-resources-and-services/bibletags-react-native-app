import React, { useCallback } from "react"
import { View, StyleSheet, Text, I18nManager, TouchableOpacity } from "react-native"
import { i18n } from "inline-i18n"
import { styled } from '@ui-kitten/components'

import { getVersionInfo, isRTLText } from '../../utils/toolbox.js'
import useRouterState from "../../hooks/useRouterState"

import RelativeTime from "./RelativeTime"

const styles = StyleSheet.create({
  container: {
    marginLeft: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
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
    fontSize: 13,
    textAlign: 'left',
  },
  time: {
    fontSize: 13,
  },
})

const SearchSuggestion = React.memo(({
  searchString,
  versionId,
  lastViewTime,
  numberResults,
  setEditing,
  updateEditedSearchString,
  style,

  themedStyle,
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
    <TouchableOpacity
      style={styles.container}
      button={true}
      onPress={goSearch}
    >
      <Text style={styles.searchString}>
        {I18nManager.isRTL ? `\u2067`: `\u2066`}
        {i18n("“{{searchString}}”", {
          searchString: isRTLText({ languageId, searchString }) ? `\u2067${searchString}\u2069` : `\u2066${searchString}\u2069`,
        })}
        {`  `}
        <Text style={styles.versionAbbr}>{abbr}</Text>
      </Text>
      <View style={styles.secondLine}>
        <View style={styles.subtitleView}>
          <Text
            style={styles.subtitle}
            style={[
              styles.subtitle,
              themedStyle,
              style,
            ]}
          >
          {i18n("{{num_results}} result(s)", { num_results: numberResults })}
        </Text>
        </View>
        <View>
          <RelativeTime
            style={styles.time}
            time={lastViewTime}
          />
        </View>
      </View>
    </TouchableOpacity>
  )

})

SearchSuggestion.styledComponentName = 'SearchSuggestion'

export default styled(SearchSuggestion)