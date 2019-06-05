import { FileSystem, Asset, SQLite } from 'expo'
import { getToolbarHeight } from './toolbox.js'
import bibleVersions from '../../versions.js'

const importUsfm = async () => {

  const sqliteDir = `${FileSystem.documentDirectory}SQLite`

  try {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true })
  } catch(e) {}

  for(let idx in bibleVersions) {
    const { exists } = await FileSystem.getInfoAsync(`${sqliteDir}/${bibleVersions[idx].name}.db`)

    if(!exists) {
      console.log(`Move ${bibleVersions[idx].name} to SQLite dir...`)
      await FileSystem.downloadAsync(
        Asset.fromModule(bibleVersions[idx].file).uri,
        `${sqliteDir}/${bibleVersions[idx].name}.db`
      )
    }
  }

}

export default importUsfm