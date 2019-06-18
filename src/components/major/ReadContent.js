import React from "react"
import { Constants } from "expo"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import ReadText from './ReadText'

const {
  DIVIDER_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER_COLOR,
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
        {!!parallelVersionId &&
          <React.Fragment>
            <View style={styles.divider} />
            <ReadText
              key={`${parallelVersionId} ${ref.bookId} ${ref.chapter}`}
              passageRef={ref}
              versionId={parallelVersionId}
            />
          </React.Fragment>
        }
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