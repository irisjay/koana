+ function () {
	var ui_info = pre (function () {
		var ui = frame ('dashboard');

		[] .forEach .call (ui .querySelectorAll ('#hint[for=text]'), function (_) {
			_ .outerHTML = text_ify (_);
		});

		[] .forEach .call (ui .querySelectorAll ('#hint[for=image]'), function (_) {
			_ .outerHTML = image_ify (_);
		});
		
		return {
			dom: serve (ui)
		};
	})
	
	var interaction_ = function (components, unions) {
		var nav = unions .nav;
		
		var go = components .go;
		var add = components .add;
		var profile = components .profile;
		var courses = components .courses;
		
		var koder = components .koder;
		var chances = components .chances;
		
		var extension = interaction (transition (function (intent, license) {
			if (intent [0] === 'player') {
				return function (tenure) {
					inquire (api () .player, intent [1] && {
						token: intent [1] .token
					}) .then (function () {
						tenure .end (true);
					}) .then (function () {
						//PRIMITIVE REPLAY
						if (license ())
							extension .intent (license ())
					})
				}
			}
			else if (intent [0] === 'go') {
				nav .state (['go']);
				return reflect (none);
			}
			else if (intent [0] === 'add') {
				nav .state (['add']);
				return reflect (none);
			}
			else if (intent [0] === 'profile') {
				nav .state (['profile']);
				return reflect (none);
			}
			else if (intent [0] === 'courses') {
				nav .state (['courses']);
				return reflect (none);
			}
			else {
				return decline_ (intent);
			}
		}));
		
		[koder .state]
			.map (filter (R .pipe (just_call (nav .intent), R .cond ([[ R .identity, R .propEq (0, 'prepare')]]))))
			.forEach (tap (function (x) {
				extension .intent (['player', x .koder]);
			}));
			
		[go] .forEach (tap (function () {
			extension .intent (['go']);
		}));
		[add] .forEach (tap (function () {
			extension .intent (['add']);
		}));
		[profile] .forEach (tap (function () {
			extension .intent (['profile']);
		}));
		[courses] .forEach (tap (function () {
			extension .intent (['courses']);
		}));


		[api]
			.map (map (R .prop ('user'))) .map (filter (R .identity))
			.map (map (R .prop ('from'))) .map (dropRepeats) .map (switchLatest)
			.map (filter (R .not))
			.forEach (tap (function () {
				koder .intent (['data', []]);
				chances .intent (['chances', 0]);
			}));

		[api]
			.map (filter (R .has ('chances'))) .map (map (R .prop ('chances')))
			.map (map (R .prop ('from'))) .map (dropRepeats) .map (switchLatest)
			.map (filter (no_errors))
			.forEach (tap (function (x) {
				chances .intent (['chances', x ._]);
			}));
		[nav .intent]
			.map (filter (function (x) {
				return R .head (x) === 'prepare'
			}))
			.forEach (tap (function () {
				loader ();
				if (! api () .user .from ()) {
					report ('not logged in trying to access dashboard');
					loader .stop ();
					nav .state (['unauthorized']);
				}
				else {
					Promise .all (
						[inquire (api () .all_players) .then (function (x) {
							if (x .error)
								return Promise .reject (x .error);
							else if (! x ._ .length) {
								return Promise .reject ('no players');
							}
							else {
								var choices =	[config .koder .choices]
													.map (R .map (
															R .juxt (
																[R .prop ('name'), R .identity])))
													.map (R .fromPairs)
														[0];
								koder .intent (['data',
									x ._ .map (
										R .converge (R .merge, 
											[
												R .pipe (
													R .prop ('koder_archetype'),
													R .flip (R .prop) (choices)),
												R .identity
											]))]);
							}
						}),
						inquire (api () .chances) .then (function (x) {
							if (x .error)
								return Promise .reject (x .error);
							//else
								//chances .intent (['chances', x ._]);
						})]
					)
					.then (function () {
						loader .stop ();
					})
					.catch (function (e) {
						loader .stop ();
						if (e === 'no players')
							nav .state (['first_player']);
						else
							toast ('There was a problem connecting to the server')
					})
					
				}
			}));
		
		return {
			_: extension,

			koder: koder,
			chances: chances
		}
	}


	var interaction_chances = function (dom) {
		var mark_nodes = [] .slice .call (dom .querySelectorAll ('[part]'));
		var mark_on = R .pipe (
			R .map (function (node) {
				return [node .getAttribute ('id'), node];
			}),
			R .fromPairs
		) (mark_nodes);
		return interaction (transition (function (intent, state) {
			if (intent [0] === 'chances') {
				var mark = intent [1]
						
				mark_nodes .forEach (function (node) {
					node .style .visibility = 'hidden';
				});
				[mark_on [mark]] .forEach (function (node) {
					if (node) node .style .visibility = '';
				});
				
				return only_ (mark);
			}
			else
				return decline_ (intent);
		}))
	};
	
	
	window .uis = R .assoc (
		'dashboard', function (components, unions) {
			var nav = unions .nav;
			
			var dom = ui_info .dom .cloneNode (true);
			
			var go_dom = dom .querySelector ('#go[action=focus]');
			var go_stream = stream_from_click_on (go_dom);
	
			var profile_dom = dom .querySelector ('#profile[action=side]');
			var profile_stream = stream_from_click_on (profile_dom);
	
			var courses_dom = dom .querySelector ('#courses[action=side]');
			var courses_stream = stream_from_click_on (courses_dom);
										
			var koders_dom = dom .querySelector ('#koders');		
	
			var add_dom = koders_dom .querySelector ('#add[action=side]');
			var add_stream = stream_from_click_on (add_dom);
	
			var left_dom = koders_dom .querySelector ('#prev');
			var right_dom = koders_dom .querySelector ('#next');
			var image_dom = koders_dom .querySelector ('img');
			var name_dom = koders_dom .querySelector ('#name [text]');
			
			var koder_interaction =	interaction_select_koders (
										{
											left: left_dom,
											right: right_dom, 
											image: image_dom,
											name: name_dom,
											left_edge: add_dom,
											right_edge: true
										},
										[]
									);
										
			var chances_dom = dom .querySelector ('#koding-chances-remaining');		
			
			var chances_interaction = interaction_chances (chances_dom);
	
			return R .merge (R .__, {
				nav: nav,
				dom: dom 
			}) (interaction_ ({
				go: go_stream,
				add: add_stream,
				profile: profile_stream,
				courses: courses_stream,
				
				koder: koder_interaction,
				chances: chances_interaction
			}, { nav: nav }));
		}
	) (window .uis);
} ();