import { useMemo, useCallback } from "react"
import { isOriginalLanguageSearch } from "@bibletags/bibletags-ui-helper"

import bibleVersions from "../../versions"
import useEqualObjsMemo from "./useEqualObjsMemo"

const getVersion = id => (bibleVersions.filter(version => version.id === id)[0] || {})

const useBibleVersions = ({
  myBibleVersions,
  restrictToTestamentBookId,
  restrictToTestamentSearchText,
}) => {

  const restrictToTestament = useMemo(
    () => (
      restrictToTestamentBookId
        ? (
          restrictToTestamentBookId <= 39
            ? `ot`
            : `nt`
        )
        : (
          (
            isOriginalLanguageSearch(restrictToTestamentSearchText)
            && (
              (/#H/.test(restrictToTestamentSearchText) && `ot`)
              || (/#G/.test(restrictToTestamentSearchText) && `nt`)
            )
          )
          || null
        )
    ),
    [ restrictToTestamentBookId, restrictToTestamentSearchText ],
  )

  const versionIds = useEqualObjsMemo(
    () => (
      myBibleVersions
        .map(({ id }) => id)
        .filter(id => getVersion(id).id)
    ),
    [ myBibleVersions ],
  )

  const downloadingVersionIds = useEqualObjsMemo(
    () => (
      myBibleVersions
        .filter(({ downloaded }) => !downloaded)
        .map(({ id }) => id)
        .filter(id => getVersion(id).id)
    ),
    [ myBibleVersions ],
  )

  const searchDownloadingVersionIds = useEqualObjsMemo(
    () => (
      myBibleVersions
        .filter(({ downloaded, searchDownloaded }) => downloaded && !searchDownloaded)
        .map(({ id }) => id)
        .filter(id => getVersion(id).id)
    ),
    [ myBibleVersions ],
  )

  const downloadedVersionIds = useEqualObjsMemo(
    () => (
      myBibleVersions
        .filter(({ downloaded }) => downloaded)
        .map(({ id }) => id)
        .filter(id => {
          const version = getVersion(id)
          return (
            version.id
            && (
              !restrictToTestament
              || !version.partialScope
              || version.partialScope === restrictToTestament
            )
          )
        })
    ),
    [ myBibleVersions, restrictToTestament ],
  )

  const downloadedNonOriginalVersionIds = useEqualObjsMemo(
    () => (
      downloadedVersionIds
        .filter(id => id !== 'original')
    ),
    [ downloadedVersionIds ],
  )

  const downloadedPrimaryVersionIds = useEqualObjsMemo(
    () => (
      downloadedVersionIds
        .filter(id => getVersion(id).myVersionsRestriction !== 'secondary-only')
    ),
    [ downloadedVersionIds ],
  )

  const downloadedSecondaryVersionIds = useEqualObjsMemo(
    () => (
      downloadedVersionIds
        .filter(id => (
          !(  // If there is only one primary version, then don't show that version in the secondary options
            downloadedPrimaryVersionIds.length === 1
            && id === downloadedPrimaryVersionIds[0]
          )
          && getVersion(id).myVersionsRestriction !== 'primary-only'
        ))
    ),
    [ downloadedVersionIds, downloadedPrimaryVersionIds ],
  )

  const primaryVersionIds = useEqualObjsMemo(
    () => (
      versionIds
        .filter(id => getVersion(id).myVersionsRestriction !== 'secondary-only')
    ),
    [ versionIds ],
  )

  const secondaryVersionIds = useEqualObjsMemo(
    () => (
      versionIds
        .filter(id => (
          !(  // If there is only one primary version, then don't show that version in the secondary options
            downloadedPrimaryVersionIds.length === 1
            && id === downloadedPrimaryVersionIds[0]
          )
          && getVersion(id).myVersionsRestriction !== 'primary-only'
        ))
    ),
    [ versionIds, downloadedPrimaryVersionIds ],
  )

  const unusedVersionIds = useEqualObjsMemo(
    () => (
      bibleVersions
        .sort((a,b) => a.abbr < b.abbr ? -1 : 1)
        .map(({ id }) => id)
        .filter(id => !versionIds.includes(id))
    ),
    [ versionIds ],
  )

  const requiredVersionIds = useEqualObjsMemo(
    () => (
      bibleVersions
        .sort((a,b) => a.abbr < b.abbr ? -1 : 1)
        .filter(({ required }) => required)
        .map(({ id }) => id)
    ),
    [],
  )

  const languageIds = useEqualObjsMemo([
    ...new Set(
      versionIds.map(versionId => getVersion(versionId).languageId).filter(Boolean)
    )
  ])

  const getVersionStatus = useCallback(
    id => myBibleVersions.filter(version => version.id === id)[0],
    [ myBibleVersions ],
  )

  const getParallelIsAvailable = useCallback(
    ({ versionIdToRemove }={}) => {
      return false  // TODO: disabled until I get them scrolling together and work out how to do tagging

      const newPrimaryVersionIds = versionIdToRemove ? downloadedPrimaryVersionIds.filter(id => versionIdToRemove !== id) : downloadedPrimaryVersionIds
      const newSecondaryVersionIds = versionIdToRemove ? downloadedSecondaryVersionIds.filter(id => versionIdToRemove !== id) : downloadedSecondaryVersionIds

      return !(
        newSecondaryVersionIds.length === 0
        || (
          newPrimaryVersionIds.length === 1
          && newSecondaryVersionIds.length === 1
          && newPrimaryVersionIds[0] === newSecondaryVersionIds[0]
        )
      )
    },
    [ downloadedPrimaryVersionIds, downloadedSecondaryVersionIds ],
  )

  return {
    versionIds,
    languageIds,
    downloadingVersionIds,
    searchDownloadingVersionIds,
    downloadedVersionIds,
    downloadedNonOriginalVersionIds,
    versionsCurrentlyDownloading: versionIds.length > downloadedVersionIds.length,
    primaryVersionIds,
    secondaryVersionIds,
    downloadedPrimaryVersionIds,
    downloadedSecondaryVersionIds,
    unusedVersionIds,
    requiredVersionIds,
    getVersionStatus,
    getParallelIsAvailable,
  }
}

export default useBibleVersions
