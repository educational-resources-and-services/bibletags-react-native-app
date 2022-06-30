import { StyleSheet } from "react-native"
import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

import OtherSearchResultsHeader from './OtherSearchResultsHeader'
import HelpItemSearchResultsRow from './HelpItemSearchResultsRow'

const styles = StyleSheet.create({
  container: {
  },
})

const HelpItemSearchResults = ({
  suggestions,
}) => {

  return (
    <View style={styles.container}>
    
      <OtherSearchResultsHeader>
        {i18n("Help Topics")}
      </OtherSearchResultsHeader>

      {suggestions.map(suggestion => (
        <HelpItemSearchResultsRow
          {...suggestion}
        />
      ))}

    </View>
  )
}

export default memo(HelpItemSearchResults, { name: 'HelpItemSearchResults' })