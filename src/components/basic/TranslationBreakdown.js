import React from "react"
import { View, StyleSheet } from "react-native"

import { memo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  container: {
    width: 120,
  },
})

const TranslationBreakdown = ({
  eva: { style: themedStyle={} },
}) => {

  return (
    <View
      style={[
        styles.container,
        themedStyle,
      ]}
    >


    </View>
  )

}

export default memo(TranslationBreakdown, { name: 'TranslationBreakdown' })