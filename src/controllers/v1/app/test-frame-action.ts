import { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.send('<meta property="frame:owner" content="354669"/>')
  } catch (e) {
    next(e)
  }
}
