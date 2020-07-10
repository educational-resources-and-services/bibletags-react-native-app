import React from "react"
import { StyleSheet } from "react-native"
import { styled } from "@ui-kitten/components"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
// import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome } from "@expo/vector-icons"

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

  themedStyle,

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

Icon.styledComponentName = 'Icon'

export default styled(Icon)
