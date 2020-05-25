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


module powerbi.extensibility.visual.multipleSparklineCCFC224D9885417F9AAF5BB8D45B007E  {
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
        private priorHeader: any = "Prior";
        private showChange: any = true;
        private changeHeader: any = "Change";
        private showPerChange: any = true;
        private percentageChangeHeader: any = "% Change";
        private showTotalChange: any = false;
        private totalChangeHeader: any = "Tot Change";
        
        private showTarget: any = true;
        private targetHeader: any = "Target";
        private showVariance: any = true;
        private varianceHeader: any = "Variance";
        private showVariancePer: any = true;
        private variancePerHeader: any = "% Variance";
      

        private metricHeader: any = "Metric";

        private trendIndicator: any = true;
        private flipTrendDirection: any = false;
        private trendColor: any = "RedGreen";
        private trendColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00", "#ff4701"]
        };

        private intensity: any = true;
        private intensityScale: any = "1,4 6,8";
        private intensityColor: any = { solid: { color: "#4682b4" } };

        private bulletScaleMinZero: any = true;
        private bulletHeader:any = "Bullet";
        private conditionalBullet: any = true;
        private conditionalBulletColorScale: any = "5,10,100";
        private bulletSynchronize: any = true;
        private singleBulletColor: any = { solid: { color: "#4682b4" } };

        private conditionalBulletColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00", "#ff4701"]
        };


        private conditionalVariance: any = false;
        private conditionalVarianceColor: any = "GreenRed";

        private conditionalBulletColor: any = "GreenRed";
       

        private aboveThresholdColor: any = { solid: { color: "#00ad00" } };
        private belowThreshold1Color: any = { solid: { color: "#fff701" } };
        private belowThreshold2Color: any = { solid: { color: "#ffbd01" } };
        private belowThreshold3Color: any = { solid: { color: "#ff7601" } };
        private belowThreshold4Color: any = { solid: { color: "#ff4701" } };

        private actualIndex: number;
        private hasActual: any;
        private targetIndex: number;
        private hasTarget: any;
        private hasGroup: any;
        private groupIndex: number;
        private hasPeriod: any;
        private periodIndex: number;
        private dateFormat: any;
        private sortBy: any = "default";
        private sortHeader: any = "default";

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
        private headerFixed: any = false;
        private headerBgColor: any = { solid: { color: "#ffffff" } }; 
     
        private headerLineColor: any = { solid: { color: "#ee9207" } }; 
        private rowBanding: any = true;
        private fontColor: any = { solid: { color: "#777777" } }; 
        private rowBandingColor: any = { solid: { color: "#ececec" } }; 
        private fontStyle: any = "Segoe UI";

        private sparklineHeader:any = "Sparkline";
        private sparklineColor: any = { solid: { color: "#4682b4" } }; 

        private filterNullPeriod:any = false;

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            this.selectionManager.registerOnSelectCallback(() => {
                rows.style("opacity", 1);
            });

            if (options.dataViews[0].metadata.objects) {
                if (options.dataViews[0].metadata.objects["Actual"]) {
                    var actObj = options.dataViews[0].metadata.objects["Actual"];
                 
                    if (actObj["currentHeader"] !== undefined) this.currentHeader = actObj["currentHeader"];
                    if (actObj["priorHeader"] !== undefined) this.priorHeader = actObj["priorHeader"];
                    if (actObj["showChange"] !== undefined) this.showChange = actObj["showChange"];
                    if (actObj["changeHeader"] !== undefined) this.changeHeader = actObj["changeHeader"];
                    if (actObj["showPerChange"] !== undefined) this.showPerChange = actObj["showPerChange"];
                    if (actObj["percentageChangeHeader"] !== undefined) this.percentageChangeHeader = actObj["percentageChangeHeader"];
                    // if (actObj["showTotalChange"] !== undefined) this.showTotalChange = actObj["showTotalChange"];
                    if (actObj["totalChangeHeader"] !== undefined) this.totalChangeHeader = actObj["totalChangeHeader"];
                    if (actObj["filterNullPeriod"] !== undefined) this.filterNullPeriod = actObj["filterNullPeriod"];
                   
                    
                }
                if (options.dataViews[0].metadata.objects["Target"]) {
                    var targetObj = options.dataViews[0].metadata.objects["Target"];

                    if (targetObj["showTarget"] !== undefined) this.showTarget = targetObj["showTarget"];
                    if (targetObj["showTarget"] !== undefined) this.showTarget = targetObj["showTarget"];
                    if (targetObj["targetHeader"] !== undefined) this.targetHeader = targetObj["targetHeader"];
                    if (targetObj["showVariance"] !== undefined) this.showVariance = targetObj["showVariance"];
                    if (targetObj["varianceHeader"] !== undefined) this.varianceHeader = targetObj["varianceHeader"];
                    if (targetObj["showVariancePer"] !== undefined) this.showVariancePer = targetObj["showVariancePer"];
                    if (targetObj["variancePerHeader"] !== undefined) this.variancePerHeader = targetObj["variancePerHeader"];
                    if (targetObj["conditionalVariance"] !== undefined) this.conditionalVariance = targetObj["conditionalVariance"];
                    if (targetObj["conditionalVarianceColor"] !== undefined) this.conditionalVarianceColor = targetObj["conditionalVarianceColor"];

                }
                if (options.dataViews[0].metadata.objects["Metric"]) {
                    var metricObj = options.dataViews[0].metadata.objects["Metric"];

                    if (metricObj["metricHeader"] !== undefined) this.metricHeader = metricObj["metricHeader"];
                
                }
                if (options.dataViews[0].metadata.objects["Sparkline"]) {
                    var sparklineObj = options.dataViews[0].metadata.objects["Sparkline"];
                    if (sparklineObj["sparklineHeader"] !== undefined) this.sparklineHeader = sparklineObj["sparklineHeader"];
                    if (sparklineObj["sparklineColor"] !== undefined) this.sparklineColor = sparklineObj["sparklineColor"];
                }

                if (options.dataViews[0].metadata.objects["Trend"]) {
                    var trendObj = options.dataViews[0].metadata.objects["Trend"];

                    if (trendObj["show"] !== undefined) this.trendIndicator = trendObj["show"];
                    if (trendObj["flipTrendDirection"] !== undefined) this.flipTrendDirection = trendObj["flipTrendDirection"];
                    if (trendObj["trendColor"] !== undefined) this.trendColor = trendObj["trendColor"];
                }
                if (options.dataViews[0].metadata.objects["Bullet"]) {
                    var bulletObj = options.dataViews[0].metadata.objects["Bullet"];

                    if (bulletObj["bulletHeader"] !== undefined) this.bulletHeader = bulletObj["bulletHeader"];
                    if (bulletObj["conditionalBullet"] !== undefined) this.conditionalBullet = bulletObj["conditionalBullet"];
                    if (bulletObj["conditionalBulletColor"] !== undefined) this.conditionalBulletColor = bulletObj["conditionalBulletColor"];
                    if (bulletObj["singleBulletColor"] !== undefined) this.singleBulletColor = bulletObj["singleBulletColor"];
                    if (bulletObj["conditionalBulletColorScale"] !== undefined) this.conditionalBulletColorScale = bulletObj["conditionalBulletColorScale"];
                    if (bulletObj["bulletScaleMinZero"] !== undefined) this.bulletScaleMinZero = bulletObj["bulletScaleMinZero"];
                    if (bulletObj["bulletSynchronize"] !== undefined) this.bulletSynchronize = bulletObj["bulletSynchronize"];
                   
                    
                }
                if (options.dataViews[0].metadata.objects["Intensity"]) {
                    var intensityObj = options.dataViews[0].metadata.objects["Intensity"];

                    if (intensityObj["show"] !== undefined) this.intensity = intensityObj["show"];
                    if (intensityObj["intensityScale"] !== undefined) this.intensityScale = intensityObj["intensityScale"];
                    if (intensityObj["intensityColor"] !== undefined) this.intensityColor = intensityObj["intensityColor"];

                }
                if (options.dataViews[0].metadata.objects["Threshold"]) {
                    var thresholdObj = options.dataViews[0].metadata.objects["Threshold"];

                    if (thresholdObj["aboveThresholdColor"] !== undefined) this.aboveThresholdColor = thresholdObj["aboveThresholdColor"];
                    if (thresholdObj["belowThreshold1Color"] !== undefined) this.belowThreshold1Color = thresholdObj["belowThreshold1Color"];
                    if (thresholdObj["belowThreshold2Color"] !== undefined) this.belowThreshold2Color = thresholdObj["belowThreshold2Color"];
                    if (thresholdObj["belowThreshold3Color"] !== undefined) this.belowThreshold3Color = thresholdObj["belowThreshold3Color"];
                    if (thresholdObj["belowThreshold4Color"] !== undefined) this.belowThreshold4Color = thresholdObj["belowThreshold4Color"];

                }

                  if (options.dataViews[0].metadata.objects["Sort"]) {
                    var sortObj = options.dataViews[0].metadata.objects["Sort"];

                    if (sortObj["sortHeader"] !== undefined) this.sortHeader = sortObj["sortHeader"];
                    if (sortObj["sortBy"] !== undefined) this.sortBy = sortObj["sortBy"];
                  
                }

                if (options.dataViews[0].metadata.objects["Style"]) {
                    var styleObj = options.dataViews[0].metadata.objects["Style"];

                    if (styleObj["rowBanding"] !== undefined) this.rowBanding = styleObj["rowBanding"];
                    if (styleObj["rowBandingColor"] !== undefined) this.rowBandingColor = styleObj["rowBandingColor"];
                   
                    if (styleObj.fontSize !== undefined) this.fontSize = styleObj["fontSize"];
                    if (styleObj.fontColor !== undefined) this.fontColor = styleObj["fontColor"];
                    if (styleObj.fontStyle !== undefined) this.fontStyle = styleObj["fontStyle"];

                    if (styleObj["headerLineColor"] !== undefined) this.headerLineColor = styleObj["headerLineColor"];
                    if (styleObj["headerFixed"] !== undefined) this.headerFixed = styleObj["headerFixed"];
                    if (styleObj["headerBgColor"] !== undefined) this.headerBgColor = styleObj["headerBgColor"];
                   
                }
            }

            this.element.style("overflow", "auto");
            this.element.select('.multipleSparkline').remove();


            this.hasTarget = false;
            this.hasActual = false;
            this.hasPeriod = false;
            this.hasGroup = false;

            this.columns.map((d, i) => {

                if (d.roles["target"]) {
                    this.hasTarget = true;
                    this.targetIndex = i;
                }
                if (d.roles["actual"]) {
                    this.hasActual = true;
                    this.actualIndex = i;
                }
                if (d.roles["group"]) {
                    this.hasGroup = true;
                    this.groupIndex = i;
                }
                if (d.roles["period"]) {

                    this.hasPeriod = true;
                    this.dateFormat = d.format;
                    this.periodIndex = i;
                }
                return d;
            });

            var element = this.element
                .append("div")
                .attr("class", "multipleSparkline")
                .attr("style", "width:100%;");

            // element.append("div").attr("style","padding:5px 15px;text-decoration:underline;font-size:10px;background:orange;color:#fff;")
            //     .append("a")
            //     .attr("src","http://ddvisual.com.au/")
            //     .text('This is the demo version of visual. BUY NOW! Visit: http://ddvisual.com.au');


            var table = element.append("table")
                .attr("style", "width:100%;text-align:left;border-spacing:0");

            if (this.hasActual === false || (this.hasPeriod === false && this.hasGroup === false)) {
                table
                    .append("html")
                    .attr("style", "")
                    .html("Data is required to draw the visual");

                return;
            }



            this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value: 1001 });

            if (this.hasActual) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.actualIndex].format });
            else if (this.hasTarget) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.targetIndex].format });

            var nestedData, data = [], identityData;

            nestedData = this.formatData(options.dataViews[0]);


            nestedData.map((d, i) => {
                if(this.filterNullPeriod === true) d.values = d.values.filter(d=>d.actual !== null);
                
                var actual = this.hasActual ? d.values[d.values.length - 1].actual : 0;
                var secondLastActual = 0;
                if (d.values[d.values.length - 2]) secondLastActual = this.hasActual ? d.values[d.values.length - 2].actual : 0;

                var firstActual = this.hasActual ? d.values[0].actual : 0;
                var target = this.hasTarget ? d.values[d.values.length - 1].target : 0;

                d.values.map((d) => {
                    d.yValue = this.hasActual ? d.actual : 0;
                    d.xValue = this.hasPeriod ? d.period : "";
                });

                var VP = 0;

                if (this.hasActual && this.hasTarget) {
                    var current = d.values[d.values.length - 1].actual;
                    var target = d.values[d.values.length - 1].target;
                    VP = ((current - target) / Math.abs(target)) * 100;
                }
                var percentage, last, secondlast, retVal;
                if (d.values.length > 1) {
                    var last = d.values[d.values.length - 1].actual;
                    var secondlast = d.values[d.values.length - 2].target;

                    percentage = ((last - secondlast) / Math.abs(secondlast)) * 100;

                    if (last === null || secondlast === null) percentage = 0;

                }
                else percentage = 0;

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
                    percentage: Math.abs(percentage),
                    identity: d.identity
                });

            });


        data = this.sortData(data);


            if (nestedData.length === 0) {
                table
                    .append("html")
                    .attr("style", "")
                    .html("Data is required to draw visual");

                return;
            }

            var thead = table.append("thead");
            var tbody = table.append("tbody");

            var rows = tbody.selectAll(".rows")
                .data(data)
                .enter()
                .append("tr")
            
            if(this.rowBanding) {
                rows.style("background", (d, i)=> { return i % 2 === 0 ? "transparent" : this.rowBandingColor.solid.color });
                rows.style("color", (d, i)=> { return i % 2 === 0 ? this.fontColor.solid.color : this.pickTextColorBasedOnBgColorSimple(this.rowBandingColor.solid.color, "#fff", this.fontColor.solid.color) });
            }
            else{
                rows.style("color",  this.fontColor.solid.color);
            }

            rows.on("click", (d, i) => {
                d.isFiltered = !d.isFiltered;

                this.selectionManager.select(d.identity, true);

                this.setFilterOpacity(rows);
            })

            this.showIntensityCircle(rows, thead);
            this.drawMetric(rows, thead);
           
            if (this.hasPeriod) {
                this.drawSparkline(data, rows, thead);
                this.drawBisectorToolTip();
            }
           
            this.drawCurrent(rows, thead);

            if (this.hasPeriod) {
                this.drawPrior(rows, thead);
                this.drawChange(rows, thead);
                this.drawPerChange(rows, thead);
                this.drawTotalChange(rows, thead);
                this.showTrendIndicator(rows, thead);
            }
            
            this.drawBullet(data, rows, thead);
            this.drawTarget(rows, thead);
            this.drawVariance(rows, thead);
            this.drawVariancePer(rows, thead);
            this.drawAdditionalFields(rows, thead);
            this.updateRowStyle(tbody, thead);
            this.setFontSize(table);

          
         
        }

        public sortData(data) {

            if(this.sortHeader !== "default" && this.sortBy !== "default") {

                if(this.sortHeader === "key"){
    
                        if(this.sortBy === "ascending"){
                                return data.sort((a, b)=>{
                                    if(a.key < b.key) { return -1; }
                                    if(a.key > b.key) { return 1; }
                                    return 0;
                                })
                        }
                        else if(this.sortBy === "descending"){
                                return data.sort((a, b)=>{
                                    if(a.key < b.key) { return 1; }
                                    if(a.key > b.key) { return -1; }
                                    return 0;
                                })
                        }
                        else{
                            return data;
                        }

                }
                if(this.sortBy === "ascending"){
                    return data.sort((a,b) => {
                                return a[this.sortHeader] - b[this.sortHeader];
                                });
                }
                else if(this.sortBy === "descending"){
                    return data.sort((a,b) => {
                                return b[this.sortHeader] - a[this.sortHeader];
                                });
                }
            }
            else {
                return data;
            }
          
           
        }

        public setFilterOpacity(rows) {

            var anyFilter = false;
            rows.each(d => {
                if (d.isFiltered === true) anyFilter = true;
            });

            if (anyFilter) {
                rows.style("opacity", d => d.isFiltered ? 1 : 0.2);
            }
            else {
                rows.style("opacity", 1);
            }

        }

        public drawMetric(rows: any, thead: any) {

            thead.append("th")
                .append("span")
                .html(this.metricHeader);

            rows
                .append("td")
                .append("html")
                .text((d) => { return d.key });
        }

        public drawCurrent(rows: any, thead: any) {

            thead.append("th")
                .append("span")
                .html(this.currentHeader);

            var current = rows
                .append("td")
                .attr("class", "currentText")
                .append("html");

            current.text((d) => this.iValueFormatter.format(d.values[d.values.length - 1].yValue));

            this.tooltipServiceWrapper.addTooltip(current,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Current'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        public drawPrior(rows: any, thead: any) {

            thead.append("th")
                .append("span")
                .html(this.priorHeader);

            var prior = rows
                .append("td")
                .append("html")
                .text((d) => {
                   if(d.values.length > 1) return this.iValueFormatter.format(d.values[d.values.length - 2].yValue)
                   else return "-";
                });

            this.tooltipServiceWrapper.addTooltip(prior,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Prior'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        public drawSparkline(data: any, rows: any, thead: any) {
            if (this.hasActual) {
                thead.append("th")
                    .append("span")
                    .html(this.sparklineHeader);

                this.sparklineSelection = rows.append("td")
                    .append("svg")
                    .attr("width", 120)
                    .attr("height", 30);

                this.sparklineSelection.append("path")
                    .attr("class", "line")
                    .attr("style", "stroke: "+ this.sparklineColor.solid.color +"; stroke-width:2; fill: none;")
                    .attr("d", function (d: any) {

                        var xDomain = [];
                        var yDomain = [];

                        d.values.map(function (d) {
                            xDomain.push(d.xValue);
                            yDomain.push(d.yValue);
                        });

                        var xScale = d3.scale.ordinal().rangeBands([0, 120]).domain(xDomain);
                        var yScale = d3.scale.linear().range([25, 0]).domain([d3.min(yDomain), d3.max(yDomain)]);

                        return "M" + d.values.map((d) => {
                            return xScale("" + d.xValue + "") + ',' + yScale(d.yValue);
                        }).join('L');
                    });
            }
        }

        public drawChange(rows: any, thead: any) {

            if (this.hasActual && this.showChange) {
                thead.append("th")
                    .append("span")
                    .html(this.changeHeader);

                var change = rows
                    .append("td")
                    .append("html")
                    .text((d) => {
                        if(d.values.length > 1) d.change
                        else return "-"
                    });

                change.text((d) =>{
                    if(d.values.length > 1) return this.iValueFormatter.format(d.change)
                    else return "-"
                } );

                this.tooltipServiceWrapper.addTooltip(change,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Change'),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
            }
        }

        public drawPerChange(rows: any, thead: any) {

            if (this.hasActual && this.showPerChange) {
                thead.append("th")
                    .append("span")
                    .html(this.percentageChangeHeader);

                var perChange = rows
                    .append("td")
                    .append("html")
                    .text((d) => {
                        if(d.values.length > 1) return d.perChange.toFixed(2) + "%"
                        else return "-"
                    });

            }
        }

        public drawTotalChange(rows: any, thead: any) {

            if (this.hasActual && this.showTotalChange) {
                thead.append("th")
                    .append("span")
                    .html(this.totalChangeHeader);

                var perChange = rows
                    .append("td")
                    .append("html")
                    .text((d) => d.totalChange.toFixed(2) + "%");
            }
        }

        public showTrendIndicator(rows: any, thead: any) {

            let color = this.trendColorOptions[this.trendColor];

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
                        if(d.values.length < 2) return "translate(10,-1112)";
                        else if(d.actual == d.secondLastActual) return "translate(10,-1112)";
                        else return "translate(10,12), rotate(" + d.trend + ")";
                    })
                    .style("fill", d => d.trend === 0 ? color[0] : color[1]);

            }
          
        }

        public showIntensityCircle(rows: any, thead: any) {

            if (this.intensity === true) {
                var rangeArr = [1, 4, 6, 8];
                var threshold = 1;

                if (this.intensityScale.length > 0) {
                    var rangeArrr = this.intensityScale.split(",");
                    threshold = parseFloat(rangeArrr[0]);
                    rangeArr = rangeArrr.map(function (d) { return parseFloat(d); }).concat([100]);
                }

                var colorRange = (d3.range(1, 10, (10 / (rangeArr.length - 1)))).concat([10]);

                var colorIntensityScale = d3.scale.threshold()
                    .domain(rangeArr)
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

                        if (Math.abs(d.perChange) > threshold) retVal = colorIntensityScale(Math.abs(d.perChange));
                        else retVal = 0;

                        return retVal / 10;

                    });



            }
        }

        public drawBullet(data: any, rows: any, thead: any) {

            if (this.hasTarget) {
                thead.append("th")
                    .append("span")
                    .html(this.bulletHeader);

                var targetMax = d3.max(data.map((d) => d.target));
                var actualMax = d3.max(data.map((d) => d.actual));

                var backgroundBarLen = d3.max([targetMax, actualMax]) * 1.15;
                var min = 0;
                if (this.bulletScaleMinZero === false) min = d3.min(data.map((d) => d.actual));

                var barScale = d3.scale.linear().range([0, 120]).domain([min, backgroundBarLen]);

                var bullet = rows.append("td")
                    .append("svg")
                    .attr("width", 120)
                    .attr("height", 20)

                    .attr("class", "bullet");

                bullet.append("rect").attr("width", 120).attr("height", 20).attr("style", "fill:#d0cece;")
var scale;
                var bulletRect = bullet.append("rect")
                    .attr("width", (d) => {
                        if (this.bulletSynchronize === false){
                            scale = d3.scale.linear().range([0, 120]).domain([0, d.target* 1.15]);
                           return scale(d.actual)
                        }
                        return barScale(d.actual)
                    })
                    .attr("height", 20);

                if (this.conditionalBullet === false) {
                    bulletRect.style("fill", this.singleBulletColor.solid.color);
                }
                else {
                    bulletRect
                        .style("fill", d => {
                            if (d.variance > 0) return this.conditionalBulletColorOptions[this.conditionalBulletColor][0];
                            else return this.conditionalBulletColorOptions[this.conditionalBulletColor][1];
                        });
                }

                // var thresholdData = this.columns.filter((d, i) => {
                //     d.Index = i;
                //     return d.roles["threshold"] == true
                // });

                // if (thresholdData.length > 0) {
                //     bulletRect
                //         .style("fill", d => {
                //             let item = d.values[d.values.length - 1];
                //             var fill = "#fff";
                //             thresholdData.forEach((t, i) => {
                //                 if (d.target >= item[t.Index]) fill = this.aboveThresholdColor.solid.color;
                //                 else {
                //                     let y = 'belowThreshold' + (i + 1) + 'Color';
                //                     if (d.target < item[t.Index]) fill = this[y].solid.color;
                //                 }
                //             })

                //             return fill;

                //         });
                // }

                bullet.append("rect")
                    .attr("width", 2)
                    .attr("x", (d) => {
                        if (this.bulletSynchronize === false){
                            scale = d3.scale.linear().range([0, 120]).domain([0, d.target* 1.15]);
                           return scale(d.target)
                        }
                        return barScale(d.target)
                    })
                    .attr("height", 20)
                    .attr("style", "fill:#000;");

            }

        }

        public drawTarget(rows: any, thead: any) {

            if (this.showTarget && this.hasTarget) {
                thead.append("th")
                    .append("span")
                    .html(this.targetHeader);

                var target = rows
                    .append("td")
                    .append("html")
                    .text((d) => this.iValueFormatter.format(d.target));


                this.tooltipServiceWrapper.addTooltip(target,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Target'),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
            }
        }

        public drawVariance(rows: any, thead: any) {

            if (this.showVariance && this.hasTarget) {
                thead.append("th")
                    .append("span")
                    .html(this.varianceHeader);

                var variance = rows
                    .append("td")
                    .append("html")
                    .text((d) => this.iValueFormatter.format(d.variance));
                   
                if (this.conditionalVariance == true) {
                    variance.style("color", d => {
                        if (d.variance > 0) return this.conditionalBulletColorOptions[this.conditionalVarianceColor][0];
                        else return this.conditionalBulletColorOptions[this.conditionalVarianceColor][1];
                    });
                }

                this.tooltipServiceWrapper.addTooltip(variance,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Variance'),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
            }
        }

        public drawVariancePer(rows: any, thead: any) {
            if (this.showVariancePer && this.hasTarget) {
                thead.append("th")
                    .append("span")
                    .html(this.variancePerHeader);

                var variancePer = rows
                    .append("td")
                    .append("html")
                    .text((d) => d.variancePer + "%");

                if (this.conditionalVariance == true) {
                    variancePer.style("color", d => {
                        if (d.variance > 0) return this.conditionalBulletColorOptions[this.conditionalVarianceColor][0];
                        else return this.conditionalBulletColorOptions[this.conditionalVarianceColor][1];
                    });
                }

                this.tooltipServiceWrapper.addTooltip(variancePer,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'VariancePer'),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
            }
        }

        public drawAdditionalFields(rows: any, thead: any) {

            this.additionalValues.map((d, i) => {
                var format = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.format });

                thead.append("th")
                    .append("span")
                    .html(d.key);

                rows
                    .append("td")
                    .append("html")
                    .text((e) => {
                        return (e.values[e.values.length - 1].additional[i].caption);
                    });
            });

        }

        private setFontSize(chartSvg) {
            chartSvg.style("font-size", this.fontSize + "px").style("font-family", this.fontStyle);
            //
            if(this.headerFixed){
                chartSvg.selectAll("th").style("position","sticky").style("top",0);
                
            }
            chartSvg.selectAll("th").style("background",this.headerBgColor.solid.color);
            chartSvg.selectAll("th").style("color",this.pickTextColorBasedOnBgColorSimple(this.headerBgColor.solid.color, "#ffffff", this.fontColor.solid.color))  
            
            
        }
        //#region Tooltip
        public drawBisectorToolTip() {

            var self = this;

            this.sparklineSelection
                .on("mouseover", d => {
                    this.sparklineMarker.style("display", null);
                })
                .on("mouseout", d => {
                    this.sparklineMarker.style("display", "none");
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
                .attr("dy", 12)
                .attr("style", "cursor:pointer;font-size:12px; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;");


            this.sparklineCaptionValue = this.sparklineMarker
                .append("text")
                .attr("dy", 25)
                .attr("style", "cursor:pointer;font-size:12px; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;");

        }

        public mouseMove(d: any, el: any) {

            var selected = d;

            this.sparklineMarker.attr("style", function (d: any) {
                return selected.key === d.key ? "display:inherit" : "display:none";
            });

            var xPos = d3.mouse(el)[0];

            this.sparklineMarker.attr("transform", function () {
                return "translate(" + (xPos) + ",0)";
            });

            var catScale = d3.scale.ordinal()
                .rangeBands([0, 120])
                .domain(selected.values.map(function (d) { return d.xValue; }));


            var leftEdges = catScale.domain().map(function (d, i) { return catScale.rangeBand() * i });

            var j;
            for (j = 0; xPos > leftEdges[j] + (catScale.rangeBand() / 2); j++) { }

            var hoverXValue = catScale.domain()[j];
            var hoverVal;

            selected.values.map(d => {
                if (d.xValue === hoverXValue) {
                    hoverVal = this.iValueFormatter.format(d.yValue);
                }
            });

            if (this.dateFormat != undefined) {
                let dateformat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.dateFormat });
                hoverXValue = dateformat.format(hoverXValue);

            }

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

        public pickTextColorBasedOnBgColorSimple(bgColor, lightColor, darkColor) {
            var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
            var r = parseInt(color.substring(0, 2), 16); // hexToR
            var g = parseInt(color.substring(2, 4), 16); // hexToG
            var b = parseInt(color.substring(4, 6), 16); // hexToB
            return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
              darkColor : lightColor;
          }

        public updateRowStyle(tbody: any, thead: any) {

            thead.selectAll("th")
            .attr("style", "padding:5px;border-bottom: 1px solid "+ this.headerLineColor.solid.color +";color:"+ this.fontColor.solid.color +";");
           
            tbody.selectAll("td")
            .attr("style", "padding:5px;");

        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any, vtype: any): VisualTooltipDataItem[] {
            var retData = [];
            var val = '';
            switch (vtype) {
                case 'Current':
                    val = this.iValueFormatter.format(data.values[data.values.length - 1].yValue);
                    break;
                case 'Actual':
                    val = this.iValueFormatter.format(data.actual);
                    break;
                case 'Target':
                    val = this.iValueFormatter.format(data.target);
                    break;
                case 'Change':
                    val = this.iValueFormatter.format(data.change);
                    break;
                case 'perChange':
                    val = data.perChange;
                    break;
                case 'Prior':
                    val = this.iValueFormatter.format(data.values[data.values.length - 2].yValue);
                    break;
                case 'Variance':
                    val = this.iValueFormatter.format(data.variance);
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
        }

        public formatData(rawData) {

            var metadata = rawData.metadata.columns;
            var formattedData = [], group = [], period = [], actual = [], target = [];

            if (this.hasGroup) group = rawData.categorical.categories[0].values;

            var measures = rawData.categorical.values;

            var actualValues = measures.filter(d => d.source.roles.actual);

            if (this.hasTarget) {
                var targetValues = measures.filter(d => d.source.roles.target);
            }

            var additionalValues = measures.filter(d => d.source.roles.additional);

            var addVal = d3.nest()
                .key((d: any) => d.source.displayName)
                .entries(additionalValues);

            this.additionalValues = addVal;

            if (this.hasGroup && this.hasPeriod) {
                formattedData = group.map((t, i) => {

                    return {
                        key: t,
                        identity: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).createSelectionId(),
                        values: actualValues.map((d, j) => {
                            return {
                                actual: d.values[i],
                                target: this.hasTarget ? targetValues[j].values[i] : 0,
                                group: t,
                                period: d.source.groupName,
                                additional: addVal.map(d => {
                                    var format = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.values[j].source.format });
                                    return { key: d.key, val: d.values[j].values[i], caption: format.format(d.values[j].values[i]) }
                                })
                            }
                        })
                    }
                });
            }
            else if (this.hasGroup) {
                formattedData = group.map((t, i) => {

                    return {
                        key: t,
                        identity: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).createSelectionId(),
                        values: actualValues.map((d, j) => {
                            return {
                                actual: d.values[i],
                                target: this.hasTarget ? targetValues[j].values[i] : 0,
                                group: t,
                                period: "Test",
                                additional: addVal.map(d => {
                                    var format = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.values[j].source.format });
                                    return { key: d.key, val: d.values[j].values[i], caption: format.format(d.values[j].values[i]) }
                                })
                            }
                        })
                    }
                });
            }
            else {

                formattedData = [{
                    key: "Measure",
                    values: measures.map((d, j) => {
                        return {
                            actual: d.values[0],
                            target: this.hasTarget ? targetValues[j].values[0] : 0,
                            group: "Measure",
                            period: d.source.groupName,
                            additional: addVal.map(d => {
                                var format = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.values[j].source.format });
                                return { key: d.key, val: d.values[j].values[0], caption: format.format(d.values[j].values[0]) }
                            })
                        }
                    })
                }
                ]
            };

            return formattedData;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'Actual':
                    objectEnumeration.push({ objectName: objectName, properties: { currentHeader: this.currentHeader},selector: null});
                    objectEnumeration.push({ objectName: objectName, properties: { priorHeader: this.priorHeader},selector: null});
                    objectEnumeration.push({ objectName: objectName, properties: { showChange: this.showChange }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { changeHeader: this.changeHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showPerChange: this.showPerChange }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { percentageChangeHeader: this.percentageChangeHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { filterNullPeriod: this.filterNullPeriod }, selector: null });
                   
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
                    objectEnumeration.push({ objectName: objectName, properties: { conditionalVariance: this.conditionalVariance }, selector: null });
                    if (this.conditionalVariance) objectEnumeration.push({ objectName: objectName, properties: { conditionalVarianceColor: this.conditionalVarianceColor }, selector: null });

                    break;
                case 'Metric':
                        objectEnumeration.push({ objectName: objectName, properties: { metricHeader: this.metricHeader }, selector: null });
                    break;  

                case 'Sparkline':
                        objectEnumeration.push({ objectName: objectName, properties: {sparklineHeader: this.sparklineHeader }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: {sparklineColor: this.sparklineColor }, selector: null });
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
                    objectEnumeration.push({ objectName: objectName, properties: { bulletHeader: this.bulletHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { conditionalBullet: this.conditionalBullet }, selector: null });
                    if (this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColor: this.conditionalBulletColor }, selector: null });
                    if (this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColorScale: this.conditionalBulletColorScale }, selector: null });
                    if (!this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { singleBulletColor: this.singleBulletColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { bulletScaleMinZero: this.bulletScaleMinZero }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { bulletSynchronize: this.bulletSynchronize }, selector: null });
                    
                    break;
                case 'Threshold':

                    var thresholdData = this.columns.filter((d, i) => {
                        d.Index = i;
                        return d.roles["threshold"] == true;
                    });


                    if (thresholdData.length > 0) {
                        objectEnumeration.push({ objectName: objectName, properties: { 'aboveThresholdColor': this.aboveThresholdColor }, selector: null });
                        if (thresholdData.length > 0) objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold1Color': this.belowThreshold1Color }, selector: null });
                        if (thresholdData.length > 1) objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold2Color': this.belowThreshold2Color }, selector: null });
                        if (thresholdData.length > 2) objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold3Color': this.belowThreshold3Color }, selector: null });
                        if (thresholdData.length > 3) objectEnumeration.push({ objectName: objectName, properties: { 'belowThreshold4Color': this.belowThreshold4Color }, selector: null });
                    }

                    break;
                    case 'Sort':
                        objectEnumeration.push({ objectName: objectName, properties: { 'sortHeader': this.sortHeader }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { 'sortBy': this.sortBy }, selector: null });
                    break;

                    case 'Style':
                        objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { fontColor: this.fontColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { fontStyle: this.fontStyle }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { 'headerLineColor': this.headerLineColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { 'rowBanding': this.rowBanding }, selector: null });
                        if(this.rowBanding)objectEnumeration.push({ objectName: objectName, properties: { 'rowBandingColor': this.rowBandingColor }, selector: null });

                        objectEnumeration.push({ objectName: objectName, properties: { 'headerFixed': this.headerFixed }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { 'headerBgColor': this.headerBgColor }, selector: null });
                       
                   
                    break;

            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}