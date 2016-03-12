/**
 * JQuery MultiDraggable Plugin
 *
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Written by Sudheer Someshwara <sudheer.someshwara@gmail.com>. Changes made by Sprout to make use of jsPlumb.
 *
 * MultiDraggable is a jQuery plugin which extends jQuery UI Draggable to add multi drag and live functionality.
 *
**/
(function ($, undefined) {
   $.fn.multiDraggable = function (opts) {
   	var initLeftOffset = []
   	    ,initTopOffset = [];
   	var clickedNode;
   	return this.each(function () {
	         if (!$(this).data("init")) {
	            $(this).data("init", true).draggable(opts,{
	                helper: function() { 
	                	clickedNode = this;
	            		var div = "<div id='clone'>";
	            		$(opts.container).append(div);
						var pos = $(this).position();
						$.each($(opts.groupSel).add(this) || {}, function(key,value) {
							var elemPos = $(value).position();
							initLeftOffset[key] = elemPos.left - pos.left;
							initTopOffset[key] = elemPos.top - pos.top;
							var cloneNode = value.cloneNode(true);
							cloneNode.id += "_clone";
							$(cloneNode).addClass("silhouettes");
							$("#clone").append(cloneNode);
							clonePos = $(cloneNode).offset();
							$(cloneNode).offset({
								top: clonePos.top - pos.top,
								left: clonePos.left - pos.left,
							});
						});
						return $("#clone");
	            	},
			        start: function (event,ui) {
			        	opts.startNative ? opts.startNative() : {};
					},
					drag: function(event,ui) {
						opts.dragNative ? opts.dragNative() : {};
					},
					stop: function(event,ui) {
						var pos = $(ui.helper).offset();
						$.each($(opts.groupSel).add(clickedNode) || {}, function(key,value) {
							$(value).offset({left: pos.left + initLeftOffset[key], 
							top: pos.top + initTopOffset[key]});
							jsPlumb.repaint($(this));
						});
						$("#clone").remove();
						opts.stopNative ? opts.stopNative() : {};
					},
				});
	        }
 	 });
   };
 }(jQuery));