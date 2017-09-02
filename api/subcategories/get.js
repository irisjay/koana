var use_db = require ('api/use_db')

module .exports =   function (ctx, next) {
                        return  use_db (function (session) {
                                    return session .run (
                                        'MATCH (subcategory:Subcategory) MATCH (category:Category)-[:Contains]->(subcategory) ' +
                                        'RETURN subcategory, category ')
                                })
                                    .then (function (results) {
                                        return  results .records .map (function (record) {
                                                    return  {
                                                                label: record ._fields [1] .properties .name,
                                                                item: [record ._fields [0] .properties .name, record ._fields [0] .properties .image]
                                                            }
                                                })
                                    })
                                    .then (function (_) {
    									return	_ .reduce (function (total, x) {
    												total [x .label] = (total [x .label] || []) .concat ([x .item])
    												return total;
    											}, {})
                                    })
                                    .then (function (_) {
                                        ctx .body = _;
                                    })
                                    .then (function () {
                                        return next ();
                                    })
                    };