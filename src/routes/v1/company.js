import express from 'express'
import company from '../../controller/company.js'

import account_assignment_category from './company/account-assignment-category.js' //add by bhavesh
import department from './company/department.js' //add by bhavesh
import item_category from './company/item_category.js'//hukamsinh
import supplier from './company/supplier.js'//add by bhavesh

import pages from './company/pages.js'

import plans from './company/plans.js'
import plants from './company/plants.js'

import businessPartnerGroup from './company/business_partner_group.js'
import plansTenures from './company/plansTenures.js'


import foronboarding from './company/foronboarding.js'
import pr_items from './company/pr_items.js'
import purchase_request from './company/purchase_request.js'
import field_config from './company/field_config.js'
import department_group from './company/department_group.js'
import roles from './company/roles.js'
import deptApprovers from './company/department_approvers.js'

const router = express.Router()

router.post('/type/create', company.createCompanyType)
router.post('/type/get', company.paginateCompanyType)
router.post('/type/update', company.updateCompanyType)
router.post('/type/delete', company.deleteCompanyType)
router.post('/type/view/:id',company.viewCompanyType)


router.post('/create', company.createCompany)
router.post('/get', company.paginateCompany)
router.post('/update', company.updateCompany)
router.delete('/delete/:id', company.deleteCompany)

router.get('/hi',(req,res)=>{return res.json({"message":"welcome"}).status(200)})

router.use('/account-assignment-category',account_assignment_category) //add by bhavesh
router.use('/department', department) //bhavesh
router.use('/supplier', supplier) //bhavesh
router.use('/plan', plans) //bhavesh
router.use('/foronboarding',foronboarding)
router.use('/item_category', item_category) //hukamsinh
router.use('/page',pages)//hukamsinh
router.use('/plants', plants) //Krishna
router.use('/business-partner-group',businessPartnerGroup)//Krishna
router.use('/plans-tenures',plansTenures)//Krishna
router.use('/pr-items',pr_items)//bhavesh
router.use('/purchase-request',purchase_request)
router.use('/field_config',field_config)
router.use('/department-group',department_group)
router.use('/roles',roles)
router.use('/dept-approvers',deptApprovers)

export default router