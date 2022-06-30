import { StyleSheet } from "react-native"

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
    // color: ${({ theme }) => theme.palette.grey[500]};
    fontSize: 15,
    marginTop: 8,
    marginBottom: 5,
  },
})

const OtherSearchResultsHeader = ({
  children,
}) => {

  return (
    <View style={styles.container}>
      {children}
    </View>
  )
}

export default memo(OtherSearchResultsHeader, { name: 'OtherSearchResultsHeader' })