+ function () {
	var ui_info = pre (function () {
		var ui = frame ('quiz');

		[] .forEach .call (ui .querySelectorAll ('#hint[for=fun-loader]'), function (_) {
			_ .outerHTML = fun_loader_ify (_);
		});
		
		[] .forEach .call (ui .querySelectorAll ('#hint[for=image]'), function (_) {
			_ .outerHTML = image_ify (_);
		});
		[] .forEach .call (ui .querySelectorAll ('#hint[for=text]'), function (_) {
			_ .outerHTML = text_ify (_);
		});

		return {
			dom: serve (ui)
		}
	})
	
	
	var _interaction_ = function (components, unions) {
        var all = components .all;
        
        var back = components .back;
        var start = components .start;
        
        var title = components .title;
        var icon = components .icon;
        
        var loading = components .loading;
        
        var nav = unions .nav;
	    
	    [nav .intent]
	    	.map (filter (function (x) {
	    		return R .head (x) === 'prepare'
	    	}))
	        .forEach (tap (function (intent) {
	            if (! intent [2]) {
	                nav .state (['unsolicited'])
	            }
    			else {
    				extension .intent (['load', intent [2]]);
    				[nav .intent]
				    	.map (filter (function (x) {
				    		return R .head (x) === 'reset'
				    	}))
    					.map (promise)
    				[0]
    				    .then (function () {
	                        loading .intent (['reset']);
    				    })
    			}
	        }))
    	
	    var extension = interaction (transition (function (intent, license) {
	        if (intent [0] === 'load') {
	            var quiz = intent [1];
	            var img_srcs = [api () .subcategories .from ()] .map (
                    R.pipe (
                        R.values,
                        R.unnest,
                        R .map (
                            R .juxt ([R .prop (0), R .prop (1)])),
                        R .fromPairs))
                [0];
	            return function (tenure) {
	                api () .quiz .to (quiz);
	                title .textContent = quiz .split (' ') [0];
	                icon .setAttribute ('src', img_srcs [quiz]);
	                loading .intent (['prepare']);
                    inquire (api () .take_set)
                        .then (function () {
	                        loading .intent (['reset']);
                            tenure .end (true);	                
                			if (license ())
                			    extension .intent (license ())
                        })
                        .catch (function () {
	                        loading .intent (['reset']);
                            tenure .end (true);	    
                            toast ('There was a problem loading your questions');
                            nav .state (['back']);
                        })
	            }
	        }
	        else if (intent [0] === 'back') {
	            return function (tenure) {
	                loader ();
                    inquire (api () .give_up_set)
                        .then (function () {
	                        api () .quiz .to (undefined);
	                        loading .intent (['reset']);              
                            loader .stop ();
                            tenure .end (true);	  
                			nav .state (['back']);
                        })
	            }
	        }
	        else if (intent [0] === 'start') {
	            return function (tenure) {
                    tenure .end (true);	                
        			nav .state (['start']);
	            }
	        }
	        else
	            return decline_ (intnet)
	    }));
	    
		[back]
			.forEach (tap (function () {
			    extension .intent (['back']);
			}))   
		[start]
			.forEach (tap (function () {
			    extension .intent (['start']);
			}))    
		
	    
	    return {
	        _: extension,
	        loading: loading
	    }
	}
    var interaction_loading = function (loading_dom, loaded_dom, loader_dom, loads_dom) {
    	var hue = { hue: 0 };
    	
    	var loading = new TimelineMax ({ repeat: -1 });
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 45, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 90, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 135, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 180, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 225, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 270, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 315, svgOrigin: "50 50" }));
    	loading .add (TweenLite .to (loader_dom, 0.5, { rotation: 360, svgOrigin: "50 50" }));
    	
    	loading .add (
    		TweenLite .to (hue, 4, {
    			hue: 360,
    			onUpdate: function () {
    				[] .forEach .call (loads_dom, function (e) {
    					e .style .fill = 'hsl(' + hue.hue + ', 80%, 30%)';
    				})
    			}
    		}),
    		0
    	);
    	
    	var reseting = new TimelineMax ();
    	reseting .add (TweenLite .to (loading_dom, 1, { opacity: 0 }));
    	
        var _ =  interaction (transition (function (intent, license) {
            if (intent [0] === 'prepare') {
                return function (tenure) {
                    reseting .pause (0);
                    loading .play (0);
                    loaded_dom .style .visibility = 'hidden';
                    tenure ('loading');
                    tenure .end (true);
                }
            }
            else if (intent [0] === 'reset') {
                return function (tenure) {
                    wait (1000 * Math .max (4 - loading .time (), 0)) .then (function () {
                        loading .pause ();
                        reseting .play (0);
                        loaded_dom .style .visibility = '';
                        tenure (undefined);
                        tenure .end (true);
                        if (license ())
                            _ .intent (license ());
                    })
                }
            }
            else
                return decline_ (intent)
        }))
        return _;
    }
    window .uis = R .assoc (
    	'quiz', function (components, unions) {
			var nav = unions .nav;
			
			var dom = ui_info .dom .cloneNode (true);
	
			var all_dom = dom .querySelectorAll ('#template > :not(#background)');
			
			var back_dom = dom .querySelector ('#back[action=nav]');
			var back_stream = stream_from_click_on (back_dom);
			
			var start_dom = dom .querySelector ('#start[action=focus]');
			var start_stream = stream_from_click_on (start_dom);
			
			var title_dom = dom .querySelector ('#title #hint[for=text]');
			    title_dom = title_dom .querySelector ('[text]');
			var icon_dom = dom .querySelector ('#icon #hint[for=image]');
			    icon_dom = icon_dom .querySelector ('img');
			
			var loading_dom = dom .querySelector ('#loading');
	    		var fun_loader_dom = dom .querySelector ('#hint[for=fun-loader]');
	    		    var loader_dom = fun_loader_dom .querySelector ('[loader]');
	    		    var loads_dom = fun_loader_dom .querySelectorAll ('circle');
			
			return R .merge (R .__, {
    		    nav: nav,
    		    dom: dom
    		}) (_interaction_ (
		        {
		            all: all_dom,
    				back: back_stream,
    				start: start_stream,
    				title: title_dom,
    				icon: icon_dom,
    				loading: interaction_loading (loading_dom, start_dom, loader_dom, loads_dom)
    			},
    			{
    				nav: nav 
    			}
			));
		}
	) (window .uis);
} ()