import React from "react"
import { StyleSheet, ActivityIndicator, View, Text } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import { i18n } from "inline-i18n"

import { memoStyled } from "../../utils/toolbox"

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
})

const Spin = ({ 
  percentage,
  size="large",
  style,

  themedStyle,
}) => {

  if(percentage) {
    const percent = Math.floor(percentage)
    return (
      <View style={styles.container}>
        <AnimatedCircularProgress
          size={50}
          width={3}
          fill={percent}
          tintColor={themedStyle.color}
          backgroundColor={themedStyle.backgroundColor}
        >
          {fill => (
            <Text>
              {i18n("{{percent}}%", { percent })}
            </Text>
          )}
        </AnimatedCircularProgress>
      </View>
    )
  }
  
  return (
    <ActivityIndicator
      size={size}
      color={themedStyle.color}
      style={style}
    />
  )
}

export default memoStyled(Spin, 'Spin')