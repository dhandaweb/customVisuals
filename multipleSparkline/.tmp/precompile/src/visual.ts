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

        private columns: any;
        private showActual: any = false;
        private actualHeader: any = "Actual";
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
        private bulletScaleMinZero: any = true;

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

        private conditionalBullet: any = true;
        private conditionalBulletColorScale: any = "5,10,100";
        
        private conditionalBulletColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00","#ff4701"]
        };

        private conditionalBulletColor: any = "GreenRed";
        private singleBulletColor: any = { solid: { color: "#4682b4" } };

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

        private iValueFormatter:any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private sparklineSelection: d3.Selection<SVGElement>;
        private sparklineMarker: d3.Selection<SVGElement>;
        private sparklineMarkerLine: d3.Selection<SVGElement>;
        private sparklineCaptionName: d3.Selection<SVGElement>;
        private sparklineCaptionValue: d3.Selection<SVGElement>;


        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public  TooltipEnabledDataPoint: any;

        private fontSize: any = 12;
        private HeaderTextColor: any;
        private BoldHeaderText: any;
        private RowBanding: any;
        private HighlightNegative: any;
        private NegativeTextColor: any;
       

       constructor(options: VisualConstructorOptions) {
           
           this.element = d3.select(options.element);
           this.host = options.host;
           this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
           this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
           this.columns = options.dataViews[0].metadata.columns;
            //console.log(options.dataViews[0]);
           this.selectionManager.registerOnSelectCallback(() => {
               rows.style("opacity", 1);
           });

           if (options.dataViews[0].metadata.objects) {
               if (options.dataViews[0].metadata.objects["Actual"]) {
                   var actObj = options.dataViews[0].metadata.objects["Actual"];
                   //if (actObj.showActual !== undefined) this.showActual = actObj["showActual"];
                   if (actObj["actualHeader"] !== undefined) this.actualHeader = actObj["actualHeader"];
                   if (actObj["showChange"] !== undefined) this.showChange = actObj["showChange"];
                   if (actObj["changeHeader"] !== undefined) this.changeHeader = actObj["changeHeader"];
                   if (actObj["showPerChange"] !== undefined) this.showPerChange = actObj["showPerChange"];
                   if (actObj["percentageChangeHeader"] !== undefined) this.percentageChangeHeader = actObj["percentageChangeHeader"];
                  // if (actObj["showTotalChange"] !== undefined) this.showTotalChange = actObj["showTotalChange"];
                   if (actObj["totalChangeHeader"] !== undefined) this.totalChangeHeader = actObj["totalChangeHeader"];
                   if (actObj.fontSize !== undefined) this.fontSize = actObj["fontSize"];

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
                   
               }
               if (options.dataViews[0].metadata.objects["Trend"]) {
                   var trendObj = options.dataViews[0].metadata.objects["Trend"];

                   if (trendObj["show"] !== undefined) this.trendIndicator = trendObj["show"];
                   if (trendObj["flipTrendDirection"] !== undefined) this.flipTrendDirection = trendObj["flipTrendDirection"];
                   if (trendObj["trendColor"] !== undefined) this.trendColor = trendObj["trendColor"];
               }
               if (options.dataViews[0].metadata.objects["Bullet"]) {
                   var bulletObj = options.dataViews[0].metadata.objects["Bullet"];

                   if (bulletObj["conditionalBullet"] !== undefined) this.conditionalBullet = bulletObj["conditionalBullet"];
                   if (bulletObj["conditionalBulletColor"] !== undefined) this.conditionalBulletColor = bulletObj["conditionalBulletColor"];
                   if (bulletObj["conditionalBulletColor"] !== undefined) this.conditionalBulletColor = bulletObj["conditionalBulletColor"];
                   if (bulletObj["conditionalBulletColorScale"] !== undefined) this.conditionalBulletColorScale = bulletObj["conditionalBulletColorScale"];
                   if (bulletObj["bulletScaleMinZero"] !== undefined) this.bulletScaleMinZero = bulletObj["bulletScaleMinZero"];
                   
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
            }

           this.hasTarget = false;
           this.hasActual = false;
           this.hasPeriod = false;
           this.hasGroup = false;
          
           this.columns.map((d,i) => {
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
        
           this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value:1001 });
        
           if (this.hasActual) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.actualIndex].format });
           else if (this.hasTarget) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.targetIndex].format });

           var nestedData, data = [], identityData;
           options.dataViews[0].table.rows = options.dataViews[0].table.rows.map((d:any,i) => {
                        d.identity = options.dataViews[0].table.identity[i]
                   return d;
           });

           if (this.hasGroup && this.hasPeriod) {
               nestedData  = d3.nest()
                   .key((d) => d[this.groupIndex])
                   .entries(options.dataViews[0].table.rows);

           }
           else if (this.hasPeriod){
               nestedData = [{
                   key: options.dataViews[0].metadata.columns[this.actualIndex].displayName,
                   values: options.dataViews[0].table.rows
               }];
           }

           nestedData.map((d,i)=> {
               var actual = this.hasActual ? d.values[d.values.length - 1][this.actualIndex] : 0;
              
               var secondLastActual = this.hasActual ? d.values[d.values.length - 2][this.actualIndex] : 0;
               var firstActual = this.hasActual ? d.values[0][this.actualIndex] : 0;
               var target = this.hasTarget ? d.values[d.values.length - 1][this.targetIndex] : 0;

               d.values.map((d) => {
                   d.yValue = this.hasActual ? d[this.actualIndex] : 0;
                   d.xValue = this.hasPeriod ? d[this.periodIndex] : "";
               });
               
               var VP = 0;

               if (this.hasActual && this.hasTarget) {
                   var current = d.values[d.values.length - 1][this.actualIndex];
                   var target = d.values[d.values.length - 1][this.targetIndex];
                   VP = ((current - target) / Math.abs(target)) * 100;
               }
               var percentage, last, secondlast, retVal;
               if (d.values.length > 1) {
                   var last = d.values[d.values.length - 1][this.actualIndex];
                   var secondlast = d.values[d.values.length - 2][this.targetIndex];
                  
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
                   .attr("style","")
                   .html("Actual is required to draw the visual");

               return;
           }

            var thead = table.append("thead").attr("style", 'color:rgb(102, 102, 102);font-family: "Segoe UI Semibold", wf_segoe-ui_semibold, helvetica, arial, sans-serif;');
            var tbody = table.append("tbody");

           var rows = tbody.selectAll(".rows")
                           .data(data)
                           .enter()
                           .append("tr")
                           .style("background", function (d, i) { return i % 2 === 0 ? "#fff" : "#ececec" });

           rows.on("click", (d, i) => {
               d.isFiltered = !d.isFiltered;
             
               d.values.forEach(d => {

                   const categoryColumn: DataViewCategoryColumn = {
                       source: options.dataViews[0].table.columns[this.groupIndex],
                       values: null,
                       identity: [d.identity]
                   };

                   var id = this.host.createSelectionIdBuilder()
                       .withCategory(categoryColumn, 0)
                       .createSelectionId();

                   this.selectionManager.select(id, true);
                   
               });

               


               this.setFilterOpacity(rows);
           })

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
           this.setFontSize(table);

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
                .html("Metric");

            rows
                .append("td")
                .append("html")
                .text((d) => {  return d.key });
        }

        public drawCurrent(rows: any, thead: any) {

            thead.append("th")
                .append("span")
                .html("Current");

            var current = rows
                            .append("td")
                            .attr("class", "currentText")
                            .append("html");

            current.text((d) => this.iValueFormatter.format(d.values[d.values.length - 1].yValue));

            this.tooltipServiceWrapper.addTooltip(current,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data,'Current'),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        public drawPrior(rows: any, thead: any) {

            thead.append("th")
                .append("span")
                .html("Prior");

            var prior = rows
                .append("td")
                .append("html")
                .text((d) => this.iValueFormatter.format(d.values[d.values.length - 2].yValue));

            this.tooltipServiceWrapper.addTooltip(prior,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Prior'),
                (tooltipEvent: TooltipEventArgs<any>) => null
                );
        }

        public drawSparkline(data: any, rows: any, thead: any) {
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

        public drawActual(rows: any, thead: any) {

            if (this.showActual && this.showTarget) {
                thead.append("th")
                    .append("span")
                    .html(this.actualHeader);

               var actual =  rows
                    .append("td")
                    .append("html")
                    .text((d) => this.iValueFormatter.format(d.actual));


               this.tooltipServiceWrapper.addTooltip(actual,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Actual'),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                    );
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
                    .text((d) => d.change);

                change.text((d) => this.iValueFormatter.format(d.change));

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
                    .text((d) => d.perChange.toFixed(2) + "%");
               
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
                        return "translate(10,12), rotate(" + d.trend + ")";
                    })
                    .style("fill", d => d.trend === 0 ? color[0] : color[1]);

            }
            
       }

        public showIntensityCircle(rows: any, thead: any) {
        
            if(this.intensity === true) {
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
                   .html("Bullet");

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

                var bulletRect = bullet.append("rect")
                    .attr("width", (d) => barScale(d.actual))
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

                var thresholdData = this.columns.filter((d, i) => {
                    d.Index = i;
                    return d.roles["threshold"] == true
                });

                if (thresholdData.length > 0) {
                    bulletRect
                        .style("fill", d => {
                            let item = d.values[d.values.length - 1];
                            var fill = "#fff";
                            thresholdData.forEach((t, i) => {
                                if (d.target >= item[t.Index]) fill = this.aboveThresholdColor.solid.color;
                                else {
                                    let y = 'belowThreshold' + (i+1) + 'Color';
                                    if (d.target < item[t.Index]) fill = this[y].solid.color;
                                }
                            })

                            return fill;

                        });
                }

               bullet.append("rect")
                   .attr("width", 2)
                   .attr("x",(d) => barScale(d.target))
                   .attr("height", 20)
                    .attr("style", "fill:#000;");

           }

        }

        public drawTarget(rows: any, thead: any) {
          
            if (this.showTarget && this.hasTarget) {
                thead.append("th")
                    .append("span")
                    .html(this.targetHeader);

               var target =  rows
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

               var variance =  rows
                    .append("td")
                    .append("html")
                    .text((d) => this.iValueFormatter.format(d.variance));

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

                this.tooltipServiceWrapper.addTooltip(variancePer,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'VariancePer'),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                    );
            }
        }

        public drawAdditionalFields(rows: any, thead: any) {
           
            var additional = this.columns.filter((d,i) => {
                d.Index = i;
                return d.roles["additional"] == true
            });
           
            additional.map((d) => {
                var format = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.format });

                thead.append("th")
                        .append("span")
                        .html(d.displayName);

                rows
                    .append("td")
                    .append("html")
                    .text((e) => format.format(e.values[e.values.length - 1][d.Index]));
            });
           
       }

        private setFontSize(chartSvg) {
            chartSvg.style("font-size", this.fontSize + "px").style("color", "rgb(119, 119, 119)");
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

       public mouseMove(d: any, el:any) {

            var selected = d;

            this.sparklineMarker.attr("style", function (d:any) {
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

       public updateRowStyle(tbody: any, thead: any) {

            thead.selectAll("th").attr("style", "padding:5px;border-bottom: 1px solid #ee9207;");
            tbody.selectAll("td").attr("style", "padding:5px;");
        }

       private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

       private getTooltipData(data: any, vtype:any): VisualTooltipDataItem[] {
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

       public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
          
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
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    break;

                case 'Target':
                    objectEnumeration.push({ objectName: objectName, properties: { showTarget: this.showTarget},selector: null});
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
                    if (this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColor: this.conditionalBulletColor }, selector: null });
                    if (this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColorScale: this.conditionalBulletColorScale }, selector: null });
                    if (!this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { singleBulletColor: this.singleBulletColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { bulletScaleMinZero: this.bulletScaleMinZero }, selector: null });

                    
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

                     
            };
           

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}