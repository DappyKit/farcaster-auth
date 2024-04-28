import { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ result: true })
  } catch (e) {
    next(e)
  }
}
