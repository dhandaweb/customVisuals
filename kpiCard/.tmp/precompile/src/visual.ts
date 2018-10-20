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


module powerbi.extensibility.visual.kpiCardCCFC224D9885417F9AAF5BB8D45B007E  {
    "use strict";
   
    export class Visual implements IVisual {
       
        private host: IVisualHost;
      //  private tooltipServiceWrapper: ITooltipServiceWrapper;

        private selectionManager: ISelectionManager;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;

        private columns: any;

        private selectedTemplate: any = "linear";
        private showActual: any = false;
        private actualHeader: any = "";
      

        private showTarget: any = true;
        private targetHeader: any = "";
      
        private bulletScaleMinZero: any = true;

        private trendIndicator: any = true;
        private flipTrendDirection: any = false;
        private trendColor: any = "RedGreen";
        private trendColorOptions: any = {
            "RedGreen": ["#ff4701", "#00ad00"],
            "GreenRed": ["#00ad00", "#ff4701"]
        };
        private showTargetLine: any = false;
        private lineStroke: any= 20;
        private intensity: any = true;
        private intensityScale: any = "10,40 60,80";
        private intensityColor: any = { solid: { color: "#4682b4" } };
        private targetLineColor: any = { solid: { color: "#ff4701" } };
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
        private dateFormat: any;

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
               if (options.dataViews[0].metadata.objects["displayTemplate"]) {
                   var displayTemplateObj = options.dataViews[0].metadata.objects["displayTemplate"];
                   if (displayTemplateObj["actualHeader"] !== undefined) this.actualHeader = displayTemplateObj["actualHeader"];
                   if (displayTemplateObj["targetHeader"] !== undefined) this.targetHeader = displayTemplateObj["targetHeader"];
                   if (displayTemplateObj["selectedTemplate"] !== undefined) this.selectedTemplate = displayTemplateObj["selectedTemplate"];
                   
               }
              
