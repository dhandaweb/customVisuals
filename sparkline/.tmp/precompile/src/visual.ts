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


module powerbi.extensibility.visual.sparklineCCFC224D9885417F9AAF5BB8D45B007E  {
    "use strict";

    export class Visual implements IVisual {

        private host: IVisualHost;
        //  private tooltipServiceWrapper: ITooltipServiceWrapper;

        private selectionManager: ISelectionManager;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;

        private columns: any;
        private selectedTemplate: any = "default";

        private actualIndex: number;
        private hasActual: any;
        private actualHeader: any = "";
        private actualColor: any = { solid: { color: "#01b8aa" } };
        private actValueFormatter: any;
        private actualValFormat: any = "default";
        private actualValPrecision: any = 0;

        

        private targetIndex: number;
        private hasTarget: any;
        private targetHeader: any = "";
        private targetColor: any = { solid: { color: "#374649" } };
        private targetValueFormatter: any;
        private targetValFormat: any = "default";
        private targetValPrecision: any = 0;

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
        private showMinMax: any = true;

        private actualName: any = '';
        private targetName: any = '';
        private periodName: any = '';


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
                    this.targetName = d.displayName;
                    var targetMax: any = (options.dataViews[0].table.rows.map((d: any) => d[this.targetIndex]));
                    this.targetValueFormatter = this.getValueFormat(d.format, d3.min(targetMax) / 10, this.targetValFormat, this.targetValPrecision);
                }
                if (d.roles["actual"]) {
                    this.hasActual = true;
                    this.actualIndex = i;
                    this.actualName = d.displayName;
                    var actualMax: any = (options.dataViews[0].table.rows.map((d: any) => d[this.actualIndex]));
                    this.actValueFormatter = this.getValueFormat(d.format, d3.min(actualMax) / 10, this.actualValFormat, this.actualValPrecision);
                }
                if (d.roles["period"]) {
                    this.hasPeriod = true;
                    this.periodIndex = i;
                    this.periodName = d.displayName;
                    this.dateFormat = d.format;

                }
            });

            this.element.style("overflow", "hidden");
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
                .attr("style", "width:100%;height:" + (options.viewport.height -2)+"px;table-layout: fixed;");

            var tbody = table.append("tbody");
            var minMaxOffset = this.showMinMax ? 20 : 0;
           
            switch (this.selectedTemplate) {
                case 'default':

                    var titleContainer = tbody.append("tr").append("td");

                    this.drawTitle(titleContainer);

                    this.drawActualVal(tbody);

                    var shapeContainer = tbody.append("tr").append("td");
                    
                    var height = options.viewport.height - 84 - minMaxOffset;
                    var width = options.viewport.width - 12;


                    this.drawShape(data, shapeContainer,width,height );
                    this.drawMinMax(data, tbody);
                    this.showTrendIndicator(titleContainer);

                    break;

                case 'left':
                    var row = tbody.append("tr");
                    var left = row.append("td");
                    var right = row.append("td");
                   
                    var height = options.viewport.height/2;
                    var width = options.viewport.width / 2 - 10;
                    this.drawShape(data, left, width, height);
                    
                    var subtable = right.append("table").attr("style","width:100%;height:100%;");
                    var titCon = subtable.append("tr").append("td");
                    var actCon = subtable.append("tr").append("td");

                    this.drawTitle(titCon);
                    this.showTrendIndicator(left);
                    this.drawActualVal(actCon);
                    this.drawMinMax(data, subtable);
                    
                    break;

                case 'right':

                    var row = tbody.append("tr");
                   
                    var right = row.append("td");
                    var left = row.append("td");

                    var height = options.viewport.height / 2;
                    var width = options.viewport.width / 2 - 10;
                    this.drawShape(data, left, width, height);

                    var subtable = right.append("table").attr("style", "width:100%;height:100%;");
                    var titCon = subtable.append("tr").append("td");
                    var actCon = subtable.append("tr").append("td");

                    this.drawTitle(titCon);
                    this.showTrendIndicator(left);
                    this.drawActualVal(actCon);
                    this.drawMinMax(data, subtable);

                    break;

                case 'top':

                    var shapeContainer = tbody.append("tr").append("td").attr("colspan","2");

                    var height = options.viewport.height /3;
                    var width = options.viewport.width - 5;

                    this.drawShape(data, shapeContainer, width, height);

                    var row = tbody.append("tr");
                    var titleContainer = row.append("td");
                    var actContainer = row.append("td").style("text-align","right");

                    this.drawTitle(titleContainer);

                    this.drawActualVal(actContainer);

                    
                    this.drawMinMax(data, tbody);
                    this.showTrendIndicator(titleContainer);

                    break;
            }



            this.setBorder(table);

        }

        public setProperties(options) { 

            if (options.dataViews[0].metadata.objects) {
                if (options.dataViews[0].metadata.objects["displayTemplate"]) {
                    var displayTemplateObj = options.dataViews[0].metadata.objects["displayTemplate"];
                    if (displayTemplateObj["selectedTemplate"] !== undefined) this.selectedTemplate = displayTemplateObj["selectedTemplate"];
                    if (displayTemplateObj["displayAs"] !== undefined) this.displayAs = displayTemplateObj["displayAs"];
                    if (displayTemplateObj["showBorder"] !== undefined) this.showBorder = displayTemplateObj["showBorder"];
                    if (displayTemplateObj["showMinMax"] !== undefined) this.showMinMax = displayTemplateObj["showMinMax"];
                    
                }

                if (options.dataViews[0].metadata.objects["Actual"]) {
                    var actualObj = options.dataViews[0].metadata.objects["Actual"];
                    if (actualObj["actualHeader"] !== undefined) this.actualHeader = actualObj["actualHeader"];
                    if (actualObj["actualColor"] !== undefined) this.actualColor = actualObj["actualColor"];
                    if (actualObj["actualValFormat"] !== undefined) this.actualValFormat = actualObj["actualValFormat"];
                    if (actualObj["actualValPrecision"] !== undefined) this.actualValPrecision = actualObj["actualValPrecision"];
                }

                if (options.dataViews[0].metadata.objects["Target"]) {
                    var targetObj = options.dataViews[0].metadata.objects["Target"];
                    if (targetObj["targetHeader"] !== undefined) this.targetHeader = targetObj["targetHeader"];
                    if (targetObj["targetColor"] !== undefined) this.targetColor = targetObj["targetColor"];
                    if (targetObj["targetValFormat"] !== undefined) this.targetValFormat = targetObj["targetValFormat"];
                    if (targetObj["targetValPrecision"] !== undefined) this.targetValPrecision = targetObj["targetValPrecision"];
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

        public drawActualVal(tbody: any) {

            var actContainer = tbody.append("tr").append("td").attr("style", "text-align:center");

            if (this.selectedTemplate === 'top') actContainer = tbody;

            var val = this.actValueFormatter.format(this.chartData.actual.value);
            var actual = actContainer
                .append("span")
                .attr("style", "display:block;font-size:20px;")
                .text(val);

            
         
        }

        public drawTitle(container) {
            var title = "";
            if (this.hasActual) title = title + this.chartData.actual.display;
            if (this.hasTarget) title = title  + " vs " + this.chartData.target.display;
            
                container
                    .append("span")
                    .text(title)
                    .attr("style", "font-size:12px;");
            
           
        }

        public drawMinMax(data, tbody) {
            if (this.showMinMax) {
                var row = tbody.append("tr").append("td").attr("style", "font-size:11px;border-top: 1px solid #dfdede;");
                if (this.selectedTemplate === 'top') row.attr("colspan", "2");

                var arr = data.map(d => d.actual);
                row.append("span").attr("style", "float:left;").text("Min: " + this.actValueFormatter.format(d3.min(arr)));
                row.append("span").attr("style", "float:right;").text("Max: " + this.actValueFormatter.format(d3.max(arr)));
            }
        }

        public drawShape(data, shapeContainer, width, height) {

            if (height < 10) height = 10;


            if (this.hasActual) {

                var xDomain = [];
                var yDomain = [];

                data.map(function (d) {
                    xDomain.push(d.period);
                    yDomain.push(d.actual);
                    if (d.target) yDomain.push(d.target);
                });
                var xScale = d3.scale.ordinal().rangePoints([0, width]).domain(xDomain);

                var xScaleBar = d3.scale.ordinal().rangeRoundBands([0, width],.1).domain(xDomain);

                var min = d3.min(yDomain) < 0 ? d3.min(yDomain) - d3.min(yDomain) * 0.10 : 0;
                var yScalebar = d3.scale.linear().range([height, 0]).domain([min, d3.max(yDomain)]);

                var yScale = d3.scale.linear().range([height, 0]).domain([d3.min(yDomain), d3.max(yDomain)]);

                this.sparklineSelection = shapeContainer
                    .attr("style", "background:#f6f6f6;padding-top:5px;")
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

            this.tooltipServiceWrapper.addTooltip(bars,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, "Actual"),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

            if (this.hasTarget === true) {

                var targetBars = sparklineSelectionG.selectAll(".bar")
                    .data(data)
                    .enter()
                    .append("rect");

                targetBars.attr("x", d => xScale(d.period) + width)
                    .style("fill", this.targetColor.solid.color)
                    .attr("width", width)
                    .attr("y", d => (d.target < 0 ? yScale(0) : yScale(d.target)))
                    .attr("height", 0)
                    .transition()
                    .duration(500)
                    .attr("height", function (d) {
                        var barHeight = d.target < 0 ? (yScale(d.target) - yScale(0)) : (yScale(0) - yScale(d.target));
                        if (barHeight < 1 && barHeight > 0) barHeight = 1;
                        return barHeight;
                    });

                this.tooltipServiceWrapper.addTooltip(targetBars,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, "Target"),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );

            }
        }

        public drawBarLine(sparklineSelectionG, xScale, yScale, data) {

            var width = xScale.rangeBand();
            var bars = sparklineSelectionG.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect");

            this.tooltipServiceWrapper.addTooltip(bars,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, "Actual"),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

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
                            return (xScale(d.period) + width/2) + ',' + yScale(d.target);
                        }).join('L');
                    });
            }
        }

        public showTrendIndicator(container: any) {

            let color = this.trendColorOptions[this.trendColor];

            if (this.trendIndicator === true) {

                var trendIndicator = container
                    .append("svg")
                    .attr("width", 18)
                    .attr("height", 18);

                trendIndicator.attr("style", "position: absolute;top:3px;right: 0;")

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
                    hoverVal = this.actValueFormatter.format(d.actual);
                    if (this.hasTarget) {
                        hoverVal = "A:" + this.actValueFormatter.format(d.actual) + ", T:" + this.targetValueFormatter.format(d.target);
                    }
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

        private getValueFormat(val, max, format, precision) {
           
            let valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
            let iValueFormatter = valueFormatter.create({});
            let valF = null;
            switch (format) {
                case 'thousand':
                    valF = 1001;
                    break;
                case 'million':
                    valF = 1e6;
                    break;
                case 'billion':
                    valF = 1e9;
                    break;
                case 'trillion':
                    valF = 1e12;
                    break;
                case 'default':
                    valF = max;
                    break;
                case 'none':
                    return { format: d3.format(",." + precision+"f")}
            }

            iValueFormatter = valueFormatter.create({ format: val, value: valF, precision: precision });

            return iValueFormatter;
        }

        private getTooltipData(data: any, type: any): VisualTooltipDataItem[] {
            var retData = [];

            if (type === 'Actual') {
                retData.push({
                    header: this.periodName + ": " + data.period,
                    value: this.actValueFormatter.format(data.actual),
                    displayName: this.actualName
                });
            }

            if (type === 'Target') {
                retData.push({
                    header: this.periodName + " : " + data.period,
                    value: this.targetValueFormatter.format(data.target),
                    displayName: this.targetName
                });
            }

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
                    objectEnumeration.push({ objectName: objectName, properties: { showMinMax: this.showMinMax }, selector: null });
                   
                    break;

                case 'Actual':
                    objectEnumeration.push({ objectName: objectName, properties: { actualHeader: this.actualHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualColor: this.actualColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualValFormat: this.actualValFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualValPrecision: this.actualValPrecision }, selector: null });
                    break;

                case 'Target':
                    if (this.hasTarget == true) {
                        objectEnumeration.push({ objectName: objectName, properties: { targetHeader: this.targetHeader }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { targetColor: this.targetColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { targetValFormat: this.targetValFormat }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { targetValPrecision: this.targetValPrecision }, selector: null });
                    }
                    break;

                case 'Line':
                    if (this.displayAs === 'line' || this.displayAs === 'area') {
                        objectEnumeration.push({ objectName: objectName, properties: { transparency: this.lineStroke }, selector: null });
                    }
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