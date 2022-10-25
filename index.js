const {join} = require('path')
const {mkdirpSync, readFileSync, removeSync} = require('fs-extra')
const AdmZip = require('adm-zip')

const ensureDirectoryExists = (path) => {
  try {
    mkdirpSync(path)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
}

class ServerlessBashPlugin {
  static WORK_DIRECTORY = '.sls-bash'

  constructor(sls) {
    this.sls = sls
    this.template = readFileSync(join(__dirname, 'template.sh'), 'utf-8')
    this.hooks = {
      'after:package:initialize': this.run,
      'before:deploy:function:packageFunction': this.run,
      'aws:deploy:deploy:uploadArtifacts': this.cleanup,
    }
  }

  run = () => {
    const originalServicePath = this.sls.config.servicePath
    const handlersFullDirPath = join(
      originalServicePath,
      ServerlessBashPlugin.WORK_DIRECTORY,
    )
    ensureDirectoryExists(handlersFullDirPath)

    const functions = this.detectFunctions()

    functions.forEach((funcData) => {
      const func = this.sls.service.functions[funcData.key]
      const handlerScript = readFileSync(join(originalServicePath, func.handler), 'utf-8')
      const completeScript = this.template.replace('## HANDLER', handlerScript)

      func.runtime = 'provided.al2'
      func.package = {
        artifact: join(handlersFullDirPath, func.name, `${func.name}.zip`)
      }

      ensureDirectoryExists(join(handlersFullDirPath, func.name))

      const zip = new AdmZip()
      zip.addFile('bootstrap', Buffer.from(completeScript, 'utf8'))
      zip.writeZip(join(handlersFullDirPath, func.name, `${func.name}.zip`))
    })
  }

  cleanup = () => {
    removeSync(join(this.sls.config.servicePath, ServerlessBashPlugin.WORK_DIRECTORY))
  }

  detectFunctions = () => {
    return Object.entries(this.sls.service.functions)
      .filter(([_, func]) => {
        return func.handler && func.handler.endsWith('.sh')
      })
      .map(([key, func]) => ({
        key,
        handler: func.handler,
      }))
  }
}

module.exports = ServerlessBashPlugin
