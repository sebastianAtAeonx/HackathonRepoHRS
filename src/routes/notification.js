import express from 'express'
import notification from '../controller/notification.js'
const router = express.Router()

router.post('/getNotifications',notification.getNotifications)
router.put('/readNotification/:id', notification.readNotification)
router.put('/readAllNotification', notification.readAllNotification)

export default router