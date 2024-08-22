import knex from "../config/mysql_db.js"
const table = "users"
const adminRoleTable = "users_roles"

const insertAdmin = (data) => {
    return knex(table).insert(data)
}

const updateAdmin = (id, data) => {
    return knex(table).where(id).update(data)
}

const deleteAdmin = (where) => {
    return knex(table).where(where).update({status: "2"})
}

const getAdminDetails = (where) => {
    return knex.select('*').from(table).where(where)
}

const getUserDetail = (where) => {
    return knex(table).select("id","firstname","lastname","email","status").where(where)
}

const paginateAdmin = (limit, offset, searchFrom, status, sort, search, order) => {
    let rows = knex(table).
    select(`${table}.id`, `${table}.firstname`, `${table}.lastname`, `${table}.email`, `${table}.status`, `${table}.role`, `${adminRoleTable}.role_name` ).
    leftJoin(adminRoleTable, `${adminRoleTable}.id`, "=", `${table}.role`)

    if (status) rows.where(`${table}.status`, `${status}`)

    // rows.where({type: "admin"})
    
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

const paginateAdminTotal = async(searchFrom, search, status) => {
    let results = knex(table).
        leftJoin(adminRoleTable, `${adminRoleTable}.id`, "=", `${table}.role`)

    if (status) results = results.where("status", status)
    
    results = results.where((query) => {
        if (search) {
            searchFrom.map(val => {
                query.orWhereILike(val, `%${search}%`)
            })
        }
    })
    const total = await results.count(`${table}.id as total`).first()
    return total
}

const checkEmail = (where, whereNot) => {
    return knex.select('email').from(table).where(where).whereNot(whereNot)
}

export default {
    insertAdmin,
    updateAdmin,
    deleteAdmin,
    getAdminDetails,
    getUserDetail,
    paginateAdmin,
    paginateAdminTotal,
    checkEmail
}