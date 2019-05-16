import React from 'react'
import { StyleSheet, Animated } from 'react-native'
import { Container } from "native-base"

const styles = StyleSheet.create({
  animatedContainer: {
    zIndex: 10,
    elevation: 50,
  },
})

const AnimatedContainer = Animated.createAnimatedComponent(Container)

class RevealContainer extends React.Component {

  constructor(props) {
    super(props)

    const revealAmount = props.revealAmount || 0

    this.state = {
      translateYAnimation: new Animated.Value(revealAmount),
      scaleAnimation: new Animated.Value(revealAmount ? .95 : 1),
      revealAmount,
    }
  }

  static getDerivedStateFromProps(props, state) {
    const revealAmount = props.revealAmount || 0

    if(state.revealAmount !== revealAmount) {

      Animated.parallel([
        Animated.timing(
          state.translateYAnimation,
          {
            toValue: revealAmount,
            duration: 200,
          }
        ),
        Animated.timing(
          state.scaleAnimation,
          {
            toValue: revealAmount ? .95 : 1,
            duration: 200,
          }
        ),
      ]).start()
  
      return {
        revealAmount,
      }
    }

    return null
  }

  render() {
    let { style, children } = this.props
    let { translateYAnimation, scaleAnimation } = this.state

    return (
      <AnimatedContainer
        style={[
          styles.animatedContainer,
          style,
          {
            translateY: translateYAnimation,
            scaleX: scaleAnimation,
            scaleY: scaleAnimation,
          },
        ]}
      >
        {children}
      </AnimatedContainer>
    );
  }
}

export default RevealContainer