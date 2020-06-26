import React from "react"
import { Text } from "react-native"
import moment from "moment"
import { getLocale } from "inline-i18n"

const RelativeTime = React.memo(({
  time,
  ...otherProps
}) => {

  const fourHoursDifference = 1000 * 60 * 60 * 4
  let timeString

  moment.locale(getLocale())

  if(Math.abs(Date.now() - time) < fourHoursDifference) {
    timeString = moment(time).fromNow()
  } else {
    timeString = moment(time).calendar()
  }

  return (
    <Text {...otherProps}>
      {timeString}
    </Text>
  )

})

export default RelativeTime