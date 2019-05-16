import React from 'react'
import { StyleSheet, Animated } from 'react-native'
import { Container } from "native-base"

const styles = StyleSheet.create({
  animatedContainer: {
    zIndex: 10,
  },
})

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
          duration: 200,
        }
      ).start()
  
      return {
        revealAmount,
      }
    }

    return null
  }

  render() {
    let { style, children } = this.props
    let { translateYAnimation } = this.state

    return (
      <AnimatedContainer
        style={[
          styles.animatedContainer,
          style,
          {
            translateY: translateYAnimation,
          },
        ]}
      >
        {children}
      </AnimatedContainer>
    );
  }
}

export default RevealContainer