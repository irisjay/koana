/*
	global stateful,
	global constant,
	global stringify,
	global R,
	global tap
*/

var frontend_path = window .location .protocol + '//briansark-mumenrider.c9users.io';
var backend_path = window .location .protocol + '//briansark-mumenrider.c9users.io/api';	

var home_path = '#login';

var no_errors = function (x) {
    					    return ! x .error;
    					}

var global_api =    R .tap (function (_) {
						_ .user = cycle_persisted ('user') ();
						_ .player =	cycle_persisted ('player') ();
									
						_ .user .from .thru (tap, R .cond ([
					        [R .not, function () {
					            api (default_api)
					        }],
					        [R .T, function (user) {
					            api (user_api (user))
					        }]
				        ]));
						_ .player .from .thru (tap, R .cond ([
					        [R .not, function () {
					            api (user_api (_ .user .from ()))
					        }],
					        [R .T, function (player) {
					            api (player_api (_ .user .from (), player))
					        }]
				        ]));
                    }) ({})

var api = stream ();
var default_api =	R .tap (function (_) {
						_ .register =	cycle_by_translate (R .applySpec ({
											path: constant (backend_path + '/register'),
											method: constant ('POST'),
											headers: constant ({ 'Content-Type': 'application/json'}),
											body: stringify
										}), cycle_from_network, R .prop ('json')) ();
						_ .login =	cycle_by_translate (R .applySpec ({
										path: constant (backend_path + '/login'),
										method: constant ('POST'),
										headers: constant ({ 'Content-Type': 'application/json'}),
										body: stringify
									}), cycle_from_network, R .prop ('json')) ();
    										
    					mergeAll ([
    					    _ .register .from .thru (filter, no_errors),
    					    _ .login .from .thru (filter, no_errors)
                        ]) .thru (tap, _ .user .to)
					}) (global_api);
						
var user_api = function (user) {
    return R .tap (function (_) {
        var prefix = 'user:' + user .token;
        
		_ .add_player =	cycle_by_translate (R .applySpec ({
							path: constant (backend_path + '/player/add'),
							method: constant ('POST'),
							headers: constant ({ 'Content-Type': 'application/json'}),
							body: R .pipe (
							    R .merge ({
							        user: user
							    }),
							    stringify
						    )
						}), cycle_from_network, R .prop ('json')) ();
		_ .remove_player =	cycle_by_translate (R .applySpec ({
    							path: constant (backend_path + '/player/remove'),
    							method: constant ('POST'),
    							headers: constant ({ 'Content-Type': 'application/json'}),
    							body: R .pipe (
    							    R .merge ({
    							        user: user
    							    }),
    							    stringify
    						    )
    						}), cycle_from_network, R .prop ('json')) ();
		_ .all_players =	R .pipe (
    		                    cycle_by_translate (R .applySpec ({
    								path: constant (backend_path + '/register'),
    								method: constant ('POST'),
    								headers: constant ({ 'Content-Type': 'application/json'}),
    								body: stringify
    							}), cycle_from_network, R .prop ('json')),
    			                cycle_persisted (prefix + '/all-players')
    						) ();
    	
    	_ .logout = re_cycle ();
    	_ .logout .from .thru (tap, function () {
    	    _ .player .to (undefined);
    	    _ .user .to (undefined);
    	})
    }) (global_api);
};

var player_api = function (user, player) {
    return R .tap (function (_) {
        var prefix = 'user:' + user .token + '/player:' + player .token;
        
    	_ .subcategories = 	R .pipe (
    		                    cycle_by_translate (R .applySpec ({
    								path: constant (backend_path + '/subcategories'),
    								method: constant ('GET'),
    								headers: constant ({ 'Content-Type': 'application/json'}),
    								body: stringify
    							}), cycle_from_network, R .prop ('json')),
    							cycle_persisted ('subcategories')
    						) ();
    	_ .quiz = cycle_persisted (prefix + '/quiz') ();
    	
    	_ .set = cycle_persisted (prefix + '/set') ();
    	_ .take_set =	cycle_by_translate (R .applySpec ({
								path: constant (backend_path + '/set/request'),
								method: constant ('POST'),
								headers: constant ({ 'Content-Type': 'application/json'}),
								body: R .pipe (
								    R .merge ({
    								    user: user,
    								    player: player
    								}),
    								R .juxt ([_ .quiz .from, R .identity]),
    								R .apply (R .assoc ('subcategory')),
    								stringify
								)
							}), cycle_from_network, R .prop ('json')) ();
        _ .take_set .from .thru (tap, function (x) {
            _ .set .to (x);
        })
    	_ .give_set =	cycle_by_translate (R .applySpec ({
							path: constant (backend_path + '/set/report'),
							method: constant ('POST'),
							headers: constant ({ 'Content-Type': 'application/json'}),
							body: R .pipe (
							    R .merge ({
								    user: user,
								    player: player
								}),
								stringify
							)
						}), cycle_from_network, R .prop ('json')) ();    
    	_ .give_set .from .thru (tap, function () {
    	    _ .set .to (undefined);
    	})
    }) (user_api (user));
};
						
api .thru (_begins_with, default_api);





var routes = {
    login: '#login',
    make_account: '#make-account',
    logout: '#logout',
    dashboard: '#trail',
    categories: '#categories',
    quiz: '#quiz'
}

var date_string = function (date) {
    var mm = date .getMonth () + 1;
    var dd = date .getDate ();
    
    return [
        date .getFullYear (),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
    ] .join ('');
};