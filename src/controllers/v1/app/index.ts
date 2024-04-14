import express from 'express'
import createAction from './create-action'

const router = express.Router()
router.post('/create', createAction)

export default router
