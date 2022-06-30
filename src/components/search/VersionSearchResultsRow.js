import { StyleSheet } from "react-native"
import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
  },
})

const VersionSearchResultsRow = ({
  id,
  name,
}) => {

  return (
    <View style={styles.container}>
      {name}
    </View>
  )
}

export default memo(VersionSearchResultsRow, { name: 'VersionSearchResultsRow' })