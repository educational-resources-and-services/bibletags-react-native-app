import React, { useCallback } from "react"
import { Text } from "react-native"

import { memo } from "../../utils/toolbox"

const VerseText = ({
  style,
  verseNumber,
  wordInfo,
  onPress,
  children,
}) => {

  const goPress = useCallback(
    ({ nativeEvent }) => {
      const { pageX, pageY } = nativeEvent
      onPress({
        selectedVerse: verseNumber,
        selectedWordInfo: wordInfo,
        pageX,
        pageY,
      })
    },
    [],
  )

  return (
    <Text
      style={style}
      onPress={goPress}
    >
      {children}
    </Text>
  )
 
}

export default memo(VerseText, { jsonMemoProps: [ 'style', 'wordInfo' ] })