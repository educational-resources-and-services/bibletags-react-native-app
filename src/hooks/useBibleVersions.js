import { useMemo, useCallback } from "react"

import bibleVersions from "../../versions"

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
        .filter(id => getVersion(id).myVersionsRestriction !== 'primary-only')
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

  const getVersionStatus = useCallback(
    id => myBibleVersions.filter(version => version.id === id)[0],
    [ myBibleVersions ],
  )

  return {
    versionIds,
    downloadedVersionIds,
    primaryVersionIds,
    secondaryVersionIds,
    unusedVersionIds,
    requiredVersionIds,
    getVersionStatus,
  }
}

export default useBibleVersions
