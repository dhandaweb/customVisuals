var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var visual;
        (function (visual) {
            var multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E;
            (function (multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E) {
                "use strict";
                var DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;
                var VisualSettings = (function (_super) {
                    __extends(VisualSettings, _super);
                    function VisualSettings() {
                        var _this = _super !== null && _super.apply(this, arguments) || this;
                        _this.dataPoint = new dataPointSettings();
                        _this.IndicatorColor = {
                            "RedGreen": ["red", "green"],
                            "GreenRed": ["green", "red"]
                        };
                        return _this;
                    }
                    return VisualSettings;
                }(DataViewObjectsParser));
                multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.VisualSettings = VisualSettings;
                var dataPointSettings = (function () {
                    function dataPointSettings() {
                        // Default color
                        this.defaultColor = "";
                        // Show all
                        this.showAllDataPoints = true;
                        // Fill
                        this.fill = "";
                        // Color saturation
                        this.fillRule = "";
                        // Text Size
                        this.fontSize = 12;
                        // Actual
                        this.showActual = true;
                    }
                    return dataPointSettings;
                }());
                multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.dataPointSettings = dataPointSettings;
            })(multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E = visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E || (visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E = {}));
        })(visual = extensibility.visual || (extensibility.visual = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var visual;
        (function (visual) {
            var multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E;
            (function (multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E) {
                var DefaultHandleTouchDelay = 1000;
                function createTooltipServiceWrapper(tooltipService, rootElement, handleTouchDelay) {
                    if (handleTouchDelay === void 0) { handleTouchDelay = DefaultHandleTouchDelay; }
                    return new TooltipServiceWrapper(tooltipService, rootElement, handleTouchDelay);
                }
                multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.createTooltipServiceWrapper = createTooltipServiceWrapper;
                var TooltipServiceWrapper = (function () {
                    function TooltipServiceWrapper(tooltipService, rootElement, handleTouchDelay) {
                        this.visualHostTooltipService = tooltipService;
                        this.handleTouchDelay = handleTouchDelay;
                        this.rootElement = rootElement;
                    }
                    TooltipServiceWrapper.prototype.addTooltip = function (selection, getTooltipInfoDelegate, getDataPointIdentity, reloadTooltipDataOnMouseMove) {
                        var _this = this;
                        if (!selection || !this.visualHostTooltipService.enabled()) {
                            return;
                        }
                        var rootNode = this.rootElement;
                        // Mouse events
                        selection.on("mouseover.tooltip", function () {
                            // Ignore mouseover while handling touch events
                            if (!_this.canDisplayTooltip(d3.event))
                                return;
                            var tooltipEventArgs = _this.makeTooltipEventArgs(rootNode, true, false);
                            if (!tooltipEventArgs)
                                return;
                            var tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
                            if (tooltipInfo == null)
                                return;
                            var selectionId = getDataPointIdentity(tooltipEventArgs);
                            _this.visualHostTooltipService.show({
                                coordinates: tooltipEventArgs.coordinates,
                                isTouchEvent: false,
                                dataItems: tooltipInfo,
                                identities: selectionId ? [selectionId] : [],
                            });
                        });
                        selection.on("mouseout.tooltip", function () {
                            _this.visualHostTooltipService.hide({
                                isTouchEvent: false,
                                immediately: false,
                            });
                        });
                        selection.on("mousemove.tooltip", function () {
                            // Ignore mousemove while handling touch events
                            if (!_this.canDisplayTooltip(d3.event))
                                return;
                            var tooltipEventArgs = _this.makeTooltipEventArgs(rootNode, true, false);
                            if (!tooltipEventArgs)
                                return;
                            var tooltipInfo;
                            if (reloadTooltipDataOnMouseMove) {
                                tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
                                if (tooltipInfo == null)
                                    return;
                            }
                            var selectionId = getDataPointIdentity(tooltipEventArgs);
                            _this.visualHostTooltipService.move({
                                coordinates: tooltipEventArgs.coordinates,
                                isTouchEvent: false,
                                dataItems: tooltipInfo,
                                identities: selectionId ? [selectionId] : [],
                            });
                        });
                        // --- Touch events ---
                        var touchStartEventName = TooltipServiceWrapper.touchStartEventName();
                        var touchEndEventName = TooltipServiceWrapper.touchEndEventName();
                        var isPointerEvent = TooltipServiceWrapper.usePointerEvents();
                        selection.on(touchStartEventName + '.tooltip', function () {
                            _this.visualHostTooltipService.hide({
                                isTouchEvent: true,
                                immediately: true,
                            });
                            var tooltipEventArgs = _this.makeTooltipEventArgs(rootNode, isPointerEvent, true);
                            if (!tooltipEventArgs)
                                return;
                            var tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
                            var selectionId = getDataPointIdentity(tooltipEventArgs);
                            _this.visualHostTooltipService.show({
                                coordinates: tooltipEventArgs.coordinates,
                                isTouchEvent: true,
                                dataItems: tooltipInfo,
                                identities: selectionId ? [selectionId] : [],
                            });
                        });
                        selection.on(touchEndEventName + '.tooltip', function () {
                            _this.visualHostTooltipService.hide({
                                isTouchEvent: true,
                                immediately: false,
                            });
                            if (_this.handleTouchTimeoutId)
                                clearTimeout(_this.handleTouchTimeoutId);
                            // At the end of touch action, set a timeout that will let us ignore the incoming mouse events for a small amount of time
                            // TODO: any better way to do this?
                            _this.handleTouchTimeoutId = setTimeout(function () {
                                _this.handleTouchTimeoutId = undefined;
                            }, _this.handleTouchDelay);
                        });
                    };
                    TooltipServiceWrapper.prototype.hide = function () {
                        this.visualHostTooltipService.hide({ immediately: true, isTouchEvent: false });
                    };
                    TooltipServiceWrapper.prototype.makeTooltipEventArgs = function (rootNode, isPointerEvent, isTouchEvent) {
                        var target = d3.event.target;
                        var data = d3.select(target).datum();
                        var mouseCoordinates = this.getCoordinates(rootNode, isPointerEvent);
                        var elementCoordinates = this.getCoordinates(target, isPointerEvent);
                        var tooltipEventArgs = {
                            data: data,
                            coordinates: mouseCoordinates,
                            elementCoordinates: elementCoordinates,
                            context: target,
                            isTouchEvent: isTouchEvent
                        };
                        return tooltipEventArgs;
                    };
                    TooltipServiceWrapper.prototype.canDisplayTooltip = function (d3Event) {
                        var canDisplay = true;
                        var mouseEvent = d3Event;
                        if (mouseEvent.buttons !== undefined) {
                            // Check mouse buttons state
                            var hasMouseButtonPressed = mouseEvent.buttons !== 0;
                            canDisplay = !hasMouseButtonPressed;
                        }
                        // Make sure we are not ignoring mouse events immediately after touch end.
                        canDisplay = canDisplay && (this.handleTouchTimeoutId == null);
                        return canDisplay;
                    };
                    TooltipServiceWrapper.prototype.getCoordinates = function (rootNode, isPointerEvent) {
                        var coordinates;
                        if (isPointerEvent) {
                            // copied from d3_eventSource (which is not exposed)
                            var e = d3.event, s = void 0;
                            while (s = e.sourceEvent)
                                e = s;
                            var rect = rootNode.getBoundingClientRect();
                            coordinates = [e.clientX - rect.left - rootNode.clientLeft, e.clientY - rect.top - rootNode.clientTop];
                        }
                        else {
                            var touchCoordinates = d3.touches(rootNode);
                            if (touchCoordinates && touchCoordinates.length > 0) {
                                coordinates = touchCoordinates[0];
                            }
                        }
                        return coordinates;
                    };
                    TooltipServiceWrapper.touchStartEventName = function () {
                        var eventName = "touchstart";
                        if (window["PointerEvent"]) {
                            // IE11
                            eventName = "pointerdown";
                        }
                        return eventName;
                    };
                    TooltipServiceWrapper.touchMoveEventName = function () {
                        var eventName = "touchmove";
                        if (window["PointerEvent"]) {
                            // IE11
                            eventName = "pointermove";
                        }
                        return eventName;
                    };
                    TooltipServiceWrapper.touchEndEventName = function () {
                        var eventName = "touchend";
                        if (window["PointerEvent"]) {
                            // IE11
                            eventName = "pointerup";
                        }
                        return eventName;
                    };
                    TooltipServiceWrapper.usePointerEvents = function () {
                        var eventName = TooltipServiceWrapper.touchStartEventName();
                        return eventName === "pointerdown" || eventName === "MSPointerDown";
                    };
                    return TooltipServiceWrapper;
                }());
            })(multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E = visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E || (visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E = {}));
        })(visual = extensibility.visual || (extensibility.visual = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var visual;
        (function (visual) {
            var multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E;
            (function (multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E) {
                "use strict";
                var Visual = (function () {
                    function Visual(options) {
                        this.showActual = false;
                        this.actualHeader = "Actual";
                        this.showChange = true;
                        this.changeHeader = "Change";
                        this.showPerChange = true;
                        this.percentageChangeHeader = "% Change";
                        this.showTotalChange = false;
                        this.totalChangeHeader = "Tot Change";
                        this.showTarget = true;
                        this.targetHeader = "Target";
                        this.showVariance = true;
                        this.varianceHeader = "Variance";
                        this.showVariancePer = true;
                        this.variancePerHeader = "% Variance";
                        this.bulletScaleMinZero = true;
                        this.trendIndicator = true;
                        this.flipTrendDirection = false;
                        this.trendColor = "RedGreen";
                        this.trendColorOptions = {
                            "RedGreen": ["#ff4701", "#00ad00"],
                            "GreenRed": ["#00ad00", "#ff4701"]
                        };
                        this.intensity = true;
                        this.intensityScale = "10,40 60,80";
                        this.intensityColor = { solid: { color: "#4682b4" } };
                        this.conditionalBullet = true;
                        this.conditionalBulletColorScale = "5,10,100";
                        this.conditionalBulletColorOptions = {
                            "RedGreen": ["#ff4701", "#00ad00"],
                            "GreenRed": ["#00ad00", "#ff4701"]
                        };
                        this.conditionalBulletColor = "GreenRed";
                        this.singleBulletColor = { solid: { color: "#4682b4" } };
                        this.aboveThresholdColor = { solid: { color: "#00ad00" } };
                        this.belowThreshold1Color = { solid: { color: "#fff701" } };
                        this.belowThreshold2Color = { solid: { color: "#ffbd01" } };
                        this.belowThreshold3Color = { solid: { color: "#ff7601" } };
                        this.belowThreshold4Color = { solid: { color: "#ff4701" } };
                        this.element = d3.select(options.element);
                        this.host = options.host;
                        this.tooltipServiceWrapper = multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.createTooltipServiceWrapper(this.host.tooltipService, options.element);
                        this.selectionManager = options.host.createSelectionManager();
                    }
                    Visual.prototype.update = function (options) {
                        var _this = this;
                        this.columns = options.dataViews[0].metadata.columns;
                        //console.log(options.dataViews[0]);
                        this.selectionManager.registerOnSelectCallback(function () {
                            rows.style("opacity", 1);
                        });
                        if (options.dataViews[0].metadata.objects) {
                            if (options.dataViews[0].metadata.objects["Actual"]) {
                                var actObj = options.dataViews[0].metadata.objects["Actual"];
                                //if (actObj.showActual !== undefined) this.showActual = actObj["showActual"];
                                if (actObj["actualHeader"] !== undefined)
                                    this.actualHeader = actObj["actualHeader"];
                                if (actObj["showChange"] !== undefined)
                                    this.showChange = actObj["showChange"];
                                if (actObj["changeHeader"] !== undefined)
                                    this.changeHeader = actObj["changeHeader"];
                                if (actObj["showPerChange"] !== undefined)
                                    this.showPerChange = actObj["showPerChange"];
                                if (actObj["percentageChangeHeader"] !== undefined)
                                    this.percentageChangeHeader = actObj["percentageChangeHeader"];
                                // if (actObj["showTotalChange"] !== undefined) this.showTotalChange = actObj["showTotalChange"];
                                if (actObj["totalChangeHeader"] !== undefined)
                                    this.totalChangeHeader = actObj["totalChangeHeader"];
                            }
                            if (options.dataViews[0].metadata.objects["Target"]) {
                                var targetObj = options.dataViews[0].metadata.objects["Target"];
                                if (targetObj["showTarget"] !== undefined)
                                    this.showTarget = targetObj["showTarget"];
                                if (targetObj["showTarget"] !== undefined)
                                    this.showTarget = targetObj["showTarget"];
                                if (targetObj["targetHeader"] !== undefined)
                                    this.targetHeader = targetObj["targetHeader"];
                                if (targetObj["showVariance"] !== undefined)
                                    this.showVariance = targetObj["showVariance"];
                                if (targetObj["varianceHeader"] !== undefined)
                                    this.varianceHeader = targetObj["varianceHeader"];
                                if (targetObj["showVariancePer"] !== undefined)
                                    this.showVariancePer = targetObj["showVariancePer"];
                                if (targetObj["variancePerHeader"] !== undefined)
                                    this.variancePerHeader = targetObj["variancePerHeader"];
                            }
                            if (options.dataViews[0].metadata.objects["Trend"]) {
                                var trendObj = options.dataViews[0].metadata.objects["Trend"];
                                if (trendObj["show"] !== undefined)
                                    this.trendIndicator = trendObj["show"];
                                if (trendObj["flipTrendDirection"] !== undefined)
                                    this.flipTrendDirection = trendObj["flipTrendDirection"];
                                if (trendObj["trendColor"] !== undefined)
                                    this.trendColor = trendObj["trendColor"];
                            }
                            if (options.dataViews[0].metadata.objects["Bullet"]) {
                                var bulletObj = options.dataViews[0].metadata.objects["Bullet"];
                                if (bulletObj["conditionalBullet"] !== undefined)
                                    this.conditionalBullet = bulletObj["conditionalBullet"];
                                if (bulletObj["conditionalBulletColor"] !== undefined)
                                    this.conditionalBulletColor = bulletObj["conditionalBulletColor"];
                                if (bulletObj["conditionalBulletColor"] !== undefined)
                                    this.conditionalBulletColor = bulletObj["conditionalBulletColor"];
                                if (bulletObj["conditionalBulletColorScale"] !== undefined)
                                    this.conditionalBulletColorScale = bulletObj["conditionalBulletColorScale"];
                                if (bulletObj["bulletScaleMinZero"] !== undefined)
                                    this.bulletScaleMinZero = bulletObj["bulletScaleMinZero"];
                            }
                            if (options.dataViews[0].metadata.objects["Intensity"]) {
                                var intensityObj = options.dataViews[0].metadata.objects["Intensity"];
                                if (intensityObj["show"] !== undefined)
                                    this.intensity = intensityObj["show"];
                                if (intensityObj["intensityScale"] !== undefined)
                                    this.intensityScale = intensityObj["intensityScale"];
                                if (intensityObj["intensityColor"] !== undefined)
                                    this.intensityColor = intensityObj["intensityColor"];
                            }
                            if (options.dataViews[0].metadata.objects["Threshold"]) {
                                var thresholdObj = options.dataViews[0].metadata.objects["Threshold"];
                                if (thresholdObj["aboveThresholdColor"] !== undefined)
                                    this.aboveThresholdColor = thresholdObj["aboveThresholdColor"];
                                if (thresholdObj["belowThreshold1Color"] !== undefined)
                                    this.belowThreshold1Color = thresholdObj["belowThreshold1Color"];
                                if (thresholdObj["belowThreshold2Color"] !== undefined)
                                    this.belowThreshold2Color = thresholdObj["belowThreshold2Color"];
                                if (thresholdObj["belowThreshold3Color"] !== undefined)
                                    this.belowThreshold3Color = thresholdObj["belowThreshold3Color"];
                                if (thresholdObj["belowThreshold4Color"] !== undefined)
                                    this.belowThreshold4Color = thresholdObj["belowThreshold4Color"];
                            }
                        }
                        this.hasTarget = false;
                        this.hasActual = false;
                        this.hasPeriod = false;
                        this.hasGroup = false;
                        this.columns.map(function (d, i) {
                            if (d.roles["target"]) {
                                _this.hasTarget = true;
                                _this.targetIndex = i;
                            }
                            if (d.roles["actual"]) {
                                _this.hasActual = true;
                                _this.actualIndex = i;
                            }
                            if (d.roles["group"]) {
                                _this.hasGroup = true;
                                _this.groupIndex = i;
                            }
                            if (d.roles["period"]) {
                                _this.hasPeriod = true;
                                _this.periodIndex = i;
                            }
                            return d;
                        });
                        this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value: 1001 });
                        if (this.hasActual)
                            this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.actualIndex].format });
                        else if (this.hasTarget)
                            this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.targetIndex].format });
                        var nestedData, data = [], identityData;
                        options.dataViews[0].table.rows = options.dataViews[0].table.rows.map(function (d, i) {
                            d.identity = options.dataViews[0].table.identity[i];
                            return d;
                        });
                        if (this.hasGroup && this.hasPeriod) {
                            nestedData = d3.nest()
                                .key(function (d) { return d[_this.groupIndex]; })
                                .entries(options.dataViews[0].table.rows);
                        }
                        else if (this.hasPeriod) {
                            nestedData = [{
                                    key: options.dataViews[0].metadata.columns[this.actualIndex].displayName,
                                    values: options.dataViews[0].table.rows
                                }];
                        }
                        nestedData.map(function (d, i) {
                            var actual = _this.hasActual ? d.values[d.values.length - 1][_this.actualIndex] : 0;
                            var secondLastActual = _this.hasActual ? d.values[d.values.length - 2][_this.actualIndex] : 0;
                            var firstActual = _this.hasActual ? d.values[0][_this.actualIndex] : 0;
                            var target = _this.hasTarget ? d.values[d.values.length - 1][_this.targetIndex] : 0;
                            d.values.map(function (d) {
                                d.yValue = _this.hasActual ? d[_this.actualIndex] : 0;
                                d.xValue = _this.hasPeriod ? d[_this.periodIndex] : "";
                            });
                            var VP = 0;
                            if (_this.hasActual && _this.hasTarget) {
                                var current = d.values[d.values.length - 1][_this.actualIndex];
                                var target = d.values[d.values.length - 1][_this.targetIndex];
                                VP = ((current - target) / Math.abs(target)) * 100;
                            }
                            var percentage, last, secondlast, retVal;
                            if (d.values.length > 1) {
                                var last = d.values[d.values.length - 1][_this.actualIndex];
                                var secondlast = d.values[d.values.length - 2][_this.targetIndex];
                                percentage = ((last - secondlast) / Math.abs(secondlast)) * 100;
                                if (last === null || secondlast === null)
                                    percentage = 0;
                            }
                            else
                                percentage = 0;
                            data.push({
                                key: d.key,
                                actual: actual,
                                secondLastActual: secondLastActual,
                                change: actual - secondLastActual,
                                perChange: ((actual - secondLastActual) / Math.abs(secondLastActual)) * 100,
                                totalChange: ((actual - firstActual) / Math.abs(firstActual)) * 100,
                                trend: actual > secondLastActual ? 180 : 0,
                                target: target,
                                variance: actual - target,
                                variancePer: (VP).toFixed(2),
                                values: d.values,
                                percentage: percentage,
                                identity: d.values[0].identity
                            });
                        });
                        this.element.style("overflow", "auto");
                        this.element.select('.multipleSparkline').remove();
                        var table = this.element
                            .append("div")
                            .attr("class", "multipleSparkline")
                            .attr("style", "width:100%;")
                            .append("table")
                            .attr("style", "width:100%;text-align:left;border-spacing:0");
                        if (this.hasActual === false) {
                            table
                                .append("html")
                                .attr("style", "")
                                .html("Actual is required to draw the visual");
                            return;
                        }
                        var thead = table.append("thead");
                        var tbody = table.append("tbody");
                        var rows = tbody.selectAll(".rows")
                            .data(data)
                            .enter()
                            .append("tr")
                            .style("background", function (d, i) { return i % 2 === 0 ? "#fff" : "#ececec"; });
                        rows.on("click", function (d, i) {
                            d.isFiltered = !d.isFiltered;
                            d.values.forEach(function (d) {
                                var categoryColumn = {
                                    source: options.dataViews[0].table.columns[_this.groupIndex],
                                    values: null,
                                    identity: [d.identity]
                                };
                                var id = _this.host.createSelectionIdBuilder()
                                    .withCategory(categoryColumn, 0)
                                    .createSelectionId();
                                _this.selectionManager.select(id, true);
                            });
                            _this.setFilterOpacity(rows);
                        });
                        this.showIntensityCircle(rows, thead);
                        this.drawMetric(rows, thead);
                        this.drawSparkline(data, rows, thead);
                        this.drawBisectorToolTip();
                        this.drawCurrent(rows, thead);
                        this.drawPrior(rows, thead);
                        this.drawChange(rows, thead);
                        this.drawPerChange(rows, thead);
                        this.drawTotalChange(rows, thead);
                        this.showTrendIndicator(rows, thead);
                        this.drawActual(rows, thead);
                        this.drawBullet(data, rows, thead);
                        this.drawTarget(rows, thead);
                        this.drawVariance(rows, thead);
                        this.drawVariancePer(rows, thead);
                        this.drawAdditionalFields(rows, thead);
                        this.updateRowStyle(tbody, thead);
                    };
                    Visual.prototype.setFilterOpacity = function (rows) {
                        var anyFilter = false;
                        rows.each(function (d) {
                            if (d.isFiltered === true)
                                anyFilter = true;
                        });
                        if (anyFilter) {
                            rows.style("opacity", function (d) { return d.isFiltered ? 1 : 0.2; });
                        }
                        else {
                            rows.style("opacity", 1);
                        }
                    };
                    Visual.prototype.drawMetric = function (rows, thead) {
                        thead.append("th")
                            .append("span")
                            .html("Metric");
                        rows
                            .append("td")
                            .append("html")
                            .text(function (d) { return d.key; });
                    };
                    Visual.prototype.drawCurrent = function (rows, thead) {
                        var _this = this;
                        thead.append("th")
                            .append("span")
                            .html("Current");
                        var current = rows
                            .append("td")
                            .attr("class", "currentText")
                            .append("html");
                        current.text(function (d) { return _this.iValueFormatter.format(d.values[d.values.length - 1].yValue); });
                        this.tooltipServiceWrapper.addTooltip(current, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'Current'); }, function (tooltipEvent) { return null; });
                    };
                    Visual.prototype.drawPrior = function (rows, thead) {
                        var _this = this;
                        thead.append("th")
                            .append("span")
                            .html("Prior");
                        var prior = rows
                            .append("td")
                            .append("html")
                            .text(function (d) { return _this.iValueFormatter.format(d.values[d.values.length - 2].yValue); });
                        this.tooltipServiceWrapper.addTooltip(prior, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'Prior'); }, function (tooltipEvent) { return null; });
                    };
                    Visual.prototype.drawSparkline = function (data, rows, thead) {
                        if (this.hasActual) {
                            thead.append("th")
                                .append("span")
                                .html("Sparkline");
                            this.sparklineSelection = rows.append("td")
                                .append("svg")
                                .attr("width", 120)
                                .attr("height", 30);
                            this.sparklineSelection.append("path")
                                .attr("class", "line")
                                .attr("style", "stroke: steelblue; stroke-width:2; fill: none;")
                                .attr("d", function (d) {
                                var xDomain = [];
                                var yDomain = [];
                                d.values.map(function (d) {
                                    xDomain.push(d.xValue);
                                    yDomain.push(d.yValue);
                                });
                                var xScale = d3.scale.ordinal().rangeRoundBands([0, 120]).domain(xDomain);
                                var yScale = d3.scale.linear().range([25, 0]).domain([d3.min(yDomain), d3.max(yDomain)]);
                                return "M" + d.values.map(function (d) {
                                    return xScale("" + d.xValue + "") + ',' + yScale(d.yValue);
                                }).join('L');
                            });
                        }
                    };
                    Visual.prototype.drawActual = function (rows, thead) {
                        var _this = this;
                        if (this.showActual && this.showTarget) {
                            thead.append("th")
                                .append("span")
                                .html(this.actualHeader);
                            var actual = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return _this.iValueFormatter.format(d.actual); });
                            this.tooltipServiceWrapper.addTooltip(actual, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'Actual'); }, function (tooltipEvent) { return null; });
                        }
                    };
                    Visual.prototype.drawChange = function (rows, thead) {
                        var _this = this;
                        if (this.hasActual && this.showChange) {
                            thead.append("th")
                                .append("span")
                                .html(this.changeHeader);
                            var change = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return d.change; });
                            change.text(function (d) { return _this.iValueFormatter.format(d.change); });
                            this.tooltipServiceWrapper.addTooltip(change, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'Change'); }, function (tooltipEvent) { return null; });
                        }
                    };
                    Visual.prototype.drawPerChange = function (rows, thead) {
                        if (this.hasActual && this.showPerChange) {
                            thead.append("th")
                                .append("span")
                                .html(this.percentageChangeHeader);
                            var perChange = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return d.perChange.toFixed(2) + "%"; });
                        }
                    };
                    Visual.prototype.drawTotalChange = function (rows, thead) {
                        if (this.hasActual && this.showTotalChange) {
                            thead.append("th")
                                .append("span")
                                .html(this.totalChangeHeader);
                            var perChange = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return d.totalChange.toFixed(2) + "%"; });
                        }
                    };
                    Visual.prototype.showTrendIndicator = function (rows, thead) {
                        var color = this.trendColorOptions[this.trendColor];
                        if (this.trendIndicator === true) {
                            thead.append("th")
                                .append("span")
                                .html(" ");
                            var trendIndicator = rows
                                .append("td")
                                .append("svg")
                                .attr("width", 20)
                                .attr("height", 20);
                            var triangleDirection = this.flipTrendDirection == false ? 'triangle-down' : 'triangle-up';
                            var triangle = d3.svg.symbol().type(triangleDirection).size(70);
                            trendIndicator
                                .append("path")
                                .attr('d', triangle)
                                .attr('transform', function (d) {
                                return "translate(10,12), rotate(" + d.trend + ")";
                            })
                                .style("fill", function (d) { return d.trend === 0 ? color[0] : color[1]; });
                        }
                    };
                    Visual.prototype.showIntensityCircle = function (rows, thead) {
                        if (this.intensity === true) {
                            var rangeArr = [10, 40, 60, 80];
                            var threshold = 10;
                            if (this.intensityScale.length > 0) {
                                var rangeArrr = this.intensityScale.split(",");
                                threshold = parseFloat(rangeArrr[0]);
                                rangeArr = rangeArrr.map(function (d) { return parseFloat(d); }).concat([100]);
                            }
                            var colorRange = (d3.range(1, 10, (10 / (rangeArr.length - 1)))).concat([10]);
                            var colorIntensityScale = d3.scale.threshold()
                                .domain((rangeArr))
                                .range(colorRange);
                            thead.append("th")
                                .append("span")
                                .html(" ");
                            var intensityCircle = rows
                                .append("td")
                                .append("svg")
                                .attr("width", 20)
                                .attr("height", 20)
                                .append("circle")
                                .attr("cx", 5)
                                .attr("cy", 10)
                                .attr("r", 5)
                                .attr("fill", this.intensityColor.solid.color)
                                .style("opacity", function (d) {
                                var retVal, change = d.percentage * 100;
                                if (Math.abs(change / 100) > threshold)
                                    retVal = colorIntensityScale(Math.abs(d.percentage));
                                else
                                    retVal = 0;
                                return retVal / 10;
                            });
                        }
                    };
                    Visual.prototype.drawBullet = function (data, rows, thead) {
                        var _this = this;
                        if (this.hasTarget) {
                            thead.append("th")
                                .append("span")
                                .html("Bullet");
                            var targetMax = d3.max(data.map(function (d) { return d.target; }));
                            var actualMax = d3.max(data.map(function (d) { return d.actual; }));
                            var backgroundBarLen = d3.max([targetMax, actualMax]) * 1.15;
                            var min = 0;
                            if (this.bulletScaleMinZero === false)
                                min = d3.min(data.map(function (d) { return d.actual; }));
                            var barScale = d3.scale.linear().range([0, 120]).domain([min, backgroundBarLen]);
                            var bullet = rows.append("td")
                                .append("svg")
                                .attr("width", 120)
                                .attr("height", 20)
                                .attr("class", "bullet");
                            bullet.append("rect").attr("width", 120).attr("height", 20).attr("style", "fill:#d0cece;");
                            var bulletRect = bullet.append("rect")
                                .attr("width", function (d) { return barScale(d.actual); })
                                .attr("height", 20);
                            if (this.conditionalBullet === false) {
                                bulletRect.style("fill", this.singleBulletColor.solid.color);
                            }
                            else {
                                bulletRect
                                    .style("fill", function (d) {
                                    if (d.variance > 0)
                                        return _this.conditionalBulletColorOptions[_this.conditionalBulletColor][0];
                                    else
                                        return _this.conditionalBulletColorOptions[_this.conditionalBulletColor][1];
                                });
                            }
                            var thresholdData = this.columns.filter(function (d, i) {
                                d.Index = i;
                                return d.roles["threshold"] == true;
                            });
                            if (thresholdData.length > 0) {
                                bulletRect
                                    .style("fill", function (d) {
                                    var item = d.values[d.values.length - 1];
                                    var fill = "#fff";
                                    thresholdData.forEach(function (t, i) {
                                        if (d.target >= item[t.Index])
                                            fill = _this.aboveThresholdColor.solid.color;
                                        else {
                                            var y = 'belowThreshold' + (i + 1) + 'Color';
                                            if (d.target < item[t.Index])
                                                fill = _this[y].solid.color;
                                        }
                                    });
                                    return fill;
                                });
                            }
                            bullet.append("rect")
                                .attr("width", 2)
                                .attr("x", function (d) { return barScale(d.target); })
                                .attr("height", 20)
                                .attr("style", "fill:#000;");
                        }
                    };
                    Visual.prototype.drawTarget = function (rows, thead) {
                        var _this = this;
                        if (this.showTarget && this.hasTarget) {
                            thead.append("th")
                                .append("span")
                                .html(this.targetHeader);
                            var target = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return _this.iValueFormatter.format(d.target); });
                            this.tooltipServiceWrapper.addTooltip(target, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'Target'); }, function (tooltipEvent) { return null; });
                        }
                    };
                    Visual.prototype.drawVariance = function (rows, thead) {
                        var _this = this;
                        if (this.showVariance && this.hasTarget) {
                            thead.append("th")
                                .append("span")
                                .html(this.varianceHeader);
                            var variance = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return _this.iValueFormatter.format(d.variance); });
                            this.tooltipServiceWrapper.addTooltip(variance, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'Variance'); }, function (tooltipEvent) { return null; });
                        }
                    };
                    Visual.prototype.drawVariancePer = function (rows, thead) {
                        var _this = this;
                        if (this.showVariancePer && this.hasTarget) {
                            thead.append("th")
                                .append("span")
                                .html(this.variancePerHeader);
                            var variancePer = rows
                                .append("td")
                                .append("html")
                                .text(function (d) { return d.variancePer + "%"; });
                            this.tooltipServiceWrapper.addTooltip(variancePer, function (tooltipEvent) { return _this.getTooltipData(tooltipEvent.data, 'VariancePer'); }, function (tooltipEvent) { return null; });
                        }
                    };
                    Visual.prototype.drawAdditionalFields = function (rows, thead) {
                        var additional = this.columns.filter(function (d, i) {
                            d.Index = i;
                            return d.roles["additional"] == true;
                        });
                        additional.map(function (d) {
                            var format = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.format });
                            thead.append("th")
                                .append("span")
                                .html(d.displayName);
                            rows
                                .append("td")
                                .append("html")
                                .text(function (e) { return format.format(e.values[e.values.length - 1][d.Index]); });
                        });
                    };
                    //#region Tooltip
                    Visual.prototype.drawBisectorToolTip = function () {
                        var _this = this;
                        var self = this;
                        this.sparklineSelection
                            .on("mouseover", function (d) {
                            _this.sparklineMarker.style("display", null);
                        })
                            .on("mouseout", function (d) {
                            _this.sparklineMarker.style("display", "none");
                        })
                            .on("mousemove", function (d) {
                            self.mouseMove(d, this);
                        });
                        this.sparklineMarker = this.sparklineSelection
                            .append("g")
                            .attr("display", "none")
                            .attr("class", "bisector");
                        this.sparklineMarkerLine = this.sparklineMarker.append('line')
                            .attr('x1', 0)
                            .attr('y1', 0)
                            .attr('x2', 0)
                            .attr('y2', 30)
                            .attr('class', 'verticalLine')
                            .attr("cursor", "pointer");
                        this.sparklineCaptionName = this.sparklineMarker
                            .append("text")
                            .attr("dy", 15)
                            .attr("style", "cursor:pointer; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;");
                        this.sparklineCaptionValue = this.sparklineMarker
                            .append("text")
                            .attr("dy", 28)
                            .attr("style", "cursor:pointer; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;");
                    };
                    Visual.prototype.mouseMove = function (d, el) {
                        var _this = this;
                        var selected = d;
                        this.sparklineMarker.attr("style", function (d) {
                            return selected.key === d.key ? "display:inherit" : "display:none";
                        });
                        var xPos = d3.mouse(el)[0];
                        this.sparklineMarker.attr("transform", function () {
                            return "translate(" + (xPos) + ",0)";
                        });
                        var catScale = d3.scale.ordinal()
                            .rangeRoundBands([0, 120])
                            .domain(selected.values.map(function (d) { return d.xValue; }));
                        var leftEdges = catScale.domain().map(function (d, i) { return catScale.rangeBand() * i; });
                        var j;
                        for (j = 0; xPos > leftEdges[j] + (catScale.rangeBand() / 2); j++) { }
                        var hoverXValue = catScale.domain()[j];
                        var hoverVal;
                        selected.values.map(function (d) {
                            if (d.xValue === hoverXValue) {
                                hoverVal = _this.iValueFormatter.format(d.yValue);
                            }
                        });
                        this.sparklineCaptionName.text(hoverXValue);
                        this.sparklineCaptionValue.text(hoverVal);
                        if (xPos > 60) {
                            this.sparklineCaptionName.attr("x", -2)
                                .attr("text-anchor", "end");
                            this.sparklineCaptionValue.attr("x", -2)
                                .attr("text-anchor", "end");
                        }
                        else {
                            this.sparklineCaptionName.attr("x", 2)
                                .attr("text-anchor", "start");
                            this.sparklineCaptionValue.attr("x", 2)
                                .attr("text-anchor", "start");
                        }
                        this.sparklineMarkerLine.attr("stroke", "#000000");
                    };
                    //#endregion
                    Visual.prototype.updateRowStyle = function (tbody, thead) {
                        thead.selectAll("th").attr("style", "padding:5px;border-bottom: 1px solid #ee9207;");
                        tbody.selectAll("td").attr("style", "padding:5px;");
                    };
                    Visual.parseSettings = function (dataView) {
                        return multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.VisualSettings.parse(dataView);
                    };
                    Visual.prototype.getTooltipData = function (data, vtype) {
                        var retData = [];
                        var val = '';
                        switch (vtype) {
                            case 'Current':
                                val = data.values[data.values.length - 1].yValue;
                                break;
                            case 'Actual':
                                val = data.actual;
                                break;
                            case 'Target':
                                val = data.target;
                                break;
                            case 'Change':
                                val = data.change;
                                break;
                            case 'perChange':
                                val = data.perChange;
                                break;
                            case 'Prior':
                                val = data.values[data.values.length - 2].yValue;
                                break;
                            case 'Variance':
                                val = data.variance;
                                break;
                            case 'VariancePer':
                                val = data.variancePer;
                                break;
                        }
                        retData.push({
                            displayName: data.key,
                            value: val.toString(),
                            header: data.key
                        });
                        return retData;
                    };
                    Visual.prototype.enumerateObjectInstances = function (options) {
                        var objectName = options.objectName;
                        var objectEnumeration = [];
                        switch (objectName) {
                            case 'Actual':
                                // objectEnumeration.push({ objectName: objectName, properties: { showActual: this.showActual}, selector: null });
                                // objectEnumeration.push({ objectName: objectName, properties: { actualHeader: this.actualHeader},selector: null});
                                objectEnumeration.push({ objectName: objectName, properties: { showChange: this.showChange }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { changeHeader: this.changeHeader }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { showPerChange: this.showPerChange }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { percentageChangeHeader: this.percentageChangeHeader }, selector: null });
                                //objectEnumeration.push({ objectName: objectName, properties: { showTotalChange: this.showTotalChange }, selector: null });
                                // objectEnumeration.push({ objectName: objectName, properties: { totalChangeHeader: this.totalChangeHeader }, selector: null });
                                break;
                            case 'Target':
                                objectEnumeration.push({ objectName: objectName, properties: { showTarget: this.showTarget }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { targetHeader: this.targetHeader }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { showVariance: this.showVariance }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { varianceHeader: this.varianceHeader }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { showVariancePer: this.showVariancePer }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { variancePerHeader: this.variancePerHeader }, selector: null });
                                break;
                            case 'Trend':
                                objectEnumeration.push({ objectName: objectName, properties: { show: this.trendIndicator }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { flipTrendDirection: this.flipTrendDirection }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { trendColor: this.trendColor }, selector: null });
                                break;
                            case 'Intensity':
                                objectEnumeration.push({ objectName: objectName, properties: { show: this.intensity }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { intensityScale: this.intensityScale }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { intensityColor: this.intensityColor }, selector: null });
                                break;
                            case 'Bullet':
                                objectEnumeration.push({ objectName: objectName, properties: { conditionalBullet: this.conditionalBullet }, selector: null });
                                if (this.conditionalBullet)
                                    objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColor: this.conditionalBulletColor }, selector: null });
                                if (this.conditionalBullet)
                                    objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColorScale: this.conditionalBulletColorScale }, selector: null });
                                if (!this.conditionalBullet)
                                    objectEnumeration.push({ objectName: objectName, properties: { singleBulletColor: this.singleBulletColor }, selector: null });
                                objectEnumeration.push({ objectName: objectName, properties: { bulletScaleMinZero: this.bulletScaleMinZero }, selector: null });
                                break;
                            case 'Threshold':
                                var thresholdData = this.columns.filter(function (d, i) {
                                    d.Index = i;
                                    return d.roles["threshold"] == true;
                                });
                                // console.log();
                                if (thresholdData.length > 0) {
                                    objectEnumeration.push({ objectName: objectName, properties: { 'aboveThresholdColor': this.aboveThresholdColor }, selector: null });
                                    if (thresholdData.length > 0)
                                        objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold1Color': this.belowThreshold1Color }, selector: null });
                                    if (thresholdData.length > 1)
                                        objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold2Color': this.belowThreshold2Color }, selector: null });
                                    if (thresholdData.length > 2)
                                        objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold3Color': this.belowThreshold3Color }, selector: null });
                                    if (thresholdData.length > 3)
                                        objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold4Color': this.belowThreshold4Color }, selector: null });
                                    //thresholdData.forEach((d, i) => {
                                    //    let t = 'belowThreshold' + (i+1) + 'Color';
                                    //    console.log(t);
                                    //    console.log(this[t]);
                                    //    objectEnumeration.push({ objectName: objectName, properties: { t: this[t] }, selector: null });
                                    //});
                                }
                                break;
                        }
                        ;
                        return objectEnumeration;
                        //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
                    };
                    return Visual;
                }());
                multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.Visual = Visual;
            })(multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E = visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E || (visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E = {}));
        })(visual = extensibility.visual || (extensibility.visual = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var plugins;
        (function (plugins) {
            plugins.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E_DEBUG = {
                name: 'multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E_DEBUG',
                displayName: 'MultipleSparkline',
                class: 'Visual',
                version: '1.0.0',
                apiVersion: '1.11.0',
                create: function (options) { return new powerbi.extensibility.visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E.Visual(options); },
                custom: true
            };
        })(plugins = visuals.plugins || (visuals.plugins = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
//# sourceMappingURL=visual.js.map