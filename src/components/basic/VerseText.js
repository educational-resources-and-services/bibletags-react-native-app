import React, { useCallback } from "react"
import { Text } from "react-native"

import { memo } from "../../utils/toolbox"
// import detectChangingProps from "../../utils/detectChangingProps"

const VerseText = ({
  style,
  verseNumber,
  info,
  onPress,
  children,
}) => {

  const goPress = useCallback(
    ({ nativeEvent }) => {
      const { pageX, pageY } = nativeEvent
      const selectedVerse = verseNumber || (info ? -1 : null)

      onPress({
        selectedVerse,
        selectedInfo: info,
        pageX,
        pageY,
      })
    },
    [ onPress, verseNumber, info ],
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

// export default memo(detectChangingProps('VerseText', VerseText), { jsonMemoProps: [ 'style', 'info' ], memoPropMap: { textOpacityStyle: 'isVisible' } })
export default memo(VerseText, { jsonMemoProps: [ 'style', 'info' ] })