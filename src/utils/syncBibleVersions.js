import Constants from "expo-constants"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import CryptoJS from "react-native-crypto-js"
import NetInfo from "@react-native-community/netinfo"

import { getVersionInfo } from "./toolbox"

const {
  DEFAULT_BIBLE_VERSIONS=['original'],
  BIBLE_VERSIONS_FILE_SECRET="None",
  BASE_VERSIONS_URL="https://cdn.bibletags.org/tenants/EMBEDDING_APP_ID/RELEASE_CHANNEL/versions",
  EMBEDDING_APP_ID,
} = Constants.manifest.extra

const BASE_VERSIONS_URL_AFTER_SWAPS = (
  BASE_VERSIONS_URL
    .replace(/EMBEDDING_APP_ID/g, EMBEDDING_APP_ID)
    .replace(/RELEASE_CHANNEL/g, __DEV__ ? `dev` : Constants.manifest.releaseChannel)
)
const sqliteDir = `${FileSystem.documentDirectory}SQLite`

const noop = () => {}

const removeVersion = async ({ id, removeBibleVersion=noop }) => {
  const versionDir = `${sqliteDir}/${id}`
  const fileRevisionKey = `${id}RevisionNum`

  removeBibleVersion({ id })
  await AsyncStorage.removeItem(fileRevisionKey)
  await FileSystem.deleteAsync(versionDir, { idempotent: true })
}

let goRerun = noop
let isConnected = false
let maxConcurrentDownloads = 1  // TODO: use this variable
NetInfo.addEventListener(state => {
  isConnected = state.isConnected
  maxConcurrentDownloads = {
    "2g": 1,
    "3g": 2,
    "4g": 5,
  }[state.type === `cellular` && (state.details.cellularGeneration || '2g')] || 10
  goRerun()
})

let currentSyncProcessId = 0

