var R = require ('ramda');
var use_db = require ('api/use_db')
var decode = require ('api/decode');
var detokenizer = require ('api/detokenizer');
var neonum = require ('api/neonum');
var elo_step = require ('api/elo_step');

module .exports = function (ctx, next) {
    var user = { id: detokenizer (decode (ctx .request .headers .user) .token) };
    var player = { id: detokenizer (decode (ctx .request .headers .player) .token) };
    var set_ = { id: detokenizer (decode (ctx .request .headers .set) .token), questions: decode (ctx .request .headers .set) .questions }
    var subcategory;
    return  use_db (function (session) {
                return  Promise .resolve ()
                        .then (function () {
                            if (set_ .questions .length !== 10)
                                return Promise .reject (new Error ('Invalid questions sent'));
                            if (! set_ .questions .every (R .converge (R .and, [
                                R .has ('score'), R .has ('difficulty')
                            ])))
                                return Promise .reject (new Error ('Not all questions have been completed'));
                        })
                        .then (function () {
                            return  session .run (
                                        'MATCH (user:User) WHERE ID (user) = {user} .id ' +
                                        'MATCH (player:Player) WHERE ID (player) = {player} .id ' +
                                        'MATCH (user)<-[:of]-(:is)-[:_]->(player) ' +
                                        'RETURN player',
                                        {
                                            user: user,
                                            player: player
                                        })
                        })
                        .then (function (results) {
                            if (! results .records .length)
                                return Promise .reject (new Error ('Invalid user or player specified'))
                        })
                        .then (function () {
                            return  session .run (
                                        'MATCH (player:Player) WHERE ID (player) = {player} .id ' +
                                        'MATCH (set:Set) WHERE ID (set) = {set} .id ' +
                                        'MATCH (set)<-[:to]-(:does)-[:_]->(player) ' +
                                        'RETURN set',
                                        {
                                            player: player,
                                            set: set_
                                        });
                        })
                        .then (function (results) {
                            if (! results .records .length)
                                return Promise .reject (new Error ('Player is not doing set'))
                        })
                        .then (function () {
                            return  session .run (
                                        'MATCH (player:Player) WHERE ID (player) = {player} .id ' +
                                        'MATCH (set:Set)<-[:to]-(doing:does)-[:_]->(player) ' +
                                        'MATCH (question:Question)<-[:_]-(:is)-[:in]->(set) ' +
                                        'RETURN set, question ',
                                        {
                                            player: player
                                        });
                        })
                        .then (function (results) {
                            //TODO: check tokens of questions
                            subcategory = { name: results .records [0] ._fields [0] .properties .subcategory };
                        })
                        .then (function () {
                            return  session .run (
                                        'MATCH (player:Player) WHERE ID (player) = {player} .id ' +
                                        'MATCH (set:Set)<-[:to]-(doing:does)-[:_]->(player) ' +
                                        
                                        'OPTIONAL MATCH (prev:Set)<-[x:to]-(having_done:did)-[y:_]->(player) ' +
                                        'FOREACH (_ in CASE WHEN prev IS NOT NULL THEN [1] ELSE [] END | ' +
                                            'MERGE (set)<-[:_]-(:suceeds)-[:to]->(prev) ' + 
                                            'DELETE x, y, having_done ' +
                                        ') ' +                           
                                        
                                        'REMOVE doing:does ' +
                                        'SET doing:did ',
                                        {
                                            player: player
                                        });
                        })
                        .then (function () {
                            return  session .run (
                                        'MATCH (player:Player) WHERE ID (player) = {player} .id ' +
                                        'MATCH (subcategory:Subcategory { name: {subcategory} .name }) ' +
                                        'MATCH (subcategory)<-[:in]-(achievement:achieves)-[:_]->(player)' +
                                        'RETURN achievement',
                                        {
                                            player: player,
                                            subcategory: subcategory
                                        });
                        })
                        .then (function (results) {
                            return results .records [0] ._fields [0] .properties;
                        })
                        .then (function (achievement) {
                            return  session .run (
                                        'MATCH (player:Player) WHERE ID (player) = {player} .id ' +
                                        'MATCH (subcategory:Subcategory { name: {subcategory} .name }) ' +
                                        'MATCH (subcategory)<-[:in]-(achievement:achieves)-[:_]->(player)' +
                                        'SET achievement .level = {achievement} .level',
                                        {
                                            player: player,
                                            subcategory: subcategory,
                                            achievement: {
                                                level: elo_step (set_ .questions, achievement)
                                            }
                                        });
                        })
                        .then (function () {
                            return {};
                        })
                        .catch (function (err) {
                            return {
                                error: err .message, stack: err.stack
                            }
                        })
            })
            .then (function (x) {
                ctx .body = x;
            })
            .then (function () {
                return next ();
            })
};