import app from './app'
import authorization from './authorization'
import delegatedFs from './delegated-fs'

import express from 'express'

const router = express.Router()

router.use('/app', app)
router.use('/authorization', authorization)
router.use('/delegated-fs', delegatedFs)

export default router
