import React, { useState } from "react"
import { StyleSheet, Text, View, TouchableOpacity } from "react-native"
import { useDimensions } from "@react-native-community/hooks"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useSetTimeout from "../../hooks/useSetTimeout"
import { memo } from '../../utils/toolbox'

import Icon from "./Icon"

const MAX_WIDTH_PER_BUTTON = 70

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttons: {
    backgroundColor: 'white', // do not put into custom mapping; is functional, not visual
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  button: {
    padding: 12,
  },
  resultIconView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  resultIconText: {
    textAlign: 'center',
  },
  resultIcon: {
    height: 18,
  },
})

const TapOptions = ({
  options,
  centerX,
  bottomY,
  topY,
  style,
  labelStyle,

  eva: { style: themedStyle={} },
}) => {
  
  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)
  const [ resultIconProps, setResultIconProps ] = useState()

  const [ setShowResultTimeout ] = useSetTimeout()

  const { width } = useDimensions().window
  const MAX_WIDTH = MAX_WIDTH_PER_BUTTON * options.length
  const sideBuffer = MAX_WIDTH/2 + 20

  const doAction = ({ action, index }) => () => {
    const { showResult, iconName="md-checkmark", iconPack, ms=500, onDone=()=>{} } = action() || {}

    if(showResult) {
      setResultIconProps({
        name: iconName,
        pack: iconPack,
        index,
      })
      onDone && setShowResultTimeout(onDone, ms)
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          marginLeft: MAX_WIDTH / -2,
          marginRight: MAX_WIDTH / -2,
          width: MAX_WIDTH,
          left: Math.min(Math.max(centerX, sideBuffer), width - sideBuffer),
        },
        bottomY != null ? { bottom: bottomY } : null,
        bottomY == null ? { top: topY } : null,
      ]}
    >
      <View style={styles.buttons}>
        {options.map(({ label, action }, index) => {

          const showResult = (resultIconProps || {}).index === index

          return (
            <TouchableOpacity
              onPress={!resultIconProps ? doAction({ action, index }) : null}
              key={label}
            >
              <View
                style={[
                  styles.button,
                  baseThemedStyle,
                  style,
                ]}
              >
                <Text style={showResult ? baseThemedStyle : labelThemedStyle}>
                  {label}
                </Text>
                {showResult &&
                  <View style={styles.resultIconView}>
                    <Text style={styles.resultIconText}>
                      <Icon
                        style={[
                          styles.resultIcon,
                          labelThemedStyle,
                          labelStyle,
                        ]}
                        {...resultIconProps}
                      />
                    </Text>
                  </View>
                }
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

}

export default memo(TapOptions, { name: 'TapOptions' })