               if (options.dataViews[0].metadata.objects["Sparkline"]) {
                   var sparkObj = options.dataViews[0].metadata.objects["Sparkline"];
                   if (sparkObj["transparency"] !== undefined) this.lineStroke = sparkObj["transparency"];
                   if (sparkObj["showTargetLine"] !== undefined) this.showTargetLine = sparkObj["showTargetLine"];
                   if (sparkObj["targetLineColor"] !== undefined) this.targetLineColor = sparkObj["targetLineColor"];
                   
                   
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
                  
                   this.dateFormat = d.format;
                   
               }
           });


            this.element.style("overflow", "auto");
            this.element.select('.kpiCard').remove();

            var container = this.element
                .append("div")
                .attr("class", "kpiCard")
                .attr("style", "width:100%;text-align:left;border-spacing:0")
                .attr("style",'color:rgb(102, 102, 102);font-family: "Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif');

            if (this.hasActual === false || this.hasTarget === false || this.hasPeriod === false) {
                container
                    .append("html")
                    .attr("style", "")
                    .html("Data is missing to draw the visual");
                return;
            }


           this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value:1001 });
        
           if (this.hasActual) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.actualIndex].format });
           else if (this.hasTarget) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.targetIndex].format });
          
            var data = [];
            let dateformat;

            if (this.dateFormat !== undefined )dateformat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.dateFormat });

            options.dataViews[0].table.rows.forEach((d: any,i) => {
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
            var targetHeader = this.targetHeader.length === 0 ? this.columns[this.targetIndex].displayName : this.targetHeader;

            var act = data[data.length - 1].actual;
            var prior = data[data.length - 2].actual;
            var target = data[data.length - 1].target;
            var actSecondLast = data[data.length - 2].actual;

            this.chartData = {
                actual: { display: actHeader, value: act },
                prior: { display: "Prior", value: prior },
                target: { display: targetHeader, value: target },
                growth: { display: "Growth", value: act - actSecondLast/act },
                needed: { display: "Needed", value: target - act },
                trend:  { display: "", value: trend }
            };

         

            var tbody = container
                .append("table")
                .attr("style", "width:100%;table-layout: fixed;")
                .append("tbody");

            if (this.selectedTemplate === "linear") {
                var topRow = tbody.append("tr");

                var titleContainer = topRow.append("td").attr("colspan", "2");
                var bulletContainer = topRow.append("td").attr("colspan", "3");

                var secondRow = tbody.append("tr");

                secondRow.append("td").html("Actual").attr("class", "kpiTitle");
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
                this.drawBullet(data, bulletContainer, options.viewport.width/2);

                this.drawActual(actualContainer);
                this.drawSparkline(data, sparklineContainer, options.viewport.width / 5,30);
                this.drawBisectorToolTip(data, options.viewport.width / 5,30);
                this.drawTarget(targetContainer);
                this.drawGrowth(growthContainer);
                this.drawNeeded(neededContainer);

                this.showTrendIndicator(titleContainer);

            }
            else {
                var titleRow = tbody.append("tr");
                var titleContainer = titleRow.append("td").attr("colspan", "3");
                var titleVal = titleRow.append("td").attr("colspan", "3");
                var bulletContainer = tbody.append("tr").append("td").attr("colspan", "6");

                var thirdRow = tbody.append("tr");
                var priorContainer = tbody.append("td").attr("colspan", "3");
                var growthContainer = tbody.append("td").attr("colspan", "3");

                var sparklineContainer = tbody.append("tr").append("td");

                this.drawTitle(titleContainer);
                this.drawGroupActual(titleVal);
                this.drawBullet(data, bulletContainer, options.viewport.width);

                var height = options.viewport.height - 140;
                if (height < 70) height = 70;
                this.drawSparkline(data, sparklineContainer, options.viewport.width - 10, height);
                this.drawBisectorToolTip(data, options.viewport.width - 10, height);
                this.drawPrior(priorContainer);
                this.drawGrowth(growthContainer);
             
                this.showTrendIndicator(titleContainer);

            }
        }

        public drawGroupActual(container: any) {

            var actual = container
                .append("span")
                .attr("style", "display:block;font-size:18px;text-align:right")
                .style("margin-right" , this.trendIndicator === true ? "15px" : "0px")
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
            var val = container.append("span").text(this.chartData.actual.display).attr("style","font-size:18px;");
            if (this.selectedTemplate === "group") {
                val.style("display","block");
                container.append("span").text("vs " + this.chartData.target.display).style("font-size", "14px");
            }
        }

        public drawBullet(data: any, container: any, bulletwidth: any) {
            if (this.hasTarget) {

                var targetMax = d3.max(data.map((d) => d.target));
                var actualMax = d3.max(data.map((d) => d.actual));

                var backgroundBarLen = d3.max([targetMax, actualMax]) * 1.15;

                var width = bulletwidth-5;

                var min = 0;
                if (this.bulletScaleMinZero === false) min = d3.min(data.map((d) => d.actual));

                var barScale = d3.scale.linear().range([0, width]).domain([min, backgroundBarLen]);

                var bulletG = container
                    .append("svg")
                    .attr("width", width)
                    .attr("height", 24);

                var bullet = bulletG.append("g").attr("transform","translate(0,2)")
                    .attr("class", "bullet");

                bullet.append("rect")
                    .attr("width", width)
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

        public drawSparkline(data: any, sparklineContainer, width:any, height:any) {
           
           if (this.hasActual) {

               var xDomain = [];
               var yDomain = [];

               data.map(function (d) {
                   xDomain.push(d.period);
                   yDomain.push(d.actual);
               });
               var xScale = d3.scale.ordinal().rangePoints([0, width]).domain(xDomain);
               var yScale = d3.scale.linear().range([height, 0]).domain([d3.min(yDomain), d3.max(yDomain)]);

               this.sparklineSelection = sparklineContainer
                   .append("svg")
                   .attr("width", width)
                   .attr("height", height);

              var sparklineSelectionG = this.sparklineSelection.append("g");

               if (this.selectedTemplate === "group") {

                   xScale.rangePoints([0, width-55]);
                   yScale.range([height-30, 0])

                   sparklineSelectionG.attr("transform", "translate(50,10)");
                 
                   var yaxis = d3.svg.axis().scale(yScale).orient("left").ticks(3).tickFormat(this.iValueFormatter.format);
                   var xaxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(3);

                   sparklineSelectionG
                       .append("g")
                       .attr("transform", "translate(0,0)")
                       .attr("class", "kpiAxis")
                       .call(yaxis)
                  

                   sparklineSelectionG
                       .append("g")
                       .attr("transform", "translate(" + 0 + "," + (height-30) + ")")
                       .attr("class", "kpiAxis")
                       .call(xaxis)
                       .selectAll("text").each(function (d, i) {
                           if (i === 0 || i === xScale.domain().length - 1) {
                               d3.select(this).style("text-anchor", i === 0 ? "start" : "end")
                           }
                           else {
                               d3.select(this).text("");
                           }
                       });
                   sparklineSelectionG.selectAll("text").attr("fill", "rgb(119, 119, 119)").attr("font-size", "12px");
               }

               sparklineSelectionG.append("path")
                   .attr("class", "line")
                   .attr("style", "stroke: steelblue; fill: none;")
                   .style("stroke-width", this.lineStroke/10)
                   .attr("d", function (d: any) {
                       return "M" + data.map((d) => {
                           return xScale(d.period) + ',' + yScale(d.actual);
                       }).join('L');
                   });

               if (this.showTargetLine === true) {
                   sparklineSelectionG.append("path")
                       .attr("class", "line")
                       .attr("style", "stroke: red; fill: none;stroke-dasharray: 3")
                       .style("stroke-width", this.lineStroke / 10)
                       .style("stroke",this.targetLineColor.solid.color)
                       .attr("d", function (d: any) {
                           return "M" + data.map((d) => {
                               return xScale(d.period) + ',' + yScale(d.target);
                           }).join('L');
                       });
               }

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
        
        public drawPrior(container: any) {

            container
                .append("span")
                .attr("style","display:block;font-size:14px")
                .text(this.iValueFormatter.format(this.chartData.prior.value));

            container
                .append("span")
                .style("font-size", "16px")
                .text("Prior");

        }

        public drawGrowth(container: any) {

           var val = container
                .append("span")
                .text(this.chartData.growth.value.toFixed(2));

            if (this.selectedTemplate === "group") {
                val.attr("style", "display:block;font-size:14px");
                container.style("text-align","right")
                    .append("span")
                    .style("font-size", "16px")
                    .text("Growth");
            }
           
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

                if (this.selectedTemplate === "group")trendIndicator.attr("style","position: absolute;top: 3;right: 0;")  

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
        public drawBisectorToolTip(data, width, height) {

          var self = this;
            var ht = this.selectedTemplate === "group" ? height - 30 : height
            var ss = this.sparklineSelection
                .append("rect")
                .style("fill","transparent")
                  .on("mouseover", d => {
                        this.sparklineMarker.style("display", null);
                    })
                    .on("mouseout", d => {
                        this.sparklineMarker.style("display", "none");
                    })
                  .on("mousemove", function (d) {
                      self.mouseMove(data, this, width);
                  });

            if (this.selectedTemplate === "group") {
                ss.attr("width", width - 35)
                    .attr("height", ht)
                    .attr("transform", "translate(30,10)");
            }
            else {
                ss.attr("width", width)
                    .attr("height", ht);
            }

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

        public mouseMove(data: any, el: any, width:any) {

            var catScale = d3.scale.ordinal()
                .rangePoints([0, width])
                .domain(data.map(function (d) { return d.period; }));


            this.sparklineMarker.attr("style", "display:inherit");
            var padding = (catScale(catScale.domain()[1]) - catScale(catScale.domain()[0]))/2;
            var xPos = this.selectedTemplate === "group" ? (d3.mouse(el)[0] + 30) : d3.mouse(el)[0] ;

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

           return retData;
        }

       public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
          
            switch (objectName) {
                case 'displayTemplate':
                    objectEnumeration.push({ objectName: objectName, properties: { selectedTemplate: this.selectedTemplate }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualHeader: this.actualHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { targetHeader: this.targetHeader }, selector: null });
                    break;

                case 'Sparkline':
                    objectEnumeration.push({ objectName: objectName, properties: { transparency: this.lineStroke }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showTargetLine: this.showTargetLine }, selector: null });
                    if (this.showTargetLine)objectEnumeration.push({ objectName: objectName, properties: { targetLineColor: this.targetLineColor }, selector: null });
                    
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