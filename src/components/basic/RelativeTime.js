import React from 'react'
import { Text } from "react-native"
import moment from "moment"

class RelativeTime extends React.PureComponent {

  render() {
    const { time, ...otherProps } = this.props

    const fourHoursDifference = 1000 * 60 * 60 * 4
    let timeString
    
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
  }
}

export default RelativeTime