import Constants from "expo-constants"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import CryptoJS from "react-native-crypto-js"

import { getVersionInfo } from "./toolbox"

const {
  DEFAULT_BIBLE_VERSIONS=['original'],
  BIBLE_VERSIONS_FILE_SECRET="None",
} = Constants.manifest.extra

const sqliteDir = `${FileSystem.documentDirectory}SQLite`

const noop = () => {}

const setUpVersion = async ({ id, setBibleVersionDownloadStatus=noop, removeBibleVersion=noop, forceRemove }) => {
  const versionInfo = getVersionInfo(id)

  const fileRevisionNum = `${(versionInfo || {}).fileRevisionNum || 0}`
  const fileRevisionKey = `fileRevisionNum-${id}`
  const encrypted = !!(versionInfo || {}).encrypted
  const versionDir = `${sqliteDir}/${id}`
  const encryptedVersionDir = `${versionDir}-encrypted`

  let [ x, { exists }, storedFileRevisionKey ] = await Promise.all([
    (async () => {
      if((await FileSystem.getInfoAsync(encryptedVersionDir)).exists) {
        await FileSystem.deleteAsync(encryptedVersionDir)
      }
    })(),
    FileSystem.getInfoAsync(versionDir),
    AsyncStorage.getItem(fileRevisionKey),
  ])

  if(exists) {

    // first remove if it has an update
    if(
      !versionInfo
      || storedFileRevisionKey !== fileRevisionNum
      || forceRemove
    ) {

      console.log(`Removing ${id} from SQLite (there is a new revision)...`)

      if(!versionInfo) {
        removeBibleVersion({ id })
      } else if(!forceRemove) {
        setBibleVersionDownloadStatus({ id, downloaded: false })
      }

      await Promise.all([
        AsyncStorage.removeItem(fileRevisionKey),
        FileSystem.deleteAsync(versionDir),
      ])
      exists = false

      console.log(`...done.`)

    }
  }

  if(!versionInfo || forceRemove) return

  if(!exists) {

    console.log(`Copy ${id} to SQLite dir...`)

    await Promise.all([
      (async () => {
        await FileSystem.makeDirectoryAsync(`${versionDir}/verses`, { intermediates: true })
        await FileSystem.makeDirectoryAsync(`${versionDir}/search`, { intermediates: true })
      })(),
      (async () => {
        if(encrypted) {
          await FileSystem.makeDirectoryAsync(encryptedVersionDir, { intermediates: true })
        }
      })(),
    ])

    await Promise.all((versionInfo.files || []).map(async (file, idx) => {

      if(!file) return

      const { localUri, uri } = Asset.fromModule(file)
      const to = `${encrypted ? encryptedVersionDir : versionDir}/${uri.split(`/${id}/`)[1].replace(/\?.*$/, '')}`

      if(localUri) {
        if(idx === 0) console.log(`...via local file...`)
        await FileSystem.copyAsync({
          from: localUri,
          to,
        })
      } else {
        if(idx === 0) console.log(`...via download...`)
        await FileSystem.downloadAsync(
          uri,
          to,
        )
      }

      if(encrypted) {
        const encryptedContent = await FileSystem.readAsStringAsync(to)
        const unencryptedBase64 = encryptedContent
          .split('\n')
          .map(slice => (
            slice.substring(0, 1) === '@'
              ? CryptoJS.AES.decrypt(slice.substring(1), BIBLE_VERSIONS_FILE_SECRET).toString(CryptoJS.enc.Utf8)
              : slice
          ))
          .join('')
        await Promise.all([
          FileSystem.deleteAsync(to),
          FileSystem.writeAsStringAsync(`${versionDir}/${idx+1}.db`, unencryptedBase64, { encoding: FileSystem.EncodingType.Base64 }),
        ])
      }

    }))

    await Promise.all([
      AsyncStorage.setItem(fileRevisionKey, fileRevisionNum),
      (async () => {
        if(encrypted) {
          await FileSystem.deleteAsync(encryptedVersionDir)
        }
      })(),
    ])

    console.log(`...done.`)

  }

  setBibleVersionDownloadStatus({ id, downloaded: true })

}

const syncBibleVersions = async ({ versionIds, setBibleVersionDownloadStatus, removeBibleVersion }={}) => {

  const { exists } = await FileSystem.getInfoAsync(sqliteDir)

  if(!exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true })
  }

  if(versionIds) {
    // Add/update all versions in versionIds

    for(let idx in versionIds) {
      await setUpVersion({ id: versionIds[idx], setBibleVersionDownloadStatus, removeBibleVersion })
    }

    // Remove any version not in versionIds
    const dbFilenames = await FileSystem.readDirectoryAsync(sqliteDir)

    for(let idx in dbFilenames) {
      const id = dbFilenames[idx]
      if(!versionIds.includes(id)) {
        await setUpVersion({ id, setBibleVersionDownloadStatus, removeBibleVersion, forceRemove: true })
      }
    }

  } else if(!exists) {
    // This is the first open
    // Set up default versions

    for(let idx in DEFAULT_BIBLE_VERSIONS) {
      await setUpVersion({ id: DEFAULT_BIBLE_VERSIONS[idx], setBibleVersionDownloadStatus, removeBibleVersion })
    }

  } else {
    // This is not the first open
    // Delete any removed versions and update versions where needed

    const dbFilenames = await FileSystem.readDirectoryAsync(sqliteDir)

    for(let idx in dbFilenames) {
      const id = dbFilenames[idx]
      await setUpVersion({ id, setBibleVersionDownloadStatus, removeBibleVersion })
    }

  }

}

export default syncBibleVersions