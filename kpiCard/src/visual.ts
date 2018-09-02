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
        private showActual: any = false;
        private actualHeader: any = "";
      

        private showTarget: any = true;
        private targetHeader: any = "Target";
      
        private bulletScaleMinZero: any = true;

        private trendIndicator: any = true;
        private flipTrendDirection: any = false;
        private trendColor: any = "RedGreen";
        private trendColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00", "#ff4701"]
        };

        private intensity: any = true;
        private intensityScale: any = "10,40 60,80";
        private intensityColor: any = { solid: { color: "#4682b4" } };

        private conditionalBullet: any = true;
        private conditionalBulletColorScale: any = "5,10,100";
        
        private conditionalBulletColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00","#ff4701"]
        };

        private conditionalBulletColor: any = "GreenRed";
        private singleBulletColor: any = { solid: { color: "#4682b4" } };

        private actualIndex: number;
        private hasActual: any;
        private targetIndex: number;
        private hasTarget: any;
      
        private hasPeriod: any;
        private periodIndex: number;
       
        private iValueFormatter:any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private sparklineSelection: d3.Selection<SVGElement>;
        private sparklineMarker: d3.Selection<SVGElement>;
        private sparklineMarkerLine: d3.Selection<SVGElement>;
        private sparklineCaptionName: d3.Selection<SVGElement>;
        private sparklineCaptionValue: d3.Selection<SVGElement>;

        private chartData: any;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public  TooltipEnabledDataPoint: any;

      
   
       

       constructor(options: VisualConstructorOptions) {
           
           this.element = d3.select(options.element);
           this.host = options.host;
           this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
           this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
           this.columns = options.dataViews[0].metadata.columns;

           if (options.dataViews[0].metadata.objects) {
               if (options.dataViews[0].metadata.objects["Actual"]) {
                   var actObj = options.dataViews[0].metadata.objects["Actual"];
                   if (actObj["actualHeader"] !== undefined) this.actualHeader = actObj["actualHeader"];
               }
               if (options.dataViews[0].metadata.objects["Target"]) {
                   var targetObj = options.dataViews[0].metadata.objects["Target"];
                   if (targetObj["targetHeader"] !== undefined) this.targetHeader = targetObj["targetHeader"];
                   
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
             
            }

           this.hasTarget = false;
           this.hasActual = false;
           this.hasPeriod = false;
          
           this.columns.forEach((d,i) => {
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
               }
           });
        
           this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value:1001 });
        
           if (this.hasActual) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.actualIndex].format });
           else if (this.hasTarget) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.targetIndex].format });
           
            var data = [];
            options.dataViews[0].table.rows.forEach((d: any,i) => {
                       d.identity = options.dataViews[0].table.identity[i];
                       d.actual = d[this.actualIndex];
                       d.target = d[this.targetIndex];
                       d.period = d[this.periodIndex];
                data.push(d);
            });
          
            var trend = data[data.length - 1].actual > data[data.length - 2].actual ? 180 : 0;

            var actHeader = this.actualHeader.length === 0 ? this.columns[this.actualIndex].displayName : this.actualHeader;
            var targetHeader = this.targetHeader.length === 0 ? this.columns[this.targetIndex].displayName : this.targetHeader;

            var act = data[data.length - 1].actual;
            var target = data[data.length - 1].target;
            var actSecondLast = data[data.length - 2].actual;
            this.chartData = {
                actual: { display: actHeader, value: act },
                target: { display: targetHeader, value: target },
                growth: { display: "Growth", value: act - actSecondLast/act },
                needed: { display: "Needed", value: target - act },
                trend:  { display: "", value: trend }
            };

           //nestedData.map((d,i)=> {
           //    var actual = this.hasActual ? d.values[d.values.length - 1][this.actualIndex] : 0;
              
           //    var secondLastActual = this.hasActual ? d.values[d.values.length - 2][this.actualIndex] : 0;
           //    var firstActual = this.hasActual ? d.values[0][this.actualIndex] : 0;
           //    var target = this.hasTarget ? d.values[d.values.length - 1][this.targetIndex] : 0;

           //    d.values.map((d) => {
           //        d.yValue = this.hasActual ? d[this.actualIndex] : 0;
           //        d.xValue = this.hasPeriod ? d[this.periodIndex] : "";
           //    });
               
           //    var VP = 0;

           //    if (this.hasActual && this.hasTarget) {
           //        var current = d.values[d.values.length - 1][this.actualIndex];
           //        var target = d.values[d.values.length - 1][this.targetIndex];
           //        VP = ((current - target) / Math.abs(target)) * 100;
           //    }
           //    var percentage, last, secondlast, retVal;
           //    if (d.values.length > 1) {
           //        var last = d.values[d.values.length - 1][this.actualIndex];
           //        var secondlast = d.values[d.values.length - 2][this.targetIndex];
                  
           //        percentage = ((last - secondlast) / Math.abs(secondlast)) * 100;

           //        if (last === null || secondlast === null) percentage = 0;

           //    }
           //    else percentage = 0;

           //    data.push({
           //        key: d.key,
           //        actual: actual,
           //        secondLastActual: secondLastActual,
           //        change: actual - secondLastActual,
           //        perChange: ((actual - secondLastActual) / Math.abs(secondLastActual)) * 100,
           //        totalChange: ((actual - firstActual) / Math.abs(firstActual)) * 100,
           //        trend: actual > secondLastActual ? 180 : 0,
           //        target: target,
           //        variance: actual - target,
           //        variancePer: (VP).toFixed(2),
           //        values: d.values,
           //        percentage: percentage,
           //        identity: d.values[0].identity
           //    });
              
           //});

           this.element.style("overflow", "auto");
           this.element.select('.kpiCard').remove();

           var container = this.element
                           .append("div")
                           .attr("class", "kpiCard")
                           .attr("style", "width:100%;text-align:left;border-spacing:0");
           
           if (this.hasActual === false) {
               container
                   .append("html")
                   .attr("style","")
                   .html("Actual is required to draw the visual");
               return;
           }

            var tbody = container
                .append("table")
                .attr("style", "width:100%;table-layout: fixed;")
                .append("tbody");

            var topRow = tbody.append("tr");

            var titleContainer = topRow.append("td").attr("colspan", "2").style("font-size","18px");
            var bulletContainer = topRow.append("td").attr("colspan", "3");

            var secondRow = tbody.append("tr");
            
            secondRow.append("td").html("Actual").attr("class","kpiTitle");
            secondRow.append("td").html("Trend").attr("class", "kpiTitle");
            secondRow.append("td").html("Target").attr("class", "kpiTitle kpiCenter");
            secondRow.append("td").html("Growth").attr("class", "kpiTitle kpiCenter");
            secondRow.append("td").html("Needed").attr("class", "kpiTitle kpiCenter");
            var thirdRow = tbody.append("tr");

            var actualContainer = thirdRow.append("td");
            var sparklineContainer = thirdRow.append("td");
            var targetContainer = thirdRow.append("td").style("text-align", "center");
            var growthContainer = thirdRow.append("td").style("text-align", "center");
            var neededContainer = thirdRow.append("td").style("text-align", "center");

            this.drawTitle(titleContainer);
            this.drawBullet(data, bulletContainer);

            this.drawActual(actualContainer);
            this.drawSparkline(data, sparklineContainer);
            this.drawBisectorToolTip(data);
            this.drawTarget(targetContainer);
            this.drawGrowth(growthContainer);
            this.drawNeeded(neededContainer);

            this.showTrendIndicator(titleContainer);
           

        }
        public drawTitle(container) {
            container.append("span").text(this.chartData.actual.display);
        }

        public drawBullet(data: any, container: any) {
            if (this.hasTarget) {

                var targetMax = d3.max(data.map((d) => d.target));
                var actualMax = d3.max(data.map((d) => d.actual));

                var backgroundBarLen = d3.max([targetMax, actualMax]) * 1.15;
                var min = 0;
                if (this.bulletScaleMinZero === false) min = d3.min(data.map((d) => d.actual));

                var barScale = d3.scale.linear().range([0, 220]).domain([min, backgroundBarLen]);

                var bulletG = container
                    .append("svg")
                    .attr("width", 220)
                    .attr("height", 24);

                var bullet = bulletG.append("g").attr("transform","translate(0,2)")
                    .attr("class", "bullet");

                bullet.append("rect")
                    .attr("width", 220)
                    .attr("height", 20)
                    .attr("style", "fill:#d0cece;")

                if (this.conditionalBullet === false) {
                    bullet.append("rect")
                        .attr("width", (d) => barScale(this.chartData.actual.value))
                        .attr("height", 20)
                        .style("fill", this.singleBulletColor.solid.color);
                }
                else {
                    bullet.append("rect")
                        .attr("width", (d) => barScale(this.chartData.actual.value))
                        .attr("height", 20)
                        .style("fill", d => {

                            if ((this.chartData.actual.value - this.chartData.target.value) > 0) return this.conditionalBulletColorOptions[this.conditionalBulletColor][0];
                            else return this.conditionalBulletColorOptions[this.conditionalBulletColor][1];

                        });
                }

                bulletG.append("rect")
                    .attr("width", 1)
                    .attr("x", (d) => barScale(this.chartData.target.value))
                    .attr("height", 24)
                    .attr("style", "fill:#000;");
            }

        }

        public drawSparkline(data: any, sparklineContainer) {
           
           if (this.hasActual) {

               this.sparklineSelection = sparklineContainer
                                               .append("svg")
                                               .attr("width", 120)
                                               .attr("height", 30);

               this.sparklineSelection.append("path")
                   .attr("class", "line")
                   .attr("style", "stroke: steelblue; stroke-width:2; fill: none;")
                   .attr("d", function (d: any) {

                       var xDomain = [];
                       var yDomain = [];
                       
                       data.map(function (d) {
                           xDomain.push(d.period);
                           yDomain.push(d.actual);
                       });
                     
                       var xScale = d3.scale.ordinal().rangeRoundBands([0, 120]).domain(xDomain);
                       var yScale = d3.scale.linear().range([25, 0]).domain([d3.min(yDomain), d3.max(yDomain)]);

                       return "M" + data.map((d) => {
                           return xScale(d.period) + ',' + yScale(d.actual);
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

        public drawGrowth(container: any) {

           container
                .append("span")
               .text(this.chartData.growth.value.toFixed(2));
           
        }

        public drawNeeded(container: any) {

            var needed = container
                .append("span")
                .text((d) => this.iValueFormatter.format(this.chartData.needed.value));


            this.tooltipServiceWrapper.addTooltip(needed,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data, 'Needed'),
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

                var triangleDirection = this.flipTrendDirection == false ? 'triangle-down' : 'triangle-up';
                var triangle = d3.svg.symbol().type(triangleDirection).size(50);

                trendIndicator
                    .append("path")
                    .attr('d', triangle)
                    .attr('transform', d => {
                        return "translate(10,12), rotate(" + this.chartData.trend.value + ")";
                    })
                    .style("fill", d => this.chartData.trend === 0 ? color[0] : color[1]);

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
        public drawBisectorToolTip(data) {

          var self = this;

          this.sparklineSelection
              .on("mouseover", d => {
                    this.sparklineMarker.style("display", null);
                })
                .on("mouseout", d => {
                    this.sparklineMarker.style("display", "none");
                })
              .on("mousemove", function (d) {
                  self.mouseMove(data, this);
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
            
        }

        public mouseMove(data: any, el:any) {


            this.sparklineMarker.attr("style", "display:inherit");

            var xPos = d3.mouse(el)[0];

            this.sparklineMarker.attr("transform", function () {
                return "translate(" + (xPos) + ",0)";
            });

            var catScale = d3.scale.ordinal()
                                 .rangeRoundBands([0, 120])
                                 .domain(data.map(function (d) { return d.period; }));
            

            var leftEdges = catScale.domain().map(function (d, i) { return catScale.rangeBand() * i });

            var j;
            for (j = 0; xPos > leftEdges[j] + (catScale.rangeBand() / 2); j++) { }

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

       private getTooltipData(data: any, vtype:any): VisualTooltipDataItem[] {
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
           
            return vtype;
        }

       public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
          
            switch (objectName) {
                case 'Actual':
                   objectEnumeration.push({ objectName: objectName, properties: { actualHeader: this.actualHeader},selector: null});
                    break;

                case 'Target':
                    objectEnumeration.push({ objectName: objectName, properties: { targetHeader: this.targetHeader }, selector: null });
                    break;
 
                case 'Trend':
                    objectEnumeration.push({ objectName: objectName, properties: { show: this.trendIndicator }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { flipTrendDirection: this.flipTrendDirection }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { trendColor: this.trendColor }, selector: null });
                    break;

                case 'Bullet':
                    objectEnumeration.push({ objectName: objectName, properties: { conditionalBullet: this.conditionalBullet }, selector: null });
                    if (this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColor: this.conditionalBulletColor }, selector: null });
                   // if (this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { conditionalBulletColorScale: this.conditionalBulletColorScale }, selector: null });
                    if (!this.conditionalBullet) objectEnumeration.push({ objectName: objectName, properties: { singleBulletColor: this.singleBulletColor }, selector: null });
                   // objectEnumeration.push({ objectName: objectName, properties: { bulletScaleMinZero: this.bulletScaleMinZero }, selector: null });

                    break;
                    
            };
           

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}