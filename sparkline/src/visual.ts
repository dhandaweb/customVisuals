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


module powerbi.extensibility.visual {
    "use strict";

    export class Visual implements IVisual {

        private host: IVisualHost;
        //  private tooltipServiceWrapper: ITooltipServiceWrapper;

        private selectionManager: ISelectionManager;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;

        private columns: any;
        private selectedTemplate: any = "defaut";

        private actualIndex: number;
        private hasActual: any;
        private actualHeader: any = "";
        private actualColor: any = { solid: { color: "#01b8aa" } };

        private targetIndex: number;
        private hasTarget: any;
        private targetHeader: any = "";
        private targetColor: any = { solid: { color: "#374649" } };

        private trendIndicator: any = true;
        private flipTrendDirection: any = false;
        private trendColor: any = "GreenRed";
        private trendColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00", "#ff4701"]
        };
      
        private lineStroke: any = 20;

        private hasPeriod: any;
        private periodIndex: number;
        private dateFormat: any;

        private iValueFormatter: any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private displayAs: any = "line";
        private showBorder: any = true;

        private sparklineSelection: d3.Selection<SVGElement>;
        private sparklineMarker: d3.Selection<SVGElement>;
        private sparklineMarkerLine: d3.Selection<SVGElement>;
        private sparklineCaptionName: d3.Selection<SVGElement>;
        private sparklineCaptionValue: d3.Selection<SVGElement>;

        private chartData: any;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;


        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            this.setProperties(options);

            this.hasTarget = false;
            this.hasActual = false;
            this.hasPeriod = false;

            this.columns.forEach((d, i) => {
                if (d.roles["target"]) {
                    this.hasTarget = true;
                    this.targetIndex = i;
                }
                if (d.roles["actual"]) {
                    this.hasActual = true;
                    this.actualIndex = i;
                }
                if (d.roles["period"]) {
                    this.hasPeriod = true;
                    this.periodIndex = i;

                    this.dateFormat = d.format;

                }
            });


            this.element.style("overflow", "auto");
            this.element.select('.sparkline').remove();

            var container = this.element
                .append("div")
                .attr("class", "sparkline")
                .attr("style", "width:100%;text-align:left;border-spacing:0")
                .attr("style", 'color:rgb(102, 102, 102);font-family: "Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif');

            if (this.hasActual === false || this.hasPeriod === false) {
                container
                    .append("html")
                    .attr("style", "")
                    .html("Data is missing to draw the visual");
                return;
            }


            this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value: 1001 });

            if (this.hasActual) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.actualIndex].format });
            else if (this.hasTarget) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.targetIndex].format });

            var data = [];
            let dateformat;

            if (this.dateFormat !== undefined) dateformat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.dateFormat });

            options.dataViews[0].table.rows.forEach((d: any, i) => {
                d.identity = options.dataViews[0].table.identity[i];
                d.actual = d[this.actualIndex];
                d.target = d[this.targetIndex];
                d.period = d[this.periodIndex];

                if (this.dateFormat != undefined) {
                    let dateformat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.dateFormat });
                    d.period = dateformat.format(d[this.periodIndex]);
                }

                data.push(d);
            });

            var trend = data[data.length - 1].actual > data[data.length - 2].actual ? 180 : 0;

            var actHeader = this.actualHeader.length === 0 ? this.columns[this.actualIndex].displayName : this.actualHeader;
           
            var act = data[data.length - 1].actual;
            var prior = 0;

            if (data.length > 1)  prior = data[data.length - 2].actual;

            var target = '';
            var targetHeader = '';

            if (this.hasTarget) {
                target = data[data.length - 1].target;
                targetHeader = this.targetHeader.length === 0 ? this.columns[this.targetIndex].displayName : this.targetHeader;
            }

            this.chartData = {
                actual: { display: actHeader, value: act },
                prior: { display: "Prior", value: prior },
                target: { display: targetHeader, value: target },
                trend: { display: "", value: trend }
            };

            var table = container
                .append("table")
                .attr("style", "width:100%;table-layout: fixed;");

            var tbody = table.append("tbody");

            var titleRow = tbody.append("tr");
            var titleContainer = titleRow.append("td");

            var shapeContainer = tbody.append("tr").append("td");

            this.drawTitle(titleContainer);

            this.drawShape(data, shapeContainer, options.viewport)
            this.showTrendIndicator(titleContainer);
            this.setBorder(table);

        }

        public setProperties(options) { 

            if (options.dataViews[0].metadata.objects) {
                if (options.dataViews[0].metadata.objects["displayTemplate"]) {
                    var displayTemplateObj = options.dataViews[0].metadata.objects["displayTemplate"];
                    if (displayTemplateObj["selectedTemplate"] !== undefined) this.selectedTemplate = displayTemplateObj["selectedTemplate"];
                    if (displayTemplateObj["displayAs"] !== undefined) this.displayAs = displayTemplateObj["displayAs"];
                    if (displayTemplateObj["showBorder"] !== undefined) this.showBorder = displayTemplateObj["showBorder"];
                }

                if (options.dataViews[0].metadata.objects["Actual"]) {
                    var actualObj = options.dataViews[0].metadata.objects["Actual"];
                    if (actualObj["actualHeader"] !== undefined) this.actualHeader = actualObj["actualHeader"];
                    if (actualObj["actualColor"] !== undefined) this.actualColor = actualObj["actualColor"];
                }

                if (options.dataViews[0].metadata.objects["Target"]) {
                    var targetObj = options.dataViews[0].metadata.objects["Target"];
                    if (targetObj["targetHeader"] !== undefined) this.targetHeader = targetObj["targetHeader"];
                    if (targetObj["targetColor"] !== undefined) this.targetColor = targetObj["targetColor"];
                }

                if (options.dataViews[0].metadata.objects["Line"]) {
                    var sparkObj = options.dataViews[0].metadata.objects["Line"];
                    if (sparkObj["transparency"] !== undefined) this.lineStroke = sparkObj["transparency"];
                }
                if (options.dataViews[0].metadata.objects["Trend"]) {
                    var trendObj = options.dataViews[0].metadata.objects["Trend"];
                    if (trendObj["show"] !== undefined) this.trendIndicator = trendObj["show"];
                    if (trendObj["flipTrendDirection"] !== undefined) this.flipTrendDirection = trendObj["flipTrendDirection"];
                    if (trendObj["trendColor"] !== undefined) this.trendColor = trendObj["trendColor"];
                }

            }

        }

        private setBorder(table) {

            if (this.showBorder) {
                table.style("border", "1px solid #b3b3b3");
            }

        }

        public drawGroupActual(container: any) {

            var actual = container
                .append("span")
                .attr("style", "display:block;font-size:18px;text-align:right")
                .style("margin-right", this.trendIndicator === true ? "15px" : "0px")
                .text((d) => this.iValueFormatter.format(this.chartData.actual.value));


            this.tooltipServiceWrapper.addTooltip(actual,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Actual'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

            var target = container
                .append("span")
                .attr("style", "display:block;font-size:14px;text-align:right")
                .text((d) => this.iValueFormatter.format(this.chartData.target.value));


            this.tooltipServiceWrapper.addTooltip(target,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Target'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        public drawTitle(container) {
            var title = "";
            if (this.hasActual) title = title + this.chartData.actual.display;
            if (this.hasTarget) title = title  + " vs " + this.chartData.target.display;
            
                container
                    .append("span")
                    .text(title)
                    .attr("style", "font-size:14px;");
            
           
        }

        public drawShape(data, shapeContainer, vp) {

            var height = vp.height - 35;
            if (height < 20) height = 20;

            var width = vp.width - 5;


            if (this.hasActual) {

                var xDomain = [];
                var yDomain = [];

                data.map(function (d) {
                    xDomain.push(d.period);
                    yDomain.push(d.actual);
                    if (d.target) yDomain.push(d.target);
                });
                var xScale = d3.scale.ordinal().rangePoints([0, width]).domain(xDomain);

                var xScaleBar = d3.scale.ordinal().rangeRoundBands([0, width],.05).domain(xDomain);
                var yScalebar = d3.scale.linear().range([height, 0]).domain([d3.min(yDomain) - d3.min(yDomain)*0.10 , d3.max(yDomain)]);
                var yScale = d3.scale.linear().range([height, 0]).domain([d3.min(yDomain), d3.max(yDomain)]);

                this.sparklineSelection = shapeContainer
                    .style("background", "#f6f6f6")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height);

                var sparklineSelectionG = this.sparklineSelection.append("g");
                
                switch (this.displayAs) {
                    case "line":

                        this.drawLine(sparklineSelectionG, xScale, yScale, data);
                        this.drawBisectorToolTip(data, width, height);

                        break;

                    case "area":

                        this.drawLine(sparklineSelectionG, xScale, yScale, data);
                        this.drawArea(sparklineSelectionG, xScale, yScale, data, height);
                        this.drawBisectorToolTip(data, width, height);

                        break;

                    case "bar":
                        this.drawBar(sparklineSelectionG, xScaleBar, yScalebar, data);
                        break;

                    case "barline":
                        this.drawBarLine(sparklineSelectionG, xScaleBar, yScalebar, data);
                        break;


                }

            }
        }

        public drawLine(sparklineSelectionG, xScale, yScale, data) {

                sparklineSelectionG.append("path")
                    .attr("class", "line")
                    .attr("style", "fill: none;")
                    .style("stroke", this.actualColor.solid.color)
                    .style("stroke-width", this.lineStroke / 10)
                    .attr("d", function (d: any) {
                        return "M" + data.map((d) => {
                            return xScale(d.period) + ',' + yScale(d.actual);
                        }).join('L');
                    });

            if (this.hasTarget === true) {
                    sparklineSelectionG.append("path")
                        .attr("class", "line")
                        .attr("style", "stroke: red; fill: none;stroke-dasharray: 3")
                        .style("stroke-width", this.lineStroke / 10)
                        .style("stroke", this.targetColor.solid.color)
                        .attr("d", function (d: any) {
                            return "M" + data.map((d) => {
                                return xScale(d.period) + ',' + yScale(d.target);
                            }).join('L');
                        });
                }
        }

        public drawArea(sparklineSelectionG, xScale, yScale, data, height) {

            var area = d3.svg.area()
                .x((d: any) => xScale(d.period))
                .y1((d: any) => yScale(d.actual))
                .y0(height);

            sparklineSelectionG.append("path")
                .attr("style", "fill-opacity:.4;")
                .style("fill", this.actualColor.solid.color)
                .attr("d", area(data));

            if (this.hasTarget === true) {

                var areaT = d3.svg.area()
                    .x((d: any) => xScale(d.period))
                    .y1((d: any) => yScale(d.target))
                    .y0(height);

                sparklineSelectionG.append("path")
                    .attr("class", "area")
                    .style("fill", this.targetColor.solid.color)
                    .attr("style", "fill-opacity:.4")
                    .attr("d", areaT(data));
            }
        }

        public drawBar(sparklineSelectionG, xScale, yScale, data) {

            var width = xScale.rangeBand();

            if (this.hasTarget === true) width = width / 2;

            var bars = sparklineSelectionG.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect");

            bars.attr("x", d => xScale(d.period))
                .style("fill", this.actualColor.solid.color)
                .attr("width", width)
                .attr("y", d=> (d.actual < 0 ? yScale(0) : yScale(d.actual)))
                .attr("height", 0)
                .transition()
                .duration(500)
                .attr("height", function (d) {
                    var barHeight = d.actual < 0 ? (yScale(d.actual) - yScale(0)) : (yScale(0) - yScale(d.actual));
                    if (barHeight < 1 && barHeight > 0) barHeight = 1;
                    return barHeight;
                });

            if (this.hasTarget === true) {

                var targetBars = sparklineSelectionG.selectAll(".bar")
                    .data(data)
                    .enter()
                    .append("rect");

                targetBars.attr("x", d => xScale(d.period) + width)
                    .style("fill", this.targetColor.solid.color)
                    .attr("width", width)
                    .attr("y", d => (d.actual < 0 ? yScale(0) : yScale(d.actual)))
                    .attr("height", 0)
                    .transition()
                    .duration(500)
                    .attr("height", function (d) {
                        var barHeight = d.actual < 0 ? (yScale(d.actual) - yScale(0)) : (yScale(0) - yScale(d.actual));
                        if (barHeight < 1 && barHeight > 0) barHeight = 1;
                        return barHeight;
                    });
            }
        }

        public drawBarLine(sparklineSelectionG, xScale, yScale, data) {

            var width = xScale.rangeBand();
            var bars = sparklineSelectionG.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect");

            bars.attr("x", d => xScale(d.period))
                .style("fill", this.actualColor.solid.color)
                .attr("width", width)
                .attr("y", d => (d.actual < 0 ? yScale(0) : yScale(d.actual)))
                .attr("height", 0)
                .transition()
                .duration(500)
                .attr("height", function (d) {
                    var barHeight = d.actual < 0 ? (yScale(d.actual) - yScale(0)) : (yScale(0) - yScale(d.actual));
                    if (barHeight < 1 && barHeight > 0) barHeight = 1;
                    return barHeight;
                });

            if (this.hasTarget === true) {
                sparklineSelectionG.append("path")
                    .attr("class", "line")
                    .attr("style", "fill: none;")
                    .style("stroke", this.targetColor.solid.color)
                    .style("stroke-width", this.lineStroke / 10)
                    .attr("d", function (d: any) {
                        return "M" + data.map((d) => {
                            return (xScale(d.period) + width/2) + ',' + yScale(d.actual);
                        }).join('L');
                    });
            }
        }

        public drawActual(container: any) {

            var actual = container
                .append("span")
                .text((d) => this.iValueFormatter.format(this.chartData.actual.value));


            this.tooltipServiceWrapper.addTooltip(actual,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Actual'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        public showTrendIndicator(container: any) {

            let color = this.trendColorOptions[this.trendColor];

            if (this.trendIndicator === true) {

                var trendIndicator = container
                    .append("svg")
                    .attr("width", 18)
                    .attr("height", 18);

                trendIndicator.attr("style", "position: absolute;top: 3;right: 0;")

                var triangleDirection = this.flipTrendDirection == false ? 'triangle-down' : 'triangle-up';
                var triangle = d3.svg.symbol().type(triangleDirection).size(50);

                trendIndicator
                    .append("path")
                    .attr('d', triangle)
                    .attr('transform', d => {
                        return "translate(10,12), rotate(" + this.chartData.trend.value + ")";
                    })
                    .style("fill", this.chartData.trend.value == 180 ? color[0] : color[1]);

            }

        }

        public drawTarget(container: any) {

            var target = container
                .append("span")
                .text((d) => this.iValueFormatter.format(this.chartData.target.value));


            this.tooltipServiceWrapper.addTooltip(target,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Target'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        //#region Tooltip
        public drawBisectorToolTip(data, width, height) {

            var self = this;
            var ht = height
            var ss = this.sparklineSelection
                .append("rect")
                .style("fill", "transparent")
                .on("mouseover", d => {
                    this.sparklineMarker.style("display", null);
                })
                .on("mouseout", d => {
                    this.sparklineMarker.style("display", "none");
                })
                .on("mousemove", function (d) {
                    self.mouseMove(data, this, width);
                });


            ss.attr("width", width)
                .attr("height", ht);


            this.sparklineMarker = this.sparklineSelection
                .append("g")
                .attr("display", "none")
                .attr("class", "bisector");

            this.sparklineMarkerLine = this.sparklineMarker.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', ht)
                .attr('class', 'verticalLine')
                .attr("cursor", "pointer");

            this.sparklineCaptionName = this.sparklineMarker
                .append("text")
                .attr("dy", 12)
                .attr("style", "cursor:pointer; font-size:12px; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;");


            this.sparklineCaptionValue = this.sparklineMarker
                .append("text")
                .attr("dy", 25)
                .attr("style", "cursor:pointer;font-size:12px; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;");

        }

        public mouseMove(data: any, el: any, width: any) {

            var catScale = d3.scale.ordinal()
                .rangePoints([0, width])
                .domain(data.map(function (d) { return d.period; }));


            this.sparklineMarker.attr("style", "display:inherit");
            var padding = (catScale(catScale.domain()[1]) - catScale(catScale.domain()[0])) / 2;
            var xPos = d3.mouse(el)[0];

            this.sparklineMarker.attr("transform", function () {
                return "translate(" + (xPos) + ",0)";
            });

            var leftEdges = catScale.domain().map(d => (catScale(d) + padding));

            var j;
            for (j = 0; xPos > leftEdges[j]; j++) { }

            var hoverXValue = catScale.domain()[j];
            var hoverVal;

            data.map(d => {
                if (d.period === hoverXValue) {
                    hoverVal = this.iValueFormatter.format(d.actual);
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

        }
        //#endregion

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any, vtype: any): VisualTooltipDataItem[] {
            var retData = [];
            var val = '';
            switch (vtype) {
                case 'Needed':
                    val = this.chartData.needed.value;
                    break;
                case 'Actual':
                    val = this.chartData.actual.value;
                    break;
                case 'Target':
                    val = this.chartData.target.value;
                    break;

            }

            retData.push({
                displayName: vtype,
                value: val.toString(),
                header: vtype
            });

            return retData;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'displayTemplate':
                    objectEnumeration.push({ objectName: objectName, properties: { selectedTemplate: this.selectedTemplate }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { displayAs: this.displayAs }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showBorder: this.showBorder }, selector: null });
                    
                    break;

                case 'Actual':
                    objectEnumeration.push({ objectName: objectName, properties: { actualHeader: this.actualHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualColor: this.actualColor }, selector: null });
                    
                    break;

                case 'Target':
                    objectEnumeration.push({ objectName: objectName, properties: { targetHeader: this.targetHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { targetColor: this.targetColor }, selector: null });
                    break;

                case 'Line':
                    objectEnumeration.push({ objectName: objectName, properties: { transparency: this.lineStroke }, selector: null });
                    break;


                case 'Trend':
                    objectEnumeration.push({ objectName: objectName, properties: { show: this.trendIndicator }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { flipTrendDirection: this.flipTrendDirection }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { trendColor: this.trendColor }, selector: null });
                    break;

            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}