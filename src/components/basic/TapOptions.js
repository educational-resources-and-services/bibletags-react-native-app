import React, { useState } from "react"
import { StyleSheet, Text, View, TouchableOpacity } from "react-native"
import { useDimensions } from 'react-native-hooks'

import useSetTimeout from "../../hooks/useSetTimeout"
import Icon from "./Icon"

const MAX_WIDTH_PER_BUTTON = 70

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttons: {
    backgroundColor: 'white',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#333333',
    padding: 12,
  },
  text: {
    color: 'white',
  },
  invisible: {
    color: '#333333',
  },
  resultIconView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  resultIconText: {
    textAlign: 'center',
  },
  resultIcon: {
    color: 'white',
    height: 18,
  },
})

const TapOptions = React.memo(({
  options,
  centerX,
  bottomY,
  topY,
}) => {

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
              <View style={styles.button}>
                <Text style={showResult ? styles.invisible : styles.text}>
                  {label}
                </Text>
                {showResult &&
                  <View style={styles.resultIconView}>
                    <Text style={styles.resultIconText}>
                      <Icon
                        style={styles.resultIcon}
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

})

export default TapOptions