import { getConfigData, loadConfig } from '../config'
import { getAllApps } from '../db/app'
import { Wallet } from 'ethers'
import { exportFrameToClickcaster } from '../controllers/v1/app/utils/app-create-utils'

async function start() {
  loadConfig()
  const { signer, clickcasterExportUrl } = getConfigData()
  const mainSigner = new Wallet(signer)
  console.log('clickcasterExportUrl', clickcasterExportUrl) // eslint-disable-line no-console
  const apps = await getAllApps()
  console.log('Found apps:', apps.length) // eslint-disable-line no-console
  for (const [index, app] of apps.entries()) {
    const response = await (
      await exportFrameToClickcaster(clickcasterExportUrl, app.fid, app.frame_url, app.signer_address, mainSigner)
    ).text()
    console.log(`[${index + 1} / ${apps.length}] Exported frame response:`, response) // eslint-disable-line no-console
  }

  process.exit(0)
}

start().then()
