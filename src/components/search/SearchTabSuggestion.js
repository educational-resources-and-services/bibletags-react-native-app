import { useCallback } from "react"
import { StyleSheet, Text, TouchableOpacity, Linking } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { memo, sentry } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useFormattedSearchValue from "../../hooks/useFormattedSearchValue"
import { setRef, setVersionId } from "../../redux/actions"

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 15,
    height: 40,
    justifyContent: 'center',
  },
})

const SearchTabSuggestion = ({
  suggestion,
  setSearchText,

  eva: { style: themedStyle={} },

  setRef,
  setVersionId,
}) => {

  const formattedValue = useFormattedSearchValue(suggestion)
  const { historyReplace, historyGoBack, historyPush } = useRouterState()

  const onPress = useCallback(
    () => {
      const { suggestedQuery, action, path, refs, versionId } = suggestion

      if(action) {
        historyGoBack()
        switch(action) {  // eslint-disable-line default-case
          case 'open': {
            historyPush(path)
            break
          }
          case 'open-new-tab': {
            Linking.openURL(url).catch(err => {
              sentry({ error })
              historyPush("/ErrorMessage", {
                message: i18n("Your device is not allowing us to open this link."),
              })
            })
            break
          }
          case 'read': {
            setRef({ ref: refs[0] })
            versionId && setVersionId({ versionId })
            break
          }
        }

      } else {
        setSearchText(suggestedQuery)
      }

    },
    [ suggestion, setSearchText ],
  )

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
    >
      <Text
        style={styles.suggestion}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formattedValue}
      </Text>
    </TouchableOpacity>
  )
}

const mapStateToProps = () => ({
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(SearchTabSuggestion), { name: 'SearchTabSuggestion' })