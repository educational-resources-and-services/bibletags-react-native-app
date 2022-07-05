import React from "react"
import { StyleSheet, Text, View } from "react-native"

import { memo } from "../../utils/toolbox"

import Spin from "../basic/Spin"

const styles = StyleSheet.create({
  downloading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginHorizontal: 40,
  },
  downloadingText: {
    fontSize: 10,
    textAlign: 'center',
  },
  spin: {
    height: 5,
    transform: [{
      scale: .5,
    }],
  },
})

const DrawerStatusItem = ({
  showSpinner,
  message,
  style,

  eva: { style: themedStyle={} },
}) => {


  return (
    <View style={styles.downloading}>
      <Text
        style={[
          styles.downloadingText,
          themedStyle,
          style,
        ]}
      >
        {showSpinner &&
          <Spin
            size="small"
            style={styles.spin}
          />
        }
        {message}
      </Text>
    </View>
  )

}

export default memo(DrawerStatusItem, { name: 'DrawerStatusItem' })
