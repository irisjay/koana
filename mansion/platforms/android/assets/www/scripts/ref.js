var ref =	function (ref_changes) {
				return	ref_changes
							.thru (filter, function (change) {
								return change .add;
							})
							.thru (map, function (change) {
								return change .add;
							});
			};
var ref_set =	function (ref_changes) {
					var refs = [];
					ref_changes .thru (tap, function (change) {
						if (change .add)
							refs .push (change .add);
						if (change .remove)
							refs .splice (refs .indexOf (change .remove), 1);
					})
					return	ref_changes
								.thru (map, function () {
									return Object .create (refs);
								});
				};	

(function () {
	riot .mixin (
		{
			init:	function () {
						(function (self) {
							var last_refs = {};
							mergeAll ([self .event ('mount'), self .event ('updated'), self .event ('before-unmount')])
								.map (function () {
									return self .refs
								})
								.map (function (current) {
									var prev_refs = last_refs;
									last_refs = consistentfy (current);
								    return diff_refs (prev_refs, current);
								})
								.thru (spread)
								.thru (tap, function (change) {
									var diff = {};
									diff [change .type] = change .node;
									
									if (Node .prototype .isPrototypeOf (change .node)) {
										if (change .type === 'add') {
											var node = change .node;
											node .event = events_for (node);
							    			node .uses = belongs_to (node);
										}
										/*if (change .type === 'remove')
											send_dom_event (change .node) ('unmount');*/
									}//log ('detected', change .ref, self .dialogue (change .ref));
									((self .dialogue (change .ref) || {}) .ask || noop) (diff);
								})
						}) (this);			
					}
		} );
							var diff_refs =	function (last_refs, now_refs) {
												now_refs = consistentfy (now_refs);
								
											    var diff = [];
											    //debugger;
											    for (var ref in now_refs) {
											    	for (var node of now_refs [ref]) {
											    		var node_index;
											    		if (last_refs [ref] && (node_index = last_refs [ref] .indexOf (node)) !== -1) {
											    			last_refs [ref] .splice (node_index, 1);
											    		}
											    		else {
											    			diff .unshift ({ ref: ref, type: 'add', node: node });
											    		}
											    	}
											    } 
											    for (var ref in last_refs) {
											    	for (var node of last_refs [ref]) {
											    		diff .unshift ({ ref: ref, type: 'remove', node: node });
											    	}
											    } 
											    return diff;
											};
}) ();