import { StyleSheet, View } from "react-native"
import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

import OtherSearchResultsHeader from './OtherSearchResultsHeader'
import AppItemSearchResultsRow from './AppItemSearchResultsRow'

const styles = StyleSheet.create({
  container: {
  },
})

const AppItemSearchResults = ({
  suggestions,
}) => {

  return (
    <View style={styles.container}>
    
      <OtherSearchResultsHeader>
        {i18n("In The App")}
      </OtherSearchResultsHeader>

      {suggestions.map(suggestion => (
        <AppItemSearchResultsRow
          {...suggestion}
        />
      ))}

    </View>
  )
}

export default memo(AppItemSearchResults, { name: 'AppItemSearchResults' })