// This patch prevents drawing a connection when the bounds are still infinite
// https://github.com/jsplumb/jsplumb/pull/788
(function () {
    "use strict";
    var root = this,
        _jp = root.jsPlumb,
        _ju = root.jsPlumbUtil;
    _ju.extend(_jp.Connection, _jp.OverlayCapableJsPlumbUIComponent, {
        paint: function (params) {

            if (!this._jsPlumb.instance.isSuspendDrawing() && this._jsPlumb.visible) {
                params = params || {};
                var timestamp = params.timestamp,
                // if the moving object is not the source we must transpose the two references.
                    swap = false,
                    tId = swap ? this.sourceId : this.targetId, sId = swap ? this.targetId : this.sourceId,
                    tIdx = swap ? 0 : 1, sIdx = swap ? 1 : 0;

                if (timestamp == null || timestamp !== this._jsPlumb.lastPaintedAt) {
                    var sourceInfo = this._jsPlumb.instance.updateOffset({elId:sId}).o,
                        targetInfo = this._jsPlumb.instance.updateOffset({elId:tId}).o,
                        sE = this.endpoints[sIdx], tE = this.endpoints[tIdx];

                    var sAnchorP = sE.anchor.getCurrentLocation(
                        {
                            xy: [sourceInfo.left, sourceInfo.top],
                            wh: [sourceInfo.width, sourceInfo.height],
                            element: sE,
                            timestamp: timestamp,
                            rotation:this._jsPlumb.instance.getRotation(this.sourceId)
                        }),
                        tAnchorP = tE.anchor.getCurrentLocation({
                            xy: [targetInfo.left, targetInfo.top],
                            wh: [targetInfo.width, targetInfo.height],
                            element: tE,
                            timestamp: timestamp,
                            rotation:this._jsPlumb.instance.getRotation(this.targetId)
                        });

                    this.connector.resetBounds();

                    this.connector.compute({
                        sourcePos: sAnchorP,
                        targetPos: tAnchorP,
                        sourceOrientation:sE.anchor.getOrientation(sE),
                        targetOrientation:tE.anchor.getOrientation(tE),
                        sourceEndpoint: this.endpoints[sIdx],
                        targetEndpoint: this.endpoints[tIdx],
                        "stroke-width": this._jsPlumb.paintStyleInUse.strokeWidth,
                        sourceInfo: sourceInfo,
                        targetInfo: targetInfo
                    });

                    // If any of the bound coordinates is (still) infinite, the connection should not be drawn
                    if (this.connector.bounds.minX ===  Infinity ||
                        this.connector.bounds.maxX === -Infinity ||
                        this.connector.bounds.minY ===  Infinity ||
                        this.connector.bounds.maxY === -Infinity)
                    {
                        return;
                    }

                    var overlayExtents = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

                    // compute overlays. we do this first so we can get their placements, and adjust the
                    // container if needs be (if an overlay would be clipped)
                    for (var i in this._jsPlumb.overlays) {
                        if (this._jsPlumb.overlays.hasOwnProperty(i)) {
                            var o = this._jsPlumb.overlays[i];
                            if (o.isVisible()) {
                                this._jsPlumb.overlayPlacements[i] = o.draw(this.connector, this._jsPlumb.paintStyleInUse, this.getAbsoluteOverlayPosition(o));
                                overlayExtents.minX = Math.min(overlayExtents.minX, this._jsPlumb.overlayPlacements[i].minX);
                                overlayExtents.maxX = Math.max(overlayExtents.maxX, this._jsPlumb.overlayPlacements[i].maxX);
                                overlayExtents.minY = Math.min(overlayExtents.minY, this._jsPlumb.overlayPlacements[i].minY);
                                overlayExtents.maxY = Math.max(overlayExtents.maxY, this._jsPlumb.overlayPlacements[i].maxY);
                            }
                        }
                    }

                    var lineWidth = parseFloat(this._jsPlumb.paintStyleInUse.strokeWidth || 1) / 2,
                        outlineWidth = parseFloat(this._jsPlumb.paintStyleInUse.strokeWidth || 0),
                        extents = {
                            xmin: Math.min(this.connector.bounds.minX - (lineWidth + outlineWidth), overlayExtents.minX),
                            ymin: Math.min(this.connector.bounds.minY - (lineWidth + outlineWidth), overlayExtents.minY),
                            xmax: Math.max(this.connector.bounds.maxX + (lineWidth + outlineWidth), overlayExtents.maxX),
                            ymax: Math.max(this.connector.bounds.maxY + (lineWidth + outlineWidth), overlayExtents.maxY)
                        };
                    // paint the connector.
                    this.connector.paintExtents = extents;
                    this.connector.paint(this._jsPlumb.paintStyleInUse, null, extents);
                    // and then the overlays
                    for (var j in this._jsPlumb.overlays) {
                        if (this._jsPlumb.overlays.hasOwnProperty(j)) {
                            var p = this._jsPlumb.overlays[j];
                            if (p.isVisible()) {
                                p.paint(this._jsPlumb.overlayPlacements[j], extents);
                            }
                        }
                    }
                }
                this._jsPlumb.lastPaintedAt = timestamp;
            }
        }
    });
}).call(typeof window !== 'undefined' ? window : this);
