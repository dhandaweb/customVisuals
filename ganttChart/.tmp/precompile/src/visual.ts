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

       
        private hasHeat: any = false;
        private timeFrom: any = false;
        private timeTo: any = false;
        private activity: any = false;
        private group: any = false;


        private activityIndex: any = 0;
        private groupIndex: any = 0;
        private timeFromIndex: any = 0;
        private timeToIndex: any = 0;

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

           this.element.select('.ganttChart').remove();
         
           console.log(options.dataViews[0].metadata.columns);
          
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

            console.log(options.dataViews[0]);

            var data = [];
            options.dataViews[0].table.rows.map((d: any, i) => {
                data.push({timeFrom:d[this.timeFromIndex],timeTo:d[this.timeToIndex],group:d[this.groupIndex], activity:d[this.activityIndex]});
            });
            console.log(data);
            var dimension = this.getDimensions(options.viewport, data);
            var dataFormat = this.getDateFormat("YYYY-DD-MM");
            var xScale = this.setXScale(data, dimension,dataFormat);
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
       
        this.drawActivityRect(xScale,yScale, chartSvg,data,dimension);

        }

        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;
            let yRightOff = 0;

            let xdata = data.xAxis;

            let yOff = 100;
            let xOffset, yOffset, chartWidth, chartHeight;

            xOffset = 50;
            if (xOffset > vp.height / 4) xOffset = vp.height / 4 > 100 ? 100 : vp.height / 4;
            yOffset = yOff;
            chartWidth = vp.width - yOffset - ylegendOffset - yRightOff;
            chartHeight = vp.height - xOffset - xlegendOffset;
           
            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                yRightOff: yRightOff,
                chartWidth: chartWidth,
                chartHeight: chartHeight
            }
        }

        private setXScale(data, dimension,dataFormat) {
           
            var xdomain = [];
            data.map((d:any)=>{
                xdomain.push((d.timeFrom));
                xdomain.push((d.timeTo))
            });

            let scale = d3.time.scale()
                            .domain(d3.extent(xdomain))
                            .range([0, dimension.chartWidth-dimension.yOffset]);


            return scale;
        }

        private setYScale(data, dimension) {

            var scale = d3.scale.ordinal()
                            .rangeBands([0, dimension.chartHeight], .05)
                            .domain(data.map(d=>d.activity));

            return scale;
        }
      
        private drawXScale(xScale, chartSvg, dimension) {

            var xaxis = d3.svg.axis()
                .scale(xScale)
               
                .orient("bottom");

            var xAxisG = chartSvg
                .append("g")
                .attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight) + ")")
                .attr("class", "axis")
                .call(xaxis)

            xAxisG.selectAll("text")
                .attr("fill", "rgb(119, 119, 119)")
                .append("title")
                .text(d => d);

            xAxisG.selectAll("text").attr("fill", "rgb(119, 119, 119)");

        }

        private drawYScale(yScale, chartSvg, dimension, data) {
           
            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", "translate(" + (dimension.yOffset) + "," + (0) + ")")
                .attr("class", "axis")
                .call(yaxis);

            yAxisG.selectAll("text").attr("fill", "rgb(119, 119, 119)");
        }

        public drawActivityRect(xScale, yScale, chartSvg,data,dimension){
            console.log("YRangeBand", yScale.rangeBand());
        
            var rectG = chartSvg
                    .selectAll(".ganttrect")
                    .data(data)
                .enter()
                    .append("g");

            rectG.attr("transform", function (d) {
                var xVal, yVal;

                xVal = xScale(d.timeFrom);
                yVal = yScale(d.activity);

                if (yVal === undefined) yVal = -1000;
                if (xVal < 0 || isNaN(xVal) || xVal === undefined) xVal = -10000;

                return "translate(" + (xVal + dimension.yOffset) + "," + yVal + ")";
            });

            rectG.append("rect")
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