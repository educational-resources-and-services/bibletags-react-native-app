import React, { useEffect, useRef, useMemo, useCallback } from "react"
import { StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback, Platform, Text, Animated, Easing } from "react-native"
import { Tooltip } from "@ui-kitten/components"
import { OverflowMenu } from "@ui-kitten/components"
import useToggle from "react-use/lib/useToggle"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { getVersionInfo, memo } from "../../utils/toolbox"

import Icon from "../basic/Icon"
import Spin from "../basic/Spin"

const styles = StyleSheet.create({
  version: {
    flex: 1,
  },
  abbr: {
    width: 75,
    paddingRight: 10,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  name: {
    textAlign: 'left',
    flex: 1,
    fontWeight: '300',
    fontSize: 13,
  },
  downloadedIcon: {
    height: 20,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  optionsIcon: {
    height: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginRight: -10,
  },
  container: {
    flexDirection: 'row',
    marginLeft: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  active: {
    shadowOffset: { width: 2, height: 2 },
    shadowColor: "black",
    shadowOpacity: 0.2,
  },
  spin: {
    marginVertical: 5,
    width: 30,
  },
})

const VersionItem = ({
  versionId,
  reorderable,
  reordering,
  active,
  options,
  downloading,
  downloaded,

  style,
  labelStyle,
  nameStyle,
  iconStyle,
  downloadedIconStyle,

  themedStyle,

  ...otherProps
}) => {

  const { baseThemedStyle, labelThemedStyle, iconThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ nameThemedStyle={}, downloadedIconThemedStyle={} ] = altThemedStyleSets

  const { name, abbr } = getVersionInfo(versionId)

  const [ menuOpen, toggleMenuOpen ] = useToggle()
  const [ showTooltip, toggleShowTooltip ] = useToggle()

  const animation = useRef(new Animated.Value(0))

  const sortStyle = useMemo(
    () => {
      if(!reorderable) return

      return {
        ...Platform.select({
          ios: {
            transform: [{
              scale: animation.current.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              }),
            }],
            shadowRadius: animation.current.interpolate({
              inputRange: [0, 1],
              outputRange: [2, 10],
            }),
          },

          android: {
            transform: [{
              scale: animation.current.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              }),
            }],
            elevation: animation.current.interpolate({
              inputRange: [0, 1],
              outputRange: [2, 6],
            }),
          },
        })
      }
    },
    [ reorderable ],
  )

  useEffect(
    () => {
      if(!reorderable) return

      Animated.timing(animation.current, {
        duration: 300,
        easing: Easing.bounce,
        toValue: Number(active),
        useNativeDriver: true,
      }).start()  
    },
    [ reorderable, active ],
  )

  const onOptionSelect = useCallback(
    idx => {
      toggleMenuOpen(false)
      options[idx].onPress()
    },
    [ options ],
  )

  const contents = (
    <View
      style={[
        styles.container,
        baseThemedStyle,
        style,
      ]}
    >
      <View style={styles.version}>
        <Text
          style={[
            styles.abbr,
            labelThemedStyle,
            labelStyle,
          ]}
        >
          {abbr}
        </Text>
        <Text style={[
          styles.name,
          nameThemedStyle,
          nameStyle,
        ]}>
          {name}
        </Text>
      </View>
      {downloading &&
        <View>
          <Spin
            style={styles.spin}
            size="small"
          />
        </View>
      }
      {downloaded &&
        <View>
          <Tooltip
            visible={showTooltip}
            text={i18n("Available offline")}
            onBackdropPress={toggleShowTooltip}
          >
            <TouchableWithoutFeedback
              onPress={toggleShowTooltip}
              disabled={reordering}
            >
              <Icon
                style={[
                  styles.downloadedIcon,
                  downloadedIconThemedStyle,
                  downloadedIconStyle,
                ]}
                name={"check-underline-circle"}
                pack="materialCommunity"
                uiStatus={reordering ? `disabled` : `unselected`}
              />
            </TouchableWithoutFeedback>
          </Tooltip>
        </View>
      }
      {(options || []).length > 0 &&
        <View>
          <OverflowMenu
            data={options}
            visible={menuOpen}
            onSelect={onOptionSelect}
            onBackdropPress={toggleMenuOpen}
          >
            <TouchableOpacity
              onPress={toggleMenuOpen}
              disabled={reordering}
            >
              <Icon
                style={[
                  styles.optionsIcon,
                  iconThemedStyle,
                  iconStyle,
                ]}
                name={"md-more"}
                uiStatus={reordering ? `disabled` : `unselected`}
              />
            </TouchableOpacity>
          </OverflowMenu>
        </View>
      }
    </View>
  )

  if(reorderable) {
    return (
      <Animated.View
        style={[
          active ? styles.active : null,
          sortStyle,
        ]}>
        {contents}
      </Animated.View>
    )
  }

  return (
    <TouchableOpacity
      {...otherProps}
    >
      {contents}
    </TouchableOpacity>
  )

}

export default memo(VersionItem, { name: 'VersionItem' })
