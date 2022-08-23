import { StyleSheet, Text, View, TouchableOpacity } from "react-native"
import { useWindowDimensions } from 'react-native'

import { memo } from '../../utils/toolbox'
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

import Icon from "../basic/Icon"

const iconSize = 11

const expandIcon = {
  marginHorizontal: 10,
  top: 2,
  opacity: .7,
}

const styles = StyleSheet.create({
  accordion: {
  },
  summaryContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    paddingVertical: 4,
  },
  summary: {
    fontSize: 12,
  },
  expandIcon,
  contractIcon: {
    ...expandIcon,
    transform: [
      {
        translateY: -iconSize/8,
      },
      {
        rotate: '45deg',
      },
      {
        translateY: iconSize/8,
      },
    ],
  },
  details: {
    paddingLeft: 27,
  },
})

const SearchTabTipsDetailAccordion = ({
  summary,
  details,
  expanded,
  onPress,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle, iconThemedStyle } = useThemedStyleSets(themedStyle)

  const { fontScale } = useWindowDimensions()

  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        key={expanded ? `expanded` : ``}
        style={styles.summaryContainer}
        onPress={onPress}
      >
        <Icon
          style={[
            expanded ? styles.expandIcon : styles.contractIcon,
            { width: fontScale * iconSize, height: fontScale * iconSize },
            iconThemedStyle,
          ]}
          name="md-close"
        />
        <Text
          style={[
            styles.summary,
            labelThemedStyle,
          ]}>
          {summary}
        </Text>
      </TouchableOpacity>
      {!!expanded &&
        <View style={styles.details}>
          {details}
        </View>
      }
    </View>
  )
}

export default memo(SearchTabTipsDetailAccordion, { name: 'SearchTabTipsDetailAccordion' })