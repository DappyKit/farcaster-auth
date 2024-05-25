import express from 'express'
import createAction from './create-action'
import existsAction from './exists-action'
import testFrameAction from './test-frame-action'
import testWebhookAction from './test-webhook-action'
import testWebhookFailAction from './test-webhook-fail-action'

const router = express.Router()
router.post('/create', createAction)
router.get('/exists', existsAction)
router.get('/test-frame', testFrameAction)
router.all('/test-webhook', testWebhookAction)
router.all('/test-webhook-fail', testWebhookFailAction)

export default router
