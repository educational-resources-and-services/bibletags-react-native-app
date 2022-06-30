import { useMemo } from 'react'
import { Text } from 'react-native'
import { getPassageStr } from "@bibletags/bibletags-ui-helper"
import { getRefFromLoc, getCorrespondingRefs } from '@bibletags/bibletags-versification'

import useEqualObjsMemo from '../../hooks/useEqualObjsMemo'
import { getOrigVersionInfo, getVersionInfo, memo } from '../../utils/toolbox'

const PassageRef = ({
  twoLines,
  fromLoc,
  toLoc,
  convertToVersionId,
  style,
  ...otherProps
 }) => {

  const version = getVersionInfo(convertToVersionId)

  const memoedOtherProps = useEqualObjsMemo(otherProps)

  const passageStr = useMemo(
    () => {
      let refs = memoedOtherProps.refs

      const getConvertedRefs = ({ ref }) => (
        getCorrespondingRefs({
          baseVersion: {
            ref,
            info: getOrigVersionInfo(),
          },
          lookupVersionInfo: version,
        })
      )

      if(fromLoc) {
        refs = [ getRefFromLoc(fromLoc) ]
        if(toLoc && toLoc !== fromLoc) {
          refs.push(getRefFromLoc(toLoc))
        }
      }

      if(convertToVersionId && version) {
        refs = refs.map((ref, idx) => getConvertedRefs({ ref }).at(idx === 0 ? 0 : -1))
      }

      const bookStrLength = getPassageStr({ refs: [{ bookId: refs[0].bookId }], ...memoedOtherProps }).length
      let passageStr = getPassageStr({ refs, ...memoedOtherProps })
      if(twoLines) {
        passageStr = `${passageStr.substr(0, bookStrLength).trim()}\n${passageStr.substr(bookStrLength).trim()}`
      }

      return passageStr

    },
    [ fromLoc, toLoc, convertToVersionId, twoLines, version, memoedOtherProps ],
  )

  return (
    <Text style={style}>
      {passageStr}
    </Text>
  )
}

export default memo(PassageRef, { name: 'PassageRef' })