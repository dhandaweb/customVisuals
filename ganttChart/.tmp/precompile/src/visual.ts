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
        private milestone: any = false;
        private dateFormat: any;

        private activityIndex: any = 0;
        private groupIndex: any = 0;
        private timeFromIndex: any = 0;
        private timeToIndex: any = 0;
        private milestoneIndex: any = 0;
        

        private showXaxisBrush:any = false;
        private showYaxisBrush:any = false;
        private milestoneSymbol:any = "diamond";
        private milestoneColor:any = { solid: { color: "#50005C" } };

        //private color =["#8950FC","#3699FF","#019C8C","#7A084B","#0BB7AF","#F65163","#0BB783",];
        private color =["#00B9FA","#63A8FF","#63A8FF","#7EA0FF","#9798FF","#AF8EFD","#C683F2","#FF4FAC","#F95CC2","#FF4FAC","#FF4395"];

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;
            this.setProperties(options);
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
                if (d.roles["timeTo"]) {
                    this.milestone = true;
                    this.milestoneIndex=i;
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
                    activity:d[this.activityIndex],
                    milestone:this.milestone ? d[this.milestoneIndex] : null
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

        if(this.milestone) this.drawMilestone(xScale, yScale, chartSvg,data,dimension);
        if(this.showXaxisBrush) this.drawXBrush(xScale,yScale,chartSvg,dimension,ganttRect);
        if(this.showYaxisBrush) this.drawYBrush(xScale,yScale,chartSvg,dimension,ganttRect);

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
            }
        }

        private getDimensions(vp, data) {

           var max = d3.max(data.map(d=>d.activity.length*(this.fontSize/2)));

            let xOffset, yOffset, chartWidth, chartHeight;
            let xbrushOffset = this.showXaxisBrush ? 30 : 0;
            let ybrushOffset = this.showYaxisBrush ? 20 : 0;
            xOffset = xbrushOffset + 40;
           
            yOffset = max + ybrushOffset;
            chartWidth = vp.width - yOffset ;
            chartHeight = vp.height - xOffset;
           
            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                xbrushOffset:xbrushOffset,
                ybrushOffset:ybrushOffset,
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
                .attr("transform", "translate(" + (dimension.yOffset - dimension.ybrushOffset) + "," + (0) + ")")
                .attr("class", "yaxis")
                .call(yaxis);
           
                this.updateYaxisLines(yAxisG,dimension,yScale);
            
        }

        private updateYaxisLines(yAxisG,dimension,yScale){
            yAxisG.selectAll("text")
            .attr("font-size",this.fontSize + "px")
            .attr("fill", "rgb(119, 119, 119)");

            yAxisG.selectAll("line")
            .attr("transform", "translate("+ (-dimension.yOffset) +"," + (-yScale.rangeBand()/2 -yScale.rangeBand()*.1 ) + ")")
        }

        private setRectPosition(rectG,xScale,yScale,dimension){
            
            rectG
            .attr("transform", function (d) {
                var xVal, yVal;

                xVal = xScale(d.timeFrom);
                yVal = yScale(d.activity);

                if (yVal === undefined) yVal = -1000;
                if (xVal < 0 || isNaN(xVal) || xVal === undefined) xVal = -10000;

                return "translate(" + (xVal + dimension.yOffset) + "," + yVal + ")";
            });

            rectG.selectAll('rect').attr("height", yScale.rangeBand())
        }

        private setMilestonePosition(xScale,yScale,dimension){
            
            d3.selectAll(".milestone")
                .attr("transform", function (d) {
                    var xVal, yVal;

                    xVal = xScale(d.milestone);
                    yVal = yScale(d.activity);

                    if (yVal === undefined) yVal = -1000;
                    if (xVal < 0 || isNaN(xVal) || xVal === undefined) xVal = -10000;

                    return "translate(" + (xVal + dimension.yOffset) + "," + (yVal + yScale.rangeBand()/2) + ")";
                });

            //rectG.selectAll('rect').attr("height", yScale.rangeBand())
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

        public drawMilestone(xScale, yScale, chartSvg,data,dimension){
        console.log(this.milestoneSymbol);
            var arc = d3.svg.symbol().type(String(this.milestoneSymbol))
                            .size(50);

            var symbol = chartSvg
                    .selectAll(".ganttrect")
                    .data(data)
                .enter()
                .append('path')
                .attr("class","milestone")
                .attr('d',arc)
                .attr("fill",this.milestoneColor.solid.color);

            this.setMilestonePosition(xScale,yScale,dimension);

            this.tooltipServiceWrapper.addTooltip(symbol,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

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
                                this.setMilestonePosition(xScale,yScale,dimension);
                            });

             var xBrush = chartSvg
                            .append("g")
                            .attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.height - dimension.xbrushOffset) + ")")
                            .call(brush);  
                            
                            xBrush.selectAll("rect")
                                   .style("visibility","visible")
                                   .attr("fill","#f6f6f6")
                                   .attr("height", 20);
                            xBrush.selectAll(".extent").attr("fill","#b3b3b3")
        }

        public drawYBrush(xScale,yScale,chartSvg,dimension,rectG){
            var yaxis,yAxisG;
            var yScaleCopy = yScale.copy();
            var brush = d3.svg.brush()
                            .y(yScaleCopy)
                            .on("brush", ()=>{
                                
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

                                this.updateYaxisLines(yAxisG,dimension,yScale);
                                this.setRectPosition(rectG,xScale,yScale,dimension);
                                this.setMilestonePosition(xScale,yScale,dimension);
                            });

             var yBrush = chartSvg
                            .append("g")
                            .attr("transform", "translate(" + (dimension.yOffset - dimension.ybrushOffset) + "," + (0) + ")")
                            .call(brush);  
                            
                            yBrush.selectAll("rect")
                                   .style("visibility","visible")
                                   .attr("fill","#f6f6f6")
                                   .attr("width", 15);

                                   yBrush.selectAll(".extent").attr("fill","#b3b3b3")
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
                case 'axis':
                    objectEnumeration.push({ objectName: objectName, properties: { showXaxisBrush: this.showXaxisBrush},selector: null});
                    objectEnumeration.push({ objectName: objectName, properties: { showYaxisBrush: this.showYaxisBrush},selector: null});
                 break;
                 case 'milestone':
                    objectEnumeration.push({ objectName: objectName, properties: { milestoneSymbol: this.milestoneSymbol},selector: null});
                    objectEnumeration.push({ objectName: objectName, properties: { milestoneColor: this.milestoneColor},selector: null});
                 break;   
             

            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}