const setUpVersion = async ({ id, setBibleVersionDownloadStatus=noop, versesDirOnly, thisSyncProcessId }) => {
  const versionInfo = getVersionInfo(id)

  const fileRevisionKey = `${id}RevisionNum`
  const versionRevisionNum = `${(versionInfo || {})[fileRevisionKey] || 0}`
  const fileRevisionBeingDownloadedKey = `${id}RevisionNumBeingDownloaded`
  const encrypted = !!(versionInfo || {}).encrypted
  const versionDir = `${sqliteDir}/${id}`
  const encryptedAddOn = encrypted ? `-encrypted` : ``
  const downloadingDir = `${versionDir}/downloading`
  const downloadedDir = `${versionDir}/downloaded`
  const readyDir = `${versionDir}/ready`

  let [ x, storedVersionRevisionNum, storedFileRevisionBeingDownloadedNum ] = await Promise.all([
    FileSystem.deleteAsync(downloadingDir, { idempotent: true }),  // remove /[version]/downloading if exists
    AsyncStorage.getItem(fileRevisionKey),
    AsyncStorage.getItem(fileRevisionBeingDownloadedKey),
  ])

  let unchangedBundledLocalUrisByPartialFilePath = {}
  if(storedVersionRevisionNum === versionRevisionNum) {
    ;(versionInfo.files || []).map(async (file, idx) => {
      if(file) {
        const { localUri, uri } = Asset.fromModule(file)
        const partialFilePath = uri.split(`/${id}${encryptedAddOn}/`)[1].replace(/\?.*$/, '')
        unchangedBundledLocalUrisByPartialFilePath[partialFilePath] = localUri
      }
    })
  }

  const prepForDownload = async () => {
    if(thisSyncProcessId !== currentSyncProcessId) return
    await Promise.all([
      // (async () => {
      //   if(!(await FileSystem.getInfoAsync(downloadingDir)).exists) {
      //     await FileSystem.makeDirectoryAsync(downloadingDir, { intermediates: true })
      //   }
      // })(),
      FileSystem.makeDirectoryAsync(`${downloadingDir}/verses`, { intermediates: true }),
      FileSystem.makeDirectoryAsync(`${downloadingDir}/search`, { intermediates: true }),
      FileSystem.makeDirectoryAsync(`${downloadedDir}/verses`, { intermediates: true }),
      FileSystem.makeDirectoryAsync(`${downloadedDir}/search`, { intermediates: true }),
      FileSystem.makeDirectoryAsync(readyDir, { intermediates: true }),
      AsyncStorage.setItem(fileRevisionBeingDownloadedKey, versionRevisionNum),
    ])
  }

  const downloadFiles = async ({ partialFilePaths }) => {

    const processingPromises = []

    const downloadedDirFilenames = (
      await Promise.all([
        FileSystem.readDirectoryAsync(downloadedDir),
        ...([ 'verses', 'search' ].map(async dir => {
          try {
            const downloadedSubdirFilenames = await FileSystem.readDirectoryAsync(`${downloadedDir}/${dir}`)
            return downloadedSubdirFilenames.map(subdir => `${dir}/${subdir}`)
          } catch (e) {
            return []
          }
        })),
      ])
    ).flat()

    // for each file not in /[version]/downloaded
    for(let partialFilePath of partialFilePaths) {

      if(thisSyncProcessId !== currentSyncProcessId) return
      if(downloadedDirFilenames.includes(partialFilePath)) continue

      const localUri = unchangedBundledLocalUrisByPartialFilePath[partialFilePath]
      const remoteUri = `${BASE_VERSIONS_URL_AFTER_SWAPS}/${id}${encryptedAddOn}/${partialFilePath}`
      const downloadingPath = `${downloadingDir}/${partialFilePath}`

      // download (or move if bundled) to /[version]/downloading
      if(localUri) {
        await FileSystem.copyAsync({
          from: localUri,
          to: downloadingPath,
        })
      } else {
        await FileSystem.downloadAsync(
          remoteUri,
          downloadingPath,
        )
      }

      if(thisSyncProcessId !== currentSyncProcessId) return

      // when complete, start processing this file while also moving on to download the next file
      processingPromises.push((async () => {

        const downloadedPath = `${downloadedDir}/${partialFilePath}`

        if(encrypted && /^verses\//.test(partialFilePath)) {

          // decrypt and move to /[version]/downloaded
          const encryptedContent = await FileSystem.readAsStringAsync(downloadingPath)
          const unencryptedBase64 = encryptedContent
            .split('\n')
            .map(slice => (
              slice.substring(0, 1) === '@'
                ? CryptoJS.AES.decrypt(slice.substring(1), BIBLE_VERSIONS_FILE_SECRET).toString(CryptoJS.enc.Utf8)
                : slice
            ))
            .join('')
          await Promise.all([
            FileSystem.deleteAsync(downloadingPath, { idempotent: true }),
            FileSystem.writeAsStringAsync(downloadedPath, unencryptedBase64, { encoding: FileSystem.EncodingType.Base64 }),
          ])

        } else {

          // simply move to /[version]/downloaded
          await FileSystem.moveAsync({
            from: downloadingPath,
            to: downloadedPath,
          })

        }

      })())

    }

    await Promise.all(processingPromises)

    if(thisSyncProcessId !== currentSyncProcessId) return

    // move from /[version]/downloaded to the /[version]/ready 
    const partialPathsToRemoveAndMove = [ ...new Set( partialFilePaths.map(partialFilePath => partialFilePath.split('/')[0] ) ) ]
    await Promise.all(partialPathsToRemoveAndMove.map(async partialPath => {
      const downloadedPath = `${downloadedDir}/${partialPath}`
      const readyPath = `${readyDir}/${partialPath}`
      await FileSystem.deleteAsync(readyPath, { idempotent: true })
      await FileSystem.moveAsync({
        from: downloadedPath,
        to: readyPath,
      })
    }))

  }

  if(thisSyncProcessId !== currentSyncProcessId) return

  // remove /[version]/downloaded if exists and not the right storedFileRevisionBeingDownloadedNum
  if(storedFileRevisionBeingDownloadedNum && versionRevisionNum !== storedFileRevisionBeingDownloadedNum) {
    await FileSystem.deleteAsync(downloadedDir, { idempotent: true })
  }

  if(thisSyncProcessId !== currentSyncProcessId) return

  // if not right storedVersionRevisionNum, then the /verses dir needs to be downloaded
  if(versionRevisionNum !== storedVersionRevisionNum) {

    setBibleVersionDownloadStatus({ id, searchDownloaded: false })  // necessary in case this is an update
    await Promise.all([
      FileSystem.deleteAsync(`${readyDir}/search`, { idempotent: true }),
      prepForDownload(),
    ])

    // download files for /verses + definitions.db
    await downloadFiles({
      partialFilePaths: [
        ...Array(66).fill().map((x, idx) => `verses/${idx+1}.db`),
        ...(
          id === 'original'
            ? [ 'definitions.db' ]
            : []
        ),
      ],
    })

    if(thisSyncProcessId !== currentSyncProcessId) return

    await AsyncStorage.setItem(fileRevisionKey, versionRevisionNum)
    setBibleVersionDownloadStatus({ id, downloaded: true })

  }

  if(thisSyncProcessId !== currentSyncProcessId) return

  // if no /[version]/ready/search dir, then the /search dir needs to be downloaded
  if(!versesDirOnly && !(await FileSystem.getInfoAsync(`${readyDir}/search`)).exists) {

    await prepForDownload()

    // download files for /search
    await downloadFiles({
      partialFilePaths: (
        id === 'original'
          ? [

            `search/uhbUnitWords-aspect.db`,
            `search/uhbUnitWords-b.db`,
            `search/uhbUnitWords-definitionId.db`,
            `search/uhbUnitWords-form.db`,
            `search/uhbUnitWords-gender.db`,
            `search/uhbUnitWords-h1.db`,
            `search/uhbUnitWords-h2.db`,
            `search/uhbUnitWords-h3.db`,
            `search/uhbUnitWords-h4.db`,
            `search/uhbUnitWords-h5.db`,
            `search/uhbUnitWords-isAramaic.db`,
            `search/uhbUnitWords-k.db`,
            `search/uhbUnitWords-l.db`,
            `search/uhbUnitWords-lemma.db`,
            `search/uhbUnitWords-m.db`,
            `search/uhbUnitWords-n.db`,
            `search/uhbUnitWords-number.db`,
            `search/uhbUnitWords-person.db`,
            `search/uhbUnitWords-pos.db`,
            `search/uhbUnitWords-sh.db`,
            `search/uhbUnitWords-state.db`,
            `search/uhbUnitWords-stem.db`,
            `search/uhbUnitWords-suffixGender.db`,
            `search/uhbUnitWords-suffixNumber.db`,
            `search/uhbUnitWords-suffixPerson.db`,
            `search/uhbUnitWords-type.db`,
            `search/uhbUnitWords-v.db`,

            `search/uhbUnitRanges.db`,

            `search/ugntUnitWords-aspect.db`,
            `search/ugntUnitWords-attribute.db`,
            `search/ugntUnitWords-case.db`,
            `search/ugntUnitWords-definitionId.db`,
            `search/ugntUnitWords-form.db`,
            `search/ugntUnitWords-gender.db`,
            `search/ugntUnitWords-lemma.db`,
            `search/ugntUnitWords-mood.db`,
            `search/ugntUnitWords-number.db`,
            `search/ugntUnitWords-person.db`,
            `search/ugntUnitWords-pos.db`,
            `search/ugntUnitWords-type.db`,
            `search/ugntUnitWords-voice.db`,

            `search/ugntUnitRanges.db`,

            `search/lemmas.db`,

          ]
          : [ `search/unitWords.db` ]
      ),
    })

    if(thisSyncProcessId !== currentSyncProcessId) return

    setBibleVersionDownloadStatus({ id, searchDownloaded: true })

  }

}

