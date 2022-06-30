import { StyleSheet, View } from "react-native"
// import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
    minHeight: 400,
  },
})

const BibleSearchOtherSuggestedQueries = ({
  rowCountByBookId,
}) => {

  return (
    <View style={styles.container}>
    </View>
  )
}

export default memo(BibleSearchOtherSuggestedQueries, { name: 'BibleSearchOtherSuggestedQueries' })