import React from "react"

import { memo } from "../../utils/toolbox"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

import Icon from "./Icon"

const iconNameByStatus = {
  none: `close-box-outline`,
  automatch: `md-warning`,
  unconfirmed: `md-warning`,
  confirmed: `check-all`,
}

const StatusIcon = ({
  status='none',
  style,

  eva: { style: themedStyle={} },
}) => {

  const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const themedStyleByStatus = {
    none: altThemedStyleSets[0],
    automatch: altThemedStyleSets[1],
    unconfirmed: altThemedStyleSets[2],
    confirmed: altThemedStyleSets[3],
  }

  return (
    <Icon
      style={[
        themedStyleByStatus[status],
        style,
      ]}
      pack={[ 'none', 'confirmed' ].includes(status) ? "materialCommunity" : "ion"}
      name={iconNameByStatus[status]}
    />
  )
}

export default memo(StatusIcon, { name: 'StatusIcon' })
