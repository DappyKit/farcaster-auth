import express from 'express'
import createAction from './create-action'
import answerAction from './answer-action'

const router = express.Router()
router.post('/create', createAction)
router.post('/answer', answerAction)

export default router
