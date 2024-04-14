import { Request, Response, NextFunction } from 'express'
import { getConfigData } from '../../../config'
import { ICreateResponse } from './interface/ICreateResponse'
import { upsertApp } from '../../../db/app'
import { ICreateRequest } from './interface/ICreateRequest'
import { getAppCreateData } from './utils/app-create-utils'

/**
 * Creates an app with messages from the trusted Frame.
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export default async (
  req: Request<ICreateRequest>,
  res: Response<ICreateResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { neynarApiKey, authorizedFrameUrl } = getConfigData()
    const { frameUrl, frameCallbackUrl, frameOwnerFid, username, displayName, profileImage } = await getAppCreateData(
      neynarApiKey,
      authorizedFrameUrl,
      req.body,
    )

    await upsertApp({
      fid: frameOwnerFid,
      username,
      display_name: displayName,
      profile_image: profileImage,
      is_active: true,
      frame_url: frameUrl,
      callback_url: frameCallbackUrl,
    })

    res.json({
      status: 'ok',
    })
  } catch (e) {
    next(e)
  }
}
