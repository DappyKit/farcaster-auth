import express from 'express'
import saveAction from './save-action'
import getByAddressAction from './get-by-address-action'
import getUserInfoAction from './get-user-info-action'

const router = express.Router()
router.post('/save', saveAction)
router.get('/get-by-address', getByAddressAction)
router.get('/get-user-info', getUserInfoAction)

export default router
