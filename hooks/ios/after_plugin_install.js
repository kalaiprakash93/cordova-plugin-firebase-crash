const xcode = require('xcode')
const path = require('path')
const fs = require('fs')

// To run in node repl:
// const f = require('./build/ios/addCrashlyticsBuildPhase')
// f()
module.exports = function (context) {

  const projectRoot = context ? context.opts.projectRoot : path.resolve(__dirname, '../../')
  const projectDir = path.resolve(projectRoot, './platforms/ios')
  const dirContent = fs.readdirSync(projectDir)
  const matchingProjectFiles = dirContent.filter(filePath => /.*\.xcodeproj/gi.test(filePath) )
  const projectPath = projectDir + '/' + matchingProjectFiles[0] + '/project.pbxproj'

  const project = xcode.project(projectPath)

  project.parse(error => {
    if (error) console.error('failed to parse project', error)
    const options = {
      shellPath: '/bin/sh',
      shellScript: '${PODS_ROOT}/Fabric/run',
      inputPaths: ['"$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)"']
    }
    const comment = 'Initialize Crashlytics'
    // Only add if not already there yet
    const hasBuildPhase = !!project.getFirstTarget().firstTarget.buildPhases.find(buildPhase => buildPhase.comment === comment)

    if (!hasBuildPhase) {
      project.addBuildPhase(
        [],
        'PBXShellScriptBuildPhase',
        comment,
        project.getFirstTarget().uuid,
        options)
      fs.writeFileSync(projectPath, project.writeSync())
    }
  })
}
