import { useCallback } from 'react'
import { StyleSheet, Text, View } from "react-native"
import { i18n } from "inline-i18n"
import { getRefFromLoc } from '@bibletags/bibletags-versification'
import { isRTLText } from '@bibletags/bibletags-ui-helper'
import { Button } from '@ui-kitten/components'

import { memo } from '../../utils/toolbox'
import { setRef, setVersionId } from "../../redux/actions"

import PassageRef from '../basic/PassageRef'
import Verse from '../basic/Verse'

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,

    // :last-child {
    //   margin: 0;
    // }
  },
  passageRefAndVersionAbbrContainer: {
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  textContentContainer: {
    // direction: ${({ $isRTL }) => $isRTL ? "rtl" : "ltr"};
    alignSelf: 'flex-start',
  },
  passageRefContainer: {
    overflow: 'hidden',
    // whiteSpace: 'nowrap',
    // text-overflow: ellipsis;
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  versionAbbrs: {
    marginTop: 1,
    marginRight: 15,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 20,
  },
  button: {
    marginVertical: -3,
    paddingVertical: 2,
    paddingHorizontal: 12,
    minWidth: 0,
    fontSize: 12,
  },
})


const PassageSearchResultsRow = ({
  versionId,
  fromLoc,
  toLoc,
  closeAndClearSearch,

  eva: { style: themedStyle={} },

  setRef,
  setVersionId,

  ...otherProps
}) => {

  const { historyGoBack } = useRouterState()

  const { languageId, abbr } = getVersionInfo(versionId)

  // const [ ref, { width } ] = useMeasure()

  const { bookId } = getRefFromLoc(fromLoc)

  const goRead = useCallback(
    () => {
      const refs = [ getRefFromLoc(fromLoc) ]
      if(toLoc && toLoc !== fromLoc) {
        refs.push(getRefFromLoc(toLoc))
      }
      closeAndClearSearch()
      historyGoBack()
      setVersionId({ versionId })
      setRef({ ref: refs[0] })
    },
    [ fromLoc, toLoc, versionId, closeAndClearSearch ],
  )

  return (
    <View
      style={styles.container}
      // ref={ref}
    >

      <View style={styles.passageRefAndVersionAbbrContainer}>

        <View style={styles.passageRefContainer}>
          <PassageRef
            fromLoc={fromLoc}
            toLoc={toLoc}
          />
        </View>

        <Text style={styles.versionAbbrs}>
          {abbr}
        </Text>

        <Button
          style={styles.button}
          size="tiny"
          status="basic"
          onPress={goRead}
        >
          {i18n("Read")}
        </Button>

      </View>

      <View
        style={styles.textContentContainer}
        $isRTL={isRTLText({ languageId, bookId })}
      >
        <Verse
          versionId={versionId}
          // width={width}
          {...otherProps}
        />
      </View>

      {fromLoc.length === 5 &&
        <>
          {` `}
          {i18n("...", "ellipsis")}
        </>
      }

    </View>
  )
}

const mapStateToProps = () => ({
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(PassageSearchResultsRow), { name: 'PassageSearchResultsRow' })