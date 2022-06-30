import { StyleSheet, Text, View } from "react-native"

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
  },
  searchResultsError: {
    fontSize: 17,
    // color: ${({ theme }) => theme.palette.grey[900]};
    fontWeight: '200',
    textAlign: 'center'
  },
})

const SearchResultsError = props => (
  <View style={styles.container}>
    <Text
      style={styles.searchResultsError}
      {...props}
    />
  </View>
)

export default memo(SearchResultsError, { name: 'SearchResultsError' })