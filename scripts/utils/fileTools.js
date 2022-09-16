const fs = require('fs-extra')

const getVersionInfoRegex = versionId => (
  new RegExp(`{(?:(?:[^{}\\n]|{[^}]*})*\\n)*?[\\t ]*(?:id|"id"|'id')[\\t ]*:[\\t ]*(?:"${versionId || `[^"]+`}"|'${versionId || `[^']+`}')[\\t ]*,[\\t ]*\\n(?:(?:[^{}\\n]|{[^}]*})*\\n)*(?:[^{}\\n]|{[^}]*})*}(?:, *\n)?`, 'g')
)

const getVersionInfo = ({ tenantDir, versionId }) => {

  const versionsFile = fs.readFileSync(`${tenantDir}/versions.js`, { encoding: 'utf8' })
  const versionInfoRegex = getVersionInfoRegex(versionId)

  const matches = (
    versionsFile
      .replace(/removeIndentAndBlankStartEndLines/g, '')  // get rid of removeIndentAndBlankStartEndLines
      .replace(/(files\s*:\s*)([a-z0-9]{2,9}Requires)(\s*,?)/g, '$1"$2"$3')  // make requires into a string so we can do eval()
      .match(versionInfoRegex)
  )

  const versionInfos = {}

  matches.forEach(match => {
    const matchObj = eval(`(${match.replace(/, *\n$/, '')})`)
    const versionInfo = versionInfos[matchObj.id] = matchObj
    if(versionInfo.copyright) {
      versionInfo.copyright = (
        versionInfo.copyright
          .replace(/\n +/g, '\n')
          .replace(/^\n|\n$/g, '')
      )
    }
  })

  if(versionId) {
    return Object.values(versionInfos)[0]
  } else {
    return versionInfos
  }

}

const updateVersionsFile = ({ versionsFile, versionInfo, hasChange }) => {

  const versionId = versionInfo.id
  const versionWithEncryptedIfRelevant = versionInfo.encrypted ? `${versionId}-encrypted` : versionId
  const versionInfoRegex = getVersionInfoRegex(versionId)

  newVersionsFile = versionsFile.replace(new RegExp(` *import ${versionId}Requires from '\\./assets/bundledVersions/${!versionInfo.encrypted ? `${versionId}-encrypted` : versionId}/requires'.*\\n`), ``)
  const newImportLine = `import ${versionId}Requires from './assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'`

  if(versionInfo.bundled) {
    versionInfo.files = `${versionId}Requires`
    if(!newVersionsFile.includes(newImportLine)) {
      newVersionsFile = newVersionsFile.replace(/((?:^|\n)[^\/].*\n)/, `$1${newImportLine}\n`)
    }
  } else {
    delete versionInfo.files
    if(newVersionsFile.includes(newImportLine)) {
      newVersionsFile = newVersionsFile.replace(new RegExp(` *import ${versionId}Requires from '\\./assets/bundledVersions/${versionWithEncryptedIfRelevant}/requires'.*\\n`), ``)
    }
  }

  // update revision number if there was a change
  if(hasChange) {
    versionInfo[`${versionId}RevisionNum`]++
  }

  // swap in or insert new versionInfo
  const insertStr = JSON.stringify(versionInfo, null, '  ').replace(/\n/g, '\n  ') + `,\n`
  newVersionsFile = (
    (
      versionInfoRegex.test(newVersionsFile)
        ? newVersionsFile.replace(versionInfoRegex, insertStr)
        : newVersionsFile.replace(/(\]\s*export default bibleVersions)/, `  ${insertStr}$1`)
    )
      .replace(/"([^"]+Requires)"/g, '$1')
      .replace(/\n    "([^"]+)"/g, '\n    $1')
      .replace(/copyright: "(.*)",?/g, `copyright: removeIndentAndBlankStartEndLines(\`\n      ${versionInfo.copyright.replace(/`/g, '\\`').replace(/(?:\\n|\n)/g, '\n      ')}\n    \`),`)
  )

  return newVersionsFile

}

const setVersionInfo = async ({ tenantDir, versionInfo, versionInfos, hasChange }) => {
  let newVersionsFile = fs.readFileSync(`${tenantDir}/versions.js`, { encoding: 'utf8' })
  versionInfos = versionInfos || [ versionInfo ]
  for(let versionId in versionInfos) {
    const versionInfo = versionInfos[versionId]
    if(versionInfo) {
      newVersionsFile = updateVersionsFile({ versionsFile: newVersionsFile, versionInfo, hasChange })
    } else {
      const versionInfoRegex = getVersionInfoRegex(versionId)
      newVersionsFile = newVersionsFile.replace(versionInfoRegex, ``)
    }
  }
  await fs.writeFile(`${tenantDir}/versions.js`, newVersionsFile)
}

const removeIndent = str => {
  const lines = str.split(`\n`)
  const numSpacesInIndent = (lines[0] || lines[1]).match(/^ */)[0].length
  return lines.map(line => line.replace(new RegExp(` {1,${numSpacesInIndent}}`), ``)).join(`\n`)
}

module.exports = {
  getVersionInfoRegex,
  getVersionInfo,
  setVersionInfo,
  removeIndent,
}