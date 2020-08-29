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


module powerbi.extensibility.visual.ganttChartCCFC224D9885417F9AAF5BB8D45B007E  {
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
        private dateFormat: any;

        private activityIndex: any = 0;
        private groupIndex: any = 0;
        private timeFromIndex: any = 0;
        private timeToIndex: any = 0;

        private color =["#8950FC","#3699FF","#019C8C","#7A084B","#0BB7AF","#F65163"];

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            this.selectionManager.registerOnSelectCallback(() => {
               
            });
            this.dateFormat = this.getDateFormat("DD/MM/YYYY");
           this.element.select('.ganttChart').remove();
         
            this.columns.map((d, i) => {
                if (d.roles["activity"]) {
                    this.activity = true;
                    this.activityIndex=i;
                }
                if (d.roles["group"]) {
                    this.group = true;
                    this.groupIndex=i;
                }
                if (d.roles["timeFrom"]) {
                    this.timeFrom = true;
                    this.timeFromIndex=i;
                }
                if (d.roles["timeTo"]) {
                    this.timeTo = true;
                    this.timeToIndex=i;
                }
                return d;
            });

            this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value: 1001 });

            var data = [];
            options.dataViews[0].table.rows.map((d: any, i) => {
                data.push({
                    timeFrom:(d[this.timeFromIndex]),
                    timeTo:(d[this.timeToIndex]),
                    group:d[this.groupIndex],
                    activity:d[this.activityIndex]
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

        var chartSvg = chart.append("g")

        chartSvg.attr("transform", "translate(0," + 5 + ")");
            
        this.drawXScale(xScale, chartSvg, dimension);
        this.drawYScale(yScale, chartSvg, dimension, data);
       
        var ganttRect  = this.drawActivityRect(xScale,yScale, chartSvg,data,dimension);

        this.drawXBrush(xScale,yScale,chartSvg,dimension,ganttRect)
        }

        private getDimensions(vp, data) {

           var max = d3.max(data.map(d=>d.activity.length*(this.fontSize/2)));

            let xOffset, yOffset, chartWidth, chartHeight;
            let xbrushOffset = 30;
            xOffset = xbrushOffset + 40;
           
            yOffset = max;
            chartWidth = vp.width - yOffset ;
            chartHeight = vp.height - xOffset;
           
            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                xbrushOffset:xbrushOffset,
                chartWidth: chartWidth,
                chartHeight: chartHeight
            }
        }

        private setXScale(data, dimension) {
           
            var xdomain = [];
            data.map((d:any)=>{
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
                            .domain(data.map(d=>d.activity));

            return scale;
        }
      
        private setXAxisStyle(chartSvg){
           
            chartSvg.select("g.xaxis").selectAll("text")
                .attr("fill", "rgb(119, 119, 119)")
                .style("text-anchor", "end")
                .attr("font-size",this.fontSize + "px")
                  .attr("dx", 6)
                  .attr("dy", -1)
                  .attr("transform", function (d) {
                      return "rotate(-50)"
                  });
        }

        private drawXScale(xScale, chartSvg, dimension) {

            var xaxis = d3.svg.axis()
                .scale(xScale)
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
                .attr("transform", "translate(" + (dimension.yOffset) + "," + (0) + ")")
                .attr("class", "axis")
                .call(yaxis);

            yAxisG.selectAll("text")
            .attr("font-size",this.fontSize + "px")
            .attr("fill", "rgb(119, 119, 119)");

            yAxisG.selectAll("line")
            .attr("transform", "translate("+ (-dimension.yOffset) +"," + (-yScale.rangeBand()/2 -yScale.rangeBand()*.1 ) + ")")
        }

        private setRectPosition(rectG,xScale,yScale,dimension){
            rectG.attr("transform", function (d) {
                var xVal, yVal;

                xVal = xScale(d.timeFrom);
                yVal = yScale(d.activity);

                if (yVal === undefined) yVal = -1000;
                if (xVal < 0 || isNaN(xVal) || xVal === undefined) xVal = -10000;

                return "translate(" + (xVal + dimension.yOffset) + "," + yVal + ")";
            });
        }
        
        public drawActivityRect(xScale, yScale, chartSvg,data,dimension){
        
            var colorScale = d3.scale.ordinal()
            .range(this.color);

            var rectG = chartSvg
                    .selectAll(".ganttrect")
                    .data(data)
                .enter()
                    .append("g");

            
            this.setRectPosition(rectG,xScale,yScale,dimension);

           var rect = rectG.append("rect")
            .attr("fill",function(d){ return colorScale(d.activity)})
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

            this.tooltipServiceWrapper.addTooltip(rect,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        return rectG;
        }
        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];
        
            retData.push({
                displayName: data.activity,
                value: data.group
            });

            retData.push({
                displayName: 'Start date',
                value: data.timeFrom.toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
            });

            retData.push({
                displayName: 'End date',
                value: data.timeTo.toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
            });

            return retData;
        }

        public drawXBrush(xScale,yScale,chartSvg,dimension,rectG){
            var xaxis;
            var brush = d3.svg.brush()
                            .x(xScale.copy())
                            .on("brush", ()=>{
                                
                                xScale.domain(brush.empty() ? xScale.domain() : brush.extent());

                                xaxis = d3.svg.axis()
                                .scale(xScale)
                                .tickSize(-dimension.chartHeight, 0)
                                .orient("bottom");

                                chartSvg.select("g.xaxis").call(xaxis);
                                this.setXAxisStyle(chartSvg); 
                                this.setRectPosition(rectG,xScale,yScale,dimension);
                            });

             var xBrush = chartSvg
                            .append("g")
                            .attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.height - dimension.xbrushOffset) + ")")
                            .call(brush);  
                            
                            xBrush.selectAll("rect")
                                   .attr("fill","#f6f6f6")
                                   .attr("height", 20);
        }

        public getDateFormat(format) {
                var dataFormat :any;
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
                case 'Actual':
                    objectEnumeration.push({ objectName: objectName, properties: { currentHeader: this.currentHeader},selector: null});
                 break;
                    
             

            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}