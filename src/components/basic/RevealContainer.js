import React from 'react'
import { Animated } from 'react-native'
import { Container } from "native-base"

const AnimatedContainer = Animated.createAnimatedComponent(Container)

class RevealContainer extends React.Component {

  constructor(props) {
    super(props)

    const revealAmount = props.revealAmount || 0

    this.state = {
      translateYAnimation: new Animated.Value(revealAmount),
      revealAmount,
    }
  }

  static getDerivedStateFromProps(props, state) {
    const revealAmount = props.revealAmount || 0

    if(state.revealAmount !== revealAmount) {

      Animated.timing(
        state.translateYAnimation,
        {
          toValue: revealAmount,
          duration: 180,
        }
      ).start()
  
      return {
        revealAmount,
      }
    }

    return null
  }

  render() {
    let { translateYAnimation } = this.state

    return (
      <AnimatedContainer
        style={{
          ...this.props.style,
          translateY: translateYAnimation,
        }}
      >
        {this.props.children}
      </AnimatedContainer>
    );
  }
}

export default RevealContainer