import React, { useCallback } from "react"
import { Text } from "react-native"

import { memo } from "../../utils/toolbox"
// import detectChangingProps from "../../utils/detectChangingProps"

const VerseText = ({
  style,
  verseNumber,
  info,
  onPress,
  onLongPress,
  children,
}) => {

  const goShortOrLongPress = useCallback(
    ({ onPressFunc, nativeEvent }) => {
      const { pageX, pageY } = nativeEvent
      const selectedVerse = verseNumber != null ? verseNumber : (info ? -1 : null)

      onPressFunc({
        selectedVerse,
        selectedInfo: info,
        pageX,
        pageY,
      })
    },
    [ verseNumber, info ],
  )

  const goPress = useCallback(
    ({ nativeEvent }) => goShortOrLongPress({ onPressFunc: onPress, nativeEvent }),
    [ onPress, goShortOrLongPress ],
  )

  const goLongPress = useCallback(
    ({ nativeEvent }) => goShortOrLongPress({ onPressFunc: onLongPress, nativeEvent }),
    [ onLongPress, goShortOrLongPress ],
  )

  return (
    <Text
      style={style}
      onPress={onPress ? goPress : null}
      onLongPress={onLongPress ? goLongPress : null}
    >
      {children}
    </Text>
  )
 
}

// export default memo(detectChangingProps('VerseText', VerseText), { jsonMemoProps: [ 'style', 'info' ], memoPropMap: { textOpacityStyle: 'isVisible' } })
export default memo(VerseText, { jsonMemoProps: [ 'style', 'info' ] })