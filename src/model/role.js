import knex from "../config/mysql_db.js"
// const constants = require('../helpers/constants')
const table = "users_roles"

const insertRole = async (data) => {
    const { role_name, permissions } = data
    const allModules = await knex("modules")
    const rolePermissions = []
    const role_id = await knex(table).insert({ role_name })
    if (!role_id) {
        return false
    }
    Object.keys(permissions).map(key => {
        allModules.map(modules => {
            if (modules.module_key == key) {
                rolePermissions.push({
                    role_id,
                    module_id: modules.id,
                    readP: permissions[key].read == true ? "1" : "0",
                    createP: permissions[key].create == true ? "1" : "0",
                    updateP: permissions[key].update == true ? "1" : "0",
                    deleteP: permissions[key].delete == true ? "1" : "0"
                })
            }
        })
    })
    await knex("users_roles_permissions").insert(rolePermissions)
    return role_id
}

const updateRole = async (role_id, data) => {
    const { role_name, permissions } = data
    const allModules = await knex("modules")
    const rolePermissions = []
    const ret = await knex(table).where({id: role_id}).update({ role_name })
    if (!role_id) {
        return false
    }
    Object.keys(permissions).map(key => {
        allModules.map(modules => {
            if (modules.module_key == key) {
                rolePermissions.push({
                    role_id,
                    module_id: modules.id,
                    readP: permissions[key].read == true ? "1" : "0",
                    createP: permissions[key].create == true ? "1" : "0",
                    updateP: permissions[key].update == true ? "1" : "0",
                    deleteP: permissions[key].delete == true ? "1" : "0"
                })
            }
        })
    })
    
    await knex("users_roles_permissions").where({role_id}).del()
    await knex("users_roles_permissions").insert(rolePermissions)
    return ret
    // return knex(table).where({ id }).update(data)
}

const deleteRole = async (id) => {
    await knex("users_roles_permissions").where({role_id: id}).del()
    return await knex(table).where({ id }).del()
}

const paginatRole = (limit, offset, searchFrom, status, sort, search, order) => {
    let rows = knex(table)
    if (status != undefined && status != "") {
        rows.where('status', `${status}`)
    }
    rows = rows.where((query) => {
        if (search) {
            searchFrom.map(val => {
                query.orWhereILike(val, `%${search}%`)
            })
        }
    })
    rows = rows.orderBy(sort, order).limit(limit).offset(offset)

    return rows
}

const paginatRoleTotal = async (searchFrom, search, status) => {
    let results = knex(table)
    let total = 0
    if (status != undefined && status != "") {
        results = results.where("status", status)
    }
    results = results.where((query) => {
        if (search) {
            searchFrom.map(val => {
                query.orWhereILike(val, `%${search}%`)
            })
        }
    })
    total = await results.count("id as total").first()
    return total
}

const getRoleDetail = (field) => {
    return knex(table).where(field)
}

export default {
    insertRole,
    updateRole,
    deleteRole,
    paginatRole,
    paginatRoleTotal,
    getRoleDetail
}