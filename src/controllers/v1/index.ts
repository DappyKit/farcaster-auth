import app from './app'
import authorization from './authorization'

import express from 'express'

const router = express.Router()

router.use('/app', app)
router.use('/authorization', authorization)

export default router
