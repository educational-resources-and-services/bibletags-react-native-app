import { StyleSheet } from "react-native"
// import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
  },
})

const HelpItemSearchResultsRow = ({
  suggestedQuery,
  action,
}) => {

  return (
    <View style={styles.container}>
      {suggestedQuery}
    </View>
  )
}

export default memo(HelpItemSearchResultsRow, { name: 'HelpItemSearchResultsRow' })