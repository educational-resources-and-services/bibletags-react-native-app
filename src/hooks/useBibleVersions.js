import { useMemo, useCallback } from "react"

import bibleVersions from "../../versions"
import useMemoObject from "./useMemoObject"

const getVersion = id => (bibleVersions.filter(version => version.id === id)[0] || {})

const useBibleVersions = ({ myBibleVersions }) => {

  const versionIds = useMemo(
    () => (
      myBibleVersions
        .map(({ id }) => id)
        .filter(id => getVersion(id).id)
    ),
    [ myBibleVersions ],
  )

  const downloadedVersionIds = useMemo(
    () => (
      myBibleVersions
        .filter(({ downloaded }) => downloaded)
        .map(({ id }) => id)
        .filter(id => getVersion(id).id)
    ),
    [ versionIds ],
  )

  const primaryVersionIds = useMemo(
    () => (
      downloadedVersionIds
      // versionIds  - change this once versions are available without being offline
        .filter(id => getVersion(id).myVersionsRestriction !== 'secondary-only')
    ),
    [ downloadedVersionIds, versionIds ],
  )

  const secondaryVersionIds = useMemo(
    () => (
      downloadedVersionIds
      // versionIds  - change this once versions are available without being offline
        .filter(id => (
          !(  // If there is only one primary version, then don't show that version in the secondary options
            primaryVersionIds.length === 1
            && id === primaryVersionIds[0]
          )
          && getVersion(id).myVersionsRestriction !== 'primary-only'
        ))
    ),
    [ downloadedVersionIds, versionIds ],
  )

  const unusedVersionIds = useMemo(
    () => (
      bibleVersions
        .map(({ id }) => id)
        .filter(id => !versionIds.includes(id))
    ),
    [ versionIds ],
  )

  const requiredVersionIds = useMemo(
    () => (
      bibleVersions
        .filter(({ required }) => required)
        .map(({ id }) => id)
    ),
    [],
  )

  const languageIds = useMemoObject([
    ...new Set(
      versionIds.map(({ languageId }) => languageId)
    )
  ])

  const getVersionStatus = useCallback(
    id => myBibleVersions.filter(version => version.id === id)[0],
    [ myBibleVersions ],
  )

  const getParallelIsAvailable = useCallback(
    ({ versionIdToRemove }={}) => {
      const newPrimaryVersionIds = versionIdToRemove ? primaryVersionIds.filter(id => versionIdToRemove !== id) : primaryVersionIds
      const newSecondaryVersionIds = versionIdToRemove ? secondaryVersionIds.filter(id => versionIdToRemove !== id) : secondaryVersionIds

      return !(
        newSecondaryVersionIds.length === 0
        || (
          newPrimaryVersionIds.length === 1
          && newSecondaryVersionIds.length === 1
          && newPrimaryVersionIds[0] === newSecondaryVersionIds[0]
        )
      )
    },
    [ primaryVersionIds, secondaryVersionIds ],
  )

  return {
    versionIds,
    languageIds,
    downloadedVersionIds,
    primaryVersionIds,
    secondaryVersionIds,
    unusedVersionIds,
    requiredVersionIds,
    getVersionStatus,
    getParallelIsAvailable,
  }
}

export default useBibleVersions
