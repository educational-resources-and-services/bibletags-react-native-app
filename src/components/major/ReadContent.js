import React from "react"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import ReadText from './ReadText'

const styles = StyleSheet.create({
  container: {
  },
})

class ReadContent extends React.PureComponent {

  render() {
    const { passage } = this.props
    const { ref, versionId, parallelVersionId } = passage

    return (
      <View
        style={styles.container}
      >
        <ReadText
          key={`${versionId} ${ref.bookId} ${ref.chapter}`}
          passageRef={ref}
          versionId={versionId}
        />
      </View>
    )
  }
}

const mapStateToProps = ({ passage, history, recentPassages }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContent)