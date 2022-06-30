import { StyleSheet } from "react-native"
import { i18n } from "inline-i18n"

import { memo } from '../../utils/toolbox'

import OtherSearchResultsHeader from './OtherSearchResultsHeader'
import VersionSearchResultsRow from './VersionSearchResultsRow'

const styles = StyleSheet.create({
  container: {
  },
})

const VersionSearchResults = ({
  count,
  versions,
}) => {

  return (
    <View style={styles.container}>
    
      <OtherSearchResultsHeader>
        {i18n("Bible Versions")}
      </OtherSearchResultsHeader>

      {versions.map(version => (
        <VersionSearchResultsRow
          {...version}
        />
      ))}

    </View>
  )
}

export default memo(VersionSearchResults, { name: 'VersionSearchResults' })