const syncBibleVersions = async ({ versionIds, setBibleVersionDownloadStatus, removeBibleVersion }={}) => {

  if(!isConnected) {
    goRerun = () => {
      goRerun = noop
      syncBibleVersions({ versionIds, setBibleVersionDownloadStatus, removeBibleVersion })
    }
    return
  }

  const thisSyncProcessId = ++currentSyncProcessId

  const { exists } = await FileSystem.getInfoAsync(sqliteDir)

  if(!exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true })
  }

  if(thisSyncProcessId !== currentSyncProcessId) return

  if(versionIds) {
    // This is called after the text is presented and whenever myBibleVersions changes
    // Runs in the background
    // Add/update all versions in versionIds

    for(let idx in versionIds) {
      await setUpVersion({ id: versionIds[idx], setBibleVersionDownloadStatus, thisSyncProcessId })
    }

    // Remove any version not in versionIds
    const dbFilenames = await FileSystem.readDirectoryAsync(sqliteDir)

    for(let idx in dbFilenames) {
      if(thisSyncProcessId !== currentSyncProcessId) return
      const id = dbFilenames[idx]
      if(!versionIds.includes(id)) {
        await removeVersion({ id, removeBibleVersion })
      }
    }

  } else if(!exists) {
    // This is during the splash screen on the first open
    // Set up first default version without search

    await setUpVersion({ id: DEFAULT_BIBLE_VERSIONS[0], setBibleVersionDownloadStatus, versesDirOnly: true, thisSyncProcessId })

  } else {
    // This is during the splash screen, though not the first open
    // Delete any removed versions

    const dbFilenames = await FileSystem.readDirectoryAsync(sqliteDir)

    for(let idx in dbFilenames) {
      if(thisSyncProcessId !== currentSyncProcessId) return
      const id = dbFilenames[idx]
      const versionInfo = getVersionInfo(id)
      if(!versionInfo) {
        await removeVersion({ id, removeBibleVersion })
      }
    }

  }

}

export default syncBibleVersions