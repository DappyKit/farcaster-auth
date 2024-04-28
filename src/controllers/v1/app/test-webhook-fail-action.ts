import { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ result: false })
  } catch (e) {
    next(e)
  }
}
