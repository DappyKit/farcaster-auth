import express from 'express'
import createAction from './create-action'
import answerAction from './answer-action'
import listAction from './list-action'
import rejectAction from './reject-action'
import isAuthorizedAction from './is-authorized-action'

const router = express.Router()
router.post('/list', listAction)
router.post('/reject', rejectAction)
router.post('/create', createAction)
router.post('/answer', answerAction)
router.post('/is-authorized', isAuthorizedAction)

export default router
