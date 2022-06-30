import { useEffect, useRef } from "react"
import { StyleSheet, ScrollView, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

import SearchTabSuggestion from "./SearchTabSuggestion"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 600,
  },
  none: {
    paddingTop: 100,
    textAlign: 'center',
  },
})

const SearchTabSuggestions = ({
  autoCompleteSuggestions,
  setSearchText,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)

  const ref = useRef()

  useEffect(
    () => {
      ref.current && ref.current.scrollTo()
    },
    [ autoCompleteSuggestions ],
  )

  if(autoCompleteSuggestions.length === 0) {
    return (
      <Text
        style={[
          styles.none,
          labelThemedStyle,
        ]}
      >
        {i18n("Begin typing to see suggestions.")}
      </Text>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      ref={ref}
    >
      {autoCompleteSuggestions.map(suggestion => (
        <SearchTabSuggestion
          key={JSON.stringify(suggestion)}
          suggestion={suggestion}
          setSearchText={setSearchText}
        />
      ))}
    </ScrollView>
  )
}

const mapStateToProps = () => ({
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(SearchTabSuggestions), { name: 'SearchTabSuggestions' })