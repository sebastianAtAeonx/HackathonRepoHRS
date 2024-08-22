import knex from "../config/mysql_db.js"

function logLastQuery(req, res, next) {
    const originalQueryFn = knex.client.queryBuilder;
    knex.client.queryBuilder = function () {
        const queryBuilder = originalQueryFn.apply(this, arguments);
        queryBuilder.on('query', function (queryData) {
            console.log('Last Query:', queryData.sql);
            console.log('Bindings:', queryData.bindings);
        });
        return queryBuilder;
    };
    next();
}
export default {
    logLastQuery
}
