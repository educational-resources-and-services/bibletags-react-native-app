import React, { useCallback } from "react"
import { Text } from "react-native"

import { memo } from "../../utils/toolbox"
// import detectChangingProps from "../../utils/detectChangingProps"

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
      onPress={onPress ? goPress : null}
    >
      {children}
    </Text>
  )
 
}

// export default memo(detectChangingProps('VerseText', VerseText), { jsonMemoProps: [ 'style', 'wordInfo' ], memoPropMap: { textOpacityStyle: 'isVisible' } })
export default memo(VerseText, { jsonMemoProps: [ 'style', 'wordInfo' ] })