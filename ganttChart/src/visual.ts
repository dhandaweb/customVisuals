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
        private additionalValues: any = [];

        private columns: any;
        private currentHeader: any = "Current";



        private iValueFormatter: any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private sparklineSelection: d3.Selection<SVGElement>;
        private sparklineMarker: d3.Selection<SVGElement>;
        private sparklineMarkerLine: d3.Selection<SVGElement>;
        private sparklineCaptionName: d3.Selection<SVGElement>;
        private sparklineCaptionValue: d3.Selection<SVGElement>;


        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;


        private fontSize: any = 12;
        private timeFrom: any = false;
        private timeTo: any = false;
        private activity: any = false;
        private group: any = false;
        private milestone: any = false;
        private milestoneDesc: any = false;
        private projectName: any = false;

        private dateFormat: any;

        private activityIndex: any = 0;
        private groupIndex: any = 0;
        private timeFromIndex: any = 0;
        private timeToIndex: any = 0;
        private milestoneIndex: any = 0;
        private milestoneDescIndex: any = 0;
        private projectNameIndex: any = 0;



        private showXaxisBrush: any = false;
        private showYaxisBrush: any = false;
        private milestoneSymbol: any = "diamond";
        private milestoneColor: any = { solid: { color: "#50005C" } };

        private colorBy: any = "phase";
        private colorType: any = "linear";
        private colorPalette: any;

        private legendPosition: any = "right";
        private legendName: any = "Phase";
        private legendFontSize: any = 10;

        private xAxisBrushExtent: any;
        private yAxisBrushExtent: any;

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            this.activityIndex = 0;
            this.groupIndex = 0;
            this.timeFromIndex = 0;
            this.timeToIndex = 0;
            this.milestoneIndex = 0;
            this.milestoneDescIndex = 0;
            this.projectNameIndex = 0;
            this.timeFrom = false;
            this.timeTo = false;
            this.activity = false;
            this.group = false;
            this.milestone = false;
            this.milestoneDesc = false;
            this.projectName = false;

            this.columns = options.dataViews[0].metadata.columns;
            this.colorPalette.reset();

            this.setProperties(options);
            this.selectionManager.registerOnSelectCallback(() => {

            });
            this.dateFormat = this.getDateFormat("DD/MM/YYYY");
            this.element.select('.ganttChart').remove();
            this.milestone = false;

            this.columns.map((d, i) => {
                if (d.roles["activity"]) {
                    this.activity = true;
                    this.activityIndex = i;
                }
                if (d.roles["group"]) {
                    this.group = true;
                    this.groupIndex = i;
                }
                if (d.roles["timeFrom"]) {
                    this.timeFrom = true;
                    this.timeFromIndex = i;
                }
                if (d.roles["timeTo"]) {
                    this.timeTo = true;
                    this.timeToIndex = i;
                }
                if (d.roles["milestone"]) {
                    this.milestone = true;
                    this.milestoneIndex = i;
                }
                if (d.roles["milestoneDesc"]) {
                    this.milestoneDesc = true;
                    this.milestoneDescIndex = i;
                }
                if (d.roles["projectName"]) {
                    this.projectName = true;
                    this.projectNameIndex = i;
                }
                return d;
            });

            this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value: 1001 });

            var data = [];
            options.dataViews[0].table.rows.map((d: any, i) => {
                data.push({
                    timeFrom: (d[this.timeFromIndex]),
                    timeTo: (d[this.timeToIndex]),
                    group: d[this.groupIndex],
                    activity: d[this.activityIndex],
                    milestone: this.milestone ? d[this.milestoneIndex] : null,
                    milestoneDesc: this.milestoneDesc ? d[this.milestoneDescIndex] : null,
                    projectName: this.projectName ? d[this.projectNameIndex] : null
                });

            });

            var dimension = this.getDimensions(options.viewport, data);

            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);


            var chartContainer = this.element
                .append("div")
                .attr("class", "ganttChart")
                .attr("style", "width:100%;");

            var chart = chartContainer
                .append("svg")
                .attr("height", dimension.height)
                .attr("width", dimension.width)
                .on("click", (d, i) => {
                    this.selectionManager.clear();
                });

            var chartSvg = chart.append("g");
            var chartLegend = chart.append("g");

            chartSvg.attr("transform", "translate(0," + 5 + ")");

            this.drawXScale(xScale, chartSvg, dimension);
            var ganttRect = this.drawActivityRect(xScale, yScale, chartSvg, data, dimension);

            chartSvg.append("rect")
            .attr("height", dimension.height)
            .attr("width", dimension.yOffset)
            .attr("fill", "#fff");

            this.drawYScale(yScale, chartSvg, dimension, data);

            if (this.milestone) this.drawMilestone(xScale, yScale, chartSvg, data, dimension);
            if (this.showXaxisBrush) this.drawXBrush(xScale, yScale, chartSvg, dimension, ganttRect);
            if (this.showYaxisBrush) this.drawYBrush(xScale, yScale, chartSvg, dimension, ganttRect);

            if (this.legendPosition !== "none") this.drawLegend(chartLegend, chartSvg, dimension, data);

            if (this.xAxisBrushExtent !== undefined && this.showXaxisBrush) this.setXAxisBrushExtent(xScale, dimension, chartSvg, ganttRect, yScale);
        }
        private getLegendData(data) {
            var legendData = [];
            if (this.legendPosition !== "none") {
                data.map(d => {
                    this.colorBy === "project" ? legendData.push(d.activity) : legendData.push(d.group);
                })
                legendData = legendData.filter((v, i, a) => a.indexOf(v) === i).filter(d => d !== null);
            }

            if (this.legendPosition !== "none"
                && this.colorBy === "project"
                && this.activity === false) return [];

            if (this.legendPosition !== "none"
                && this.colorBy === "phase"
                && this.group === false) return [];

            return legendData;
        }

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["axis"]) {
                    var axis = options.dataViews[0].metadata.objects["axis"];
                    if (axis.showXaxisBrush !== undefined) this.showXaxisBrush = axis["showXaxisBrush"];
                    if (axis.showYaxisBrush !== undefined) this.showYaxisBrush = axis["showYaxisBrush"];
                }
                if (options.dataViews[0].metadata.objects["milestone"]) {
                    var milestone = options.dataViews[0].metadata.objects["milestone"];
                    if (milestone.milestoneSymbol !== undefined) this.milestoneSymbol = milestone["milestoneSymbol"];
                    if (milestone.milestoneColor !== undefined) this.milestoneColor = milestone["milestoneColor"];
                }
                if (options.dataViews[0].metadata.objects["ganttColor"]) {
                    var ganttColor = options.dataViews[0].metadata.objects["ganttColor"];
                    if (ganttColor.colorBy !== undefined) this.colorBy = ganttColor["colorBy"];
                    if (ganttColor.colorType !== undefined) this.colorType = ganttColor["colorType"];
                }
                if (options.dataViews[0].metadata.objects["Legend"]) {
                    var legend = options.dataViews[0].metadata.objects["Legend"];
                    if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
                    if (legend.fontSize !== undefined) this.legendFontSize = legend["fontSize"];
                    if (legend.legendName !== undefined) this.legendName = legend["legendName"];

                }

            }
        }

        private getDimensions(vp, data) {

            var max = d3.max(data.map(d => d.activity.length * (this.fontSize / 2)));

            var legendDataRaw = this.getLegendData(data);
            var legendData = this.setLegendWidth(this.element, legendDataRaw);

            let xlegendOffset = 0;
            let ylegendOffset = 0;

            if (legendData.length > 0) {
                if (this.legendPosition == "right") ylegendOffset = d3.max(legendData.map(d => d.width)) + (4 * this.legendFontSize);
                if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = this.legendFontSize * 3;
            }

            let xOffset, yOffset, chartWidth, chartHeight;
            let xbrushOffset = this.showXaxisBrush ? 40 : 0;
            let ybrushOffset = this.showYaxisBrush ? 20 : 0;
            xOffset = xbrushOffset + 40;

            yOffset = max + ybrushOffset;
            chartWidth = vp.width - yOffset - ylegendOffset;
            chartHeight = vp.height - xOffset - xlegendOffset;

            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                xbrushOffset: xbrushOffset,
                ybrushOffset: ybrushOffset,
                chartWidth: chartWidth,
                chartHeight: chartHeight,
                ylegendOffset: ylegendOffset,
                xlegendOffset: xlegendOffset
            }
        }

        private setXScale(data, dimension) {

            var xdomain = [];
            data.map((d: any) => {
                xdomain.push((d.timeFrom));
                xdomain.push((d.timeTo))
            });

            let scale = d3.time.scale()
                .domain(d3.extent(xdomain))
                .range([0, dimension.chartWidth]);


            return scale;
        }

        private setYScale(data, dimension) {

            var scale = d3.scale.ordinal()
                .rangeBands([0, dimension.chartHeight], .2)
                .domain(data.map(d => d.activity));

            return scale;
        }

        private setXAxisStyle(chartSvg) {

            chartSvg.select("g.xaxis").selectAll("text")
                .attr("fill", "rgb(119, 119, 119)")
                .style("text-anchor", "end")
                .attr("font-size", this.fontSize + "px")
                .attr("dx", -2)
                .attr("dy", 5)
                .attr("transform", function (d) {
                    return "rotate(-50)"
                });
        }

        private drawXScale(xScale, chartSvg, dimension) {

            var xaxis = d3.svg.axis()
                .scale(xScale)
                .ticks(Math.floor(dimension.chartWidth / 40))
                .tickSize(-dimension.chartHeight, 0)
                .orient("bottom");

            var xAxisG = chartSvg
                .append("g")
                .attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight) + ")")
                .attr("class", "xaxis")
                .call(xaxis)

            this.setXAxisStyle(chartSvg)

        }

        private drawYScale(yScale, chartSvg, dimension, data) {

            var yaxis = d3.svg.axis()
                .scale(yScale)
                .tickSize(-dimension.width, 0)
                .orient("left");

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", "translate(" + (dimension.yOffset - dimension.ybrushOffset) + "," + (0) + ")")
                .attr("class", "yaxis")
                .call(yaxis);

            this.updateYaxisLines(yAxisG, dimension, yScale);

        }

        private updateYaxisLines(yAxisG, dimension, yScale) {
            yAxisG.selectAll("text")
                .attr("font-size", this.fontSize + "px")
                .attr("fill", "rgb(119, 119, 119)");

            yAxisG.selectAll("line")
                .attr("transform", "translate(" + (-dimension.yOffset) + "," + (-yScale.rangeBand() / 2 - yScale.rangeBand() * .1) + ")")
        }

        private setRectPosition(rectG, xScale, yScale, dimension) {

            rectG
                .attr("transform", function (d) {
                    var xVal, yVal;

                    xVal = xScale(d.timeFrom);
                    xVal = xScale(d.timeFrom);
                    yVal = yScale(d.activity);

                    if (yVal === undefined) yVal = -1000;
                    if (xVal < 0 || isNaN(xVal) || xVal === undefined) xVal = -10000;

                    return "translate(" + (xVal + dimension.yOffset) + "," + yVal + ")";
                });

            rectG.selectAll('rect').attr("height", yScale.rangeBand())
        }

        private setMilestonePosition(xScale, yScale, dimension) {

            d3.selectAll(".milestone")
                .attr("transform", function (d) {
                    var xVal, yVal;

                    xVal = xScale(d.milestone);
                    yVal = yScale(d.activity);

                    if (yVal === undefined) yVal = -1000;
                    if (xVal < 0 || isNaN(xVal) || xVal === undefined) xVal = -10000;

                    return "translate(" + (xVal + dimension.yOffset) + "," + (yVal + yScale.rangeBand() / 2) + ")";
                });

            //rectG.selectAll('rect').attr("height", yScale.rangeBand())
        }

        public drawActivityRect(xScale, yScale, chartSvg, data, dimension) {

            var rectG = chartSvg
                .selectAll(".ganttrect")
                .data(data)
                .enter()
                .append("g");

            this.setRectPosition(rectG, xScale, yScale, dimension);

            var rect = rectG.append("rect")

                .attr("width", function (d) {
                    var width = xScale(d.timeTo) - xScale(d.timeFrom);
                    if (width === undefined || isNaN(width)) width = 0;
                    return Math.abs(width);
                })
                .attr("x", function (d) {
                    var width = xScale(d.timeTo) - xScale(d.timeFrom);
                    if (width < 0) return width;
                    else return 0;
                })
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("height", yScale.rangeBand());

            this.setColor(rect);

            if (this.projectName) {
                rectG.append("text").text(d => {
                    return d.projectName;
                })
                    .attr("dy", 5)
                    .attr("font-size", 10)
                    .attr("y", yScale.rangeBand() / 2);
            }

            this.tooltipServiceWrapper.addTooltip(rect,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

            return rectG;
        }

        public setColor(rect) {

            var color = ["#00B9FA", "#63A8FF", "#63A8FF", "#7EA0FF", "#9798FF", "#AF8EFD", "#C683F2", "#FF4FAC", "#F95CC2", "#FF4FAC", "#FF4395"];

            var colorScale = d3.scale.ordinal()
                .range(color);

            rect.attr("fill", d => {
                return this.colorBy === "project" ? this.colorPalette.getColor(d.activity).value : this.colorPalette.getColor(d.group).value;
            });

        }

        public drawMilestone(xScale, yScale, chartSvg, data, dimension) {

            var arc = d3.svg.symbol().type(String(this.milestoneSymbol))
                .size(50);

            var symbol = chartSvg
                .selectAll(".ganttrect")
                .data(data)
                .enter()
                .append('path')
                .attr("class", "milestone")
                .attr('d', arc)
                .attr("fill", this.milestoneColor.solid.color);

            this.setMilestonePosition(xScale, yScale, dimension);

            this.tooltipServiceWrapper.addTooltip(symbol,
                (tooltipEvent: TooltipEventArgs<any>) => this.getMilestoneTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];

            if (data.activity) {
                retData.push({
                    displayName: 'Project',
                    value: data.activity,
                });
            }

            if (data.group) {
                retData.push({
                    displayName: "Phase",
                    value: data.group
                });
            }
            if (data.timeFrom) {
                retData.push({
                    displayName: 'Start date',
                    value: data.timeFrom.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })
                });
            }
            if (data.timeTo) {
                retData.push({
                    displayName: 'End date',
                    value: data.timeTo.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })
                });
            }

            return retData;
        }

        private getMilestoneTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];

            if (data.milestone) {
                retData.push({
                    displayName: 'Milestone Date',
                    value: data.milestone.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    }),
                });
            }

            if (data.milestoneDesc) {
                retData.push({
                    displayName: "Description",
                    value: data.milestoneDesc
                });
            }

            return retData;
        }

        public drawXBrush(xScale, yScale, chartSvg, dimension, rectG) {
            var xaxis;
            var brush = d3.svg.brush()
                .x(xScale.copy())
                .on("brush", () => {

                    this.xAxisBrushExtent = JSON.stringify(brush.extent());
                    xScale.domain(brush.empty() ? xScale.domain() : brush.extent());

                    xaxis = d3.svg.axis()
                        .scale(xScale)
                        .ticks(Math.floor(dimension.chartWidth / 40))
                        .tickSize(-dimension.chartHeight, 0)
                        .orient("bottom");

                    chartSvg.select("g.xaxis").call(xaxis)

                    this.setXAxisStyle(chartSvg);
                    this.setRectPosition(rectG, xScale, yScale, dimension);
                    this.setMilestonePosition(xScale, yScale, dimension);
                });

            if (this.xAxisBrushExtent) {
                var extent = JSON.parse(this.xAxisBrushExtent);
                extent = [new Date(extent[0]), new Date(extent[1])];
                var startextent = xScale(extent[0]);
                var endextent = xScale(extent[1]);

                if (!(startextent < 0 || isNaN(startextent) || startextent === undefined)
                    && !(endextent < 0 || isNaN(endextent) || endextent === undefined)) {
                    brush.extent(extent);
                }
            }

            var xBrush = chartSvg
                .append("g")
                .attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.height - (dimension.xbrushOffset - 10)) + ")")
                .call(brush);

            xBrush.selectAll("rect")
                .style("visibility", "visible")
                .attr("fill", "#f6f6f6")
                .attr("height", 20);
            xBrush.selectAll(".extent").attr("fill", "#b3b3b3");


        }

        public setXAxisBrushExtent(xScale, dimension, chartSvg, rectG, yScale) {
            var xaxis;

            var extent = JSON.parse(this.xAxisBrushExtent);
            extent = [new Date(extent[0]), new Date(extent[1])];

            var startextent = xScale(extent[0]);
            var endextent = xScale(extent[1]);

            if (!(startextent < 0 || isNaN(startextent) || startextent === undefined)
                && !(endextent < 0 || isNaN(endextent) || endextent === undefined)) {
                xScale.domain(extent);

                xaxis = d3.svg.axis()
                    .scale(xScale)
                    .ticks(Math.floor(dimension.chartWidth / 40))
                    .tickSize(-dimension.chartHeight, 0)
                    .orient("bottom");

                chartSvg.select("g.xaxis").call(xaxis)

                this.setXAxisStyle(chartSvg);
                this.setRectPosition(rectG, xScale, yScale, dimension);
                this.setMilestonePosition(xScale, yScale, dimension);
            }
        }

        public drawYBrush(xScale, yScale, chartSvg, dimension, rectG) {
            var yaxis, yAxisG;
            var yScaleCopy = yScale.copy();
            var brush = d3.svg.brush()
                .y(yScaleCopy)
                .on("brush", () => {

                    var extent = brush.extent();
                    var selected = yScaleCopy.domain().filter(function (d) {
                        return (extent[0] <= yScaleCopy(d)) && (yScaleCopy(d) <= extent[1]);
                    });

                    if (selected.length === 0) selected = yScaleCopy.domain();

                    yScale
                        .domain(selected)
                        .rangeBands([0, dimension.chartHeight], .2);

                    yaxis = d3.svg.axis()
                        .scale(yScale)
                        .tickSize(-dimension.width, 0)
                        .orient("left");

                    yAxisG = chartSvg.select("g.yaxis")
                        .call(yaxis);

                    this.updateYaxisLines(yAxisG, dimension, yScale);
                    this.setRectPosition(rectG, xScale, yScale, dimension);
                    this.setMilestonePosition(xScale, yScale, dimension);
                });

            var yBrush = chartSvg
                .append("g")
                .attr("transform", "translate(" + (dimension.yOffset - dimension.ybrushOffset) + "," + (0) + ")")
                .call(brush);

            yBrush.selectAll("rect")
                .style("visibility", "visible")
                .attr("fill", "#f6f6f6")
                .attr("width", 15);

            yBrush.selectAll(".extent").attr("fill", "#b3b3b3")
        }

        public getDateFormat(format) {
            var dataFormat: any;
            switch (format) {
                case "YYYY-DD-MM":
                    dataFormat = d3.time.format("%Y-%m-%d");
                    break;
                case "YYYY/DD/MM":
                    dataFormat = d3.time.format("%Y/%m/%d");
                    break;
                case "DD-MM-YYYY":
                    dataFormat = d3.time.format("%d-%m-%Y");
                    break;
                case "DD/MM/YYYY":
                    dataFormat = d3.time.format("%d/%m/%Y");
                    break;
                case "MM-DD-YYYY":
                    dataFormat = d3.time.format("%m-%d-%Y");
                    break;
                case "MM/DD/YYYY":
                    dataFormat = d3.time.format("%m/%d/%Y");
                    break;
                case "DD-Mon-YYYY":
                    dataFormat = d3.time.format("%d-%b-%y");
                    break;
                case "DD-Month-YYYY":
                    dataFormat = d3.time.format("%d-%B-%y");
                    break;
                case "Mon-YYYY":
                    dataFormat = d3.time.format("%b-%y");
                    break;
                case "Month-YYYY":
                    dataFormat = d3.time.format("%B-%y");
                    break;
                default:
                    dataFormat = d3.time.format("%d-%m-%Y");
                    break;
            }
            return dataFormat;
        }

        private getTextWidth(container, text, fontsize) {

            var dummytext = container.append("text").text(text).attr("font-size", fontsize);
            var bbox = { width: 10, height: 10 };
            if (dummytext.node() !== null) bbox = dummytext.node().getBBox();
            dummytext.remove();

            return bbox.width;
        };

        private setLegendWidth(el, legendData) {
            var svg = el.append("svg").attr("width", 0).attr("height", 0);

            var legend = legendData.map(d => {
                return {
                    width: this.getTextWidth(svg, d, this.legendFontSize) + 20,
                    color: this.colorPalette.getColor(d).value,
                    text: d
                }
            })
            svg.remove();

            return legend;
        }

        private drawLegend(chartLegend, chartSvg, dimension, data) {
            var legendData = this.getLegendData(data);
            if (legendData.length > 0) {
                var legend = this.setLegendWidth(this.element, legendData);

                if (this.legendName.length > 0) {
                    var svg = this.element.append("svg").attr("width", 0).attr("height", 0);
                    var wd = this.getTextWidth(svg, this.legendName, this.legendFontSize);
                    svg.remove();
                    legend.unshift({ text: this.legendName, color: "transparent", width: 50 });
                }

                if (this.legendPosition == "right") {
                    chartLegend.attr("transform", "translate(" + (dimension.chartWidth + dimension.yOffset + (this.legendFontSize * 2)) + "," + (5) + ")");
                    chartLegend.append("rect").attr("height", dimension.height).attr("width", dimension.ylegendOffset).attr("fill", "#fff");
                }
                if (this.legendPosition == "top") {
                    chartSvg.attr("transform", "translate(0," + this.legendFontSize * 3 + ")");
                    chartLegend.attr("transform", "translate(" + (dimension.yOffset) + "," + this.legendFontSize + ")");
                }
                if (this.legendPosition == "bottom") {
                    chartLegend.attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight + dimension.xOffset + (this.legendFontSize * 2)) + ")");
                }
                var fontSize = parseInt(this.legendFontSize);

                var legengG = chartLegend.selectAll(".legend")
                    .data(legend)
                    .enter()
                    .append("g");

                if (this.legendPosition == "right") legengG.attr("transform", (d, i) => "translate(10," + i * (fontSize + 5) + ")");
                else {
                    var wd = 0, rt;
                    legengG.attr("transform", (d, i) => {
                        rt = "translate(" + wd + ",0)"
                        wd = wd + d.width;
                        return rt;
                    });
                }

                legengG.append("circle")
                    .attr("r", fontSize / 2)
                    .attr("cy", fontSize / 5)
                    .attr("fill", d => d.color);

                legengG
                    .append("text")

                    .attr("x", d => d.color === "transparent" ? -5 : fontSize)
                    .attr("font-weight", d => d.color === "transparent" ? "bold" : "normal")
                    .attr("style", d => {
                        if (d.color === "transparent") return 'fill:rgb(102, 102, 102);font-family: "Segoe UI Semibold", wf_segoe-ui_semibold, helvetica, arial, sans-serif;';
                        else return 'fill:rgb(102, 102, 102);font-family: "Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif';
                    })
                    .style("font-size", fontSize + "px")
                    .attr("y", fontSize / 2)
                    .text(d => d.text);

                legengG.style("font-size", fontSize);
            }
        };
        //#endregion

        public pickTextColorBasedOnBgColorSimple(bgColor, lightColor, darkColor) {
            var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
            var r = parseInt(color.substring(0, 2), 16); // hexToR
            var g = parseInt(color.substring(2, 4), 16); // hexToG
            var b = parseInt(color.substring(4, 6), 16); // hexToB
            return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
                darkColor : lightColor;
        }


        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'axis':
                    objectEnumeration.push({ objectName: objectName, properties: { showXaxisBrush: this.showXaxisBrush }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showYaxisBrush: this.showYaxisBrush }, selector: null });
                    break;
                case 'milestone':
                    objectEnumeration.push({ objectName: objectName, properties: { milestoneSymbol: this.milestoneSymbol }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { milestoneColor: this.milestoneColor }, selector: null });
                    break;
                case 'ganttColor':
                    objectEnumeration.push({ objectName: objectName, properties: { colorBy: this.colorBy }, selector: null });
                    // objectEnumeration.push({ objectName: objectName, properties: { colorType: this.colorType},selector: null});
                    break;
                case 'Legend':
                    objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { legendName: this.legendName }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.legendFontSize }, selector: null });
                    break;


            };

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}