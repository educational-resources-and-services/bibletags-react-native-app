import { StyleSheet, View, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { memo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

const SearchTabOriginalWord = ({
  eva: { style: themedStyle={} },
}) => {

  return (
    <View style={styles.container}>
      <Text>
        SearchTabOriginalWord
      </Text>
    </View>
  )
}

const mapStateToProps = () => ({
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(SearchTabOriginalWord), { name: 'SearchTabOriginalWord' })