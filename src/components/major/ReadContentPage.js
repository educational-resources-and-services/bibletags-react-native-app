import React from "react"
import Constants from "expo-constants"
import { View, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

// import { i18n } from "inline-i18n"
import { getVersionInfo, getOriginalVersionInfo } from "../../utils/toolbox.js"
import { getCorrespondingRefs } from 'bibletags-versification/src/versification'
import useAdjacentRefs from '../../hooks/useAdjacentRefs'

import ReadText from './ReadText'

const {
  DIVIDER_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
  },
  lowLightPage: {
    backgroundColor: 'black',
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER_COLOR,
  },
  contrast: {
    backgroundColor: '#333333',
  },
})

const ReadContentPage = React.memo(({
  direction,
  passage,
  selectedSection,
  selectedVerse,
  onTouchEnd,

  onPrimaryTouchStart,
  onPrimaryScroll,
  onPrimaryLayout,
  onPrimaryContentSizeChange,
  onPrimaryLoaded,
  onPrimaryVerseTap,
  setPrimaryRef,

  onSecondaryTouchStart,
  onSecondaryScroll,
  onSecondaryLayout,
  onSecondaryContentSizeChange,
  onSecondaryLoaded,
  onSecondaryVerseTap,
  setSecondaryRef,

  displaySettings,
}) => {

  const adjacentRefs = useAdjacentRefs(passage)

  const { ref, versionId, parallelVersionId } = passage
  const pageRef = adjacentRefs[direction] || ref

  let correspondingRefs = [ pageRef ]
  const originalVersionInfo = getOriginalVersionInfo(pageRef.bookId)
  
  if(parallelVersionId && originalVersionInfo) {

    if(versionId !== originalVersionInfo.versionId) {
      correspondingRefs = getCorrespondingRefs({
        baseVersion: {
          info: getVersionInfo(versionId),
          ref: {
            ...pageRef,
            verse: 1,
          },
        },
        lookupVersionInfo: originalVersionInfo,
      }) || correspondingRefs
    }

    if(parallelVersionId !== originalVersionInfo.versionId) {
      correspondingRefs = getCorrespondingRefs({
        baseVersion: {
          info: originalVersionInfo,
          ref: correspondingRefs[0],
        },
        lookupVersionInfo: getVersionInfo(parallelVersionId),
      }) || correspondingRefs
    }

  }

  const parallelPageRef = correspondingRefs[0]

  const { theme } = displaySettings

  return (
    <View
      style={[
        styles.page,
        (theme === 'low-light' ? styles.lowLightPage : null),
      ]}
    >
      <ReadText
        key={`${versionId} ${pageRef.bookId} ${pageRef.chapter}`}
        passageRef={pageRef}
        versionId={versionId}
        selectedVerse={
          selectedSection === 'primary'
            ? selectedVerse
            : (
              selectedSection === 'secondary'
                ? -1
                : null
            )
        }
        onTouchStart={!direction ? onPrimaryTouchStart : null}
        onTouchEnd={!direction ? onTouchEnd : null}
        onScroll={!direction ? onPrimaryScroll : null}
        onLayout={!direction ? onPrimaryLayout : null}
        onContentSizeChange={!direction ? onPrimaryContentSizeChange : null}
        onLoaded={!direction ? onPrimaryLoaded : null}
        onVerseTap={!direction ? onPrimaryVerseTap : null}
        setRef={!direction ? setPrimaryRef : null}
        isVisible={!direction}
      />
      {!!parallelVersionId &&
        <>
          <View
            style={[
              styles.divider,
              theme === 'high-contrast' ? styles.contrast : null,
            ]}
          />
          <ReadText
            key={`${parallelVersionId} ${parallelPageRef.bookId} ${parallelPageRef.chapter}`}
            passageRef={parallelPageRef}
            versionId={parallelVersionId}
            selectedVerse={
              selectedSection === 'secondary'
                ? selectedVerse
                : (
                  selectedSection === 'primary'
                    ? -1
                    : null
                )
            }
            onTouchStart={!direction ? onSecondaryTouchStart : null}
            onTouchEnd={!direction ? onTouchEnd : null}
            onScroll={!direction ? onSecondaryScroll : null}
            onLayout={!direction ? onSecondaryLayout : null}
            onContentSizeChange={!direction ? onSecondaryContentSizeChange : null}
            onLoaded={!direction ? onSecondaryLoaded : null}
            onVerseTap={!direction ? onSecondaryVerseTap : null}
            setRef={!direction ? setSecondaryRef : null}
            isVisible={!direction}
          />
        </>
      }
    </View>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadContentPage)