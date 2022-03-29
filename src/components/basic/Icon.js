import React from "react"
import { StyleSheet } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
// import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome } from "@expo/vector-icons"

import { memo } from "../../utils/toolbox"

const packs = {
  ion: Ionicons,
  materialCommunity: MaterialCommunityIcons,
  // material: MaterialIcons,
  // fontAwesome: FontAwesome,
}

export let iconFonts = {}
Object.values(packs).map(({ font }) => {
  iconFonts = {
    ...iconFonts,
    ...font,
  }
})

const Icon = ({
  pack='ion',
  style,

  eva: { style: themedStyle={} },

  ...otherProps
}) => {

  const IconComponent = packs[pack]
  const adjustedStyle = { ...StyleSheet.flatten(style) }

  adjustedStyle.fontSize = adjustedStyle.height
  adjustedStyle.width = 'auto'
  adjustedStyle.height = 'auto'

  if(adjustedStyle.tintColor) {
    adjustedStyle.color = adjustedStyle.tintColor
    delete adjustedStyle.tintColor
  }

  return (
    <IconComponent
      style={[
        themedStyle,
        adjustedStyle,
      ]}
      {...otherProps}
    />
  )
}

export default memo(Icon, { name: 'Icon' })
