import knex from "../config/mysql_db.js"
const table = "location"

const insertLocation = (data) => {
    return knex(table).insert(data)
}

const updateLocation = (id, data) => {
    return knex(table).where({id}).update(data)
}

const getDetail = (condition) => {
    return knex(table).select("id", "name", "image", "status").where(condition)
}

const deleteLocation = (condition) => {
    return knex(table).where(condition).update({status: "2"})
}

const paginateLocation = async(limit, offset, searchFrom, status, sort, search, order) => {
    let rows = knex(table)
    
    if (status) rows.where('status', `${status}`)

    rows = rows.where((query) => {
        if (search) {
            searchFrom.map(val => {
                query.orWhereILike(val, `%${search}%`)
            })
        }
    })
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset)
 
    return rows
}

const paginateLocationTotal = async(searchFrom, search, status) => {
    let results = knex(table)

    if (status) results = results.where("status", status)
    
    results = results.where((query) => {
        if (search) {
            searchFrom.map(val => {
                query.orWhereILike(val, `%${search}%`)
            })
        }
    })
    const total = await results.count("id as total").first()
    return total
}

export default {
    insertLocation,
    updateLocation,
    getDetail,
    deleteLocation,
    paginateLocation,
    paginateLocationTotal
}