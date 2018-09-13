
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


module powerbi.extensibility.visual.heatMapCCFC224D9885417F9AAF5BB8D45B007E  {
    "use strict";
   
    export class Visual implements IVisual {
       
        private host: IVisualHost;
      //  private tooltipServiceWrapper: ITooltipServiceWrapper;

        private selectionManager: ISelectionManager;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;
        private colorScale: any;
        private colorRange: any;

        private columns: any;
        private dimension:any
        private hasXaxis:any = false;
        private hasYaxis: any = false;
        private hasValue: any = false;

        private xAxisIndex: any;
        private yAxisIndex: any;
        private valueIndex: any;

        private heatScale: any = "default";
        private heatRange: any = 10;
        private heatColorType: any = "linear";

        private legendPosition: any = "right";
        private middleBinValue: any;
        private iValueFormatter:any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private heatRects: d3.Selection<SVGElement>;

        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public  TooltipEnabledDataPoint: any;

        private NegativeTextColor: any;
        private heatColorOptions: any = {
            Heat: ["#9E0142", "#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#E6F598", "#ABDDA4", "#66C2A5", "#3288BD", "#5E4FA2"],
            BlueRed: ["#A11118", "#CD1720", "#EA4029", "#FD684E", "#F79277", "#B9E8C9", "#92DCC7", "#61C7C6", "#1FADC8", "#008FC4", "#0367A8"],
            GreenOrange: ["#AA3911", "#D94912", "#F36620", "#FD9049", "#FDAF71", "#F8CFA1", "#B6EC84", "#92DE75", "#74CB6D", "#54AF5F", "#399250", "#1C6B37"],
            YlOrRd: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026", "#730022", "#61011D"],
            YlOrBr: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506", "#592005", "#4A1B04"],
            RedBlue: ["#0367A8", "#008FC4", "#1FADC8", "#61C7C6", "#92DCC7", "#B9E8C9", "#FCB99C", "#F79277", "#FD684E", "#EA4029", "#CD1720", "#A11118"],
            OrangeGreen: ["#54AF5F", "#74CB6D", "#92DE75", "#B6EC84", "#F8CFA1", "#FDAF71", "#FD9049", "#F36620", "#D94912", "#AA3911"]
        }

        private xAxisLabel: any = "all";
        private heatColor: any = "Heat";
        private showXAxis: any = true;
        private showYAxis: any = true;
        private showLabel: any = false;
        private rectRadius: any = 0;
        
       constructor(options: VisualConstructorOptions) {
           
           this.element = d3.select(options.element);
           this.host = options.host;
           this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
           this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
           this.columns = options.dataViews[0].metadata.columns;
            

           if (options.dataViews[0].metadata.objects) {
               if (options.dataViews[0].metadata.objects["Heat"]) {
                   var heat = options.dataViews[0].metadata.objects["Heat"];
                   if (heat.heatScale !== undefined) this.heatScale = heat["heatScale"];
                   if (heat.heatRange !== undefined) this.heatRange = heat["heatRange"];
                   if (heat.heatColorType !== undefined) this.heatColorType = heat["heatColorType"];
                   if (heat.heatColor !== undefined) this.heatColor = heat["heatColor"];
                   if (heat.rectRadius !== undefined) this.rectRadius = heat["rectRadius"];
                  
                   this.middleBinValue = heat["middleBinValue"];
                   
               }
               if (options.dataViews[0].metadata.objects["Legend"]) {
                   var legend = options.dataViews[0].metadata.objects["Legend"];
                   if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
               }
               if (options.dataViews[0].metadata.objects["Axis"]) {
                   var axis = options.dataViews[0].metadata.objects["Axis"];
                   if (axis.showXAxis !== undefined) this.showXAxis = axis["showXAxis"];
                   if (axis.xAxisLabel !== undefined) this.xAxisLabel = axis["xAxisLabel"];
                   if (axis.showYAxis !== undefined) this.showYAxis = axis["showYAxis"];
                   if (axis.showLabel !== undefined) this.showLabel = axis["showLabel"];
               }
               
            }

           this.columns.map((d,i) => {
               if (d.roles["xAxis"]) {
                   this.hasXaxis = true;
                   this.xAxisIndex = i;
               }
               if (d.roles["yAxis"]) {
                   this.hasYaxis = true;
                   this.yAxisIndex = i;
               }
               if (d.roles["values"]) {
                   this.hasValue = true;
                   this.valueIndex = i;
               }
           });
        
           this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ value:1001 });
        
            if (this.hasValue) this.iValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: options.dataViews[0].metadata.columns[this.valueIndex].format });
          
           var data = [], identityData;
            //console.log(options.dataViews[0].table.rows);
            //console.log(this.xAxisIndex, this.yAxisIndex, this.valueIndex)
            options.dataViews[0].table.rows.map((d: any, i) => {
                d.identity = options.dataViews[0].table.identity[i];
                d.xValue = d[this.xAxisIndex];
                d.yValue = d[this.yAxisIndex];
                d.value = d[this.valueIndex];
               data.push(d);
           });

           this.element.style("overflow", "hidden");
           this.element.select('.heatMap').remove();

            var chartContainer = this.element
                .append("div")
                .attr("class", "heatMap")
                .attr("style", "width:100%;");

            var dimension = this.getDimensions(options.viewport,data);

            var chart = chartContainer
                            .append("svg")
                            .attr("height", dimension.height)
                            .attr("width", dimension.width)
                            .on("click", (d, i) => {
                                this.selectionManager.clear();
                                this.heatRects.style("opacity" , (d:any) => {
                                    d.isFiltered = false;
                                    return 1;
                                });
                                
                            });

            var chartSvg = chart.append("g")
            var chartLegend = chart.append("g")
            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);

            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension);
            var colorScale = this.setHeatScale(data);
            this.drawHeatRect(chartSvg, xScale, yScale, data, dimension);
            this.drawLegend(chartLegend, chartSvg, dimension, data);
        }
        private getDimensions(vp,data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;
            if (this.legendPosition == "right") xlegendOffset = 80;
            if (this.legendPosition == "top" || this.legendPosition === "bottom") ylegendOffset = 50;

            let xdata = data.map(d => d.xValue);
            let ydata = data.map(d => d.yValue);
            let yScale = d3.scale.ordinal().domain(ydata);
            let xDomain = d3.scale.ordinal().domain(xdata).domain();
            let yDomain = yScale.domain();
           
            let xT:any = this.axisLabelArray(xDomain.slice(0), vp.width, this.element, "Vertical");
            let yT:any = this.axisLabelArray(yDomain.slice(0), vp.height, this.element, "Horizontal");
            
            let xOffset = this.showYAxis ? yT.Space + 15 : 0;
            let yOffset = this.showXAxis ? xT.Space + 15 : 0;

            if (this.xAxisLabel === "firstLast" || this.xAxisLabel === "firstMiddleLast") yOffset = 25;
            if (this.xAxisLabel === "firstLast" || this.xAxisLabel === "firstMiddleLast") xT.Rotate = false;

            let chartWidth = vp.width - xOffset - xlegendOffset;
            let chartHeight = vp.height - yOffset - ylegendOffset;

            yScale.rangeRoundBands([0, chartHeight]);
         
            let xFilter = (xT.Rotate === true) ? Math.round((xDomain.length / chartWidth * 100) / 2) : 1;
            let yFilter = ((chartHeight / yDomain.length) < 15) ? Math.round((yDomain.length / chartHeight * 100) / 4) : 1;
           
            let xTickval = xDomain.filter((d, i) => (i % xFilter === 0));
            let yTickval = yDomain.filter((d, i) => (i % yFilter === 0));

            if (this.xAxisLabel === "firstLast") xTickval = [xTickval[0], xDomain[xDomain.length - 1]];
            if (this.xAxisLabel === "firstMiddleLast") xTickval = [xTickval[0], xTickval[Math.ceil(xTickval.length / 2)], xDomain[xDomain.length - 1]];
           
            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                chartWidth: chartWidth,
                chartHeight: chartHeight,
                xRotate: xT.Rotate,
                yRotate: yT.Rotate,
                xTickval: xTickval,
                yTickval: yTickval
            }
        }

        private setXScale(data, dimension) {
            var xDomain = data.map(d => d.xValue);
            
            var scale = d3.scale.ordinal().rangeRoundBands([0, dimension.chartWidth]).domain(xDomain);
            return scale;
        }

        private setYScale(data, dimension) {
            var yDomain = data.map(d => d.yValue);
            var scale = d3.scale.ordinal().rangeRoundBands([0, dimension.chartHeight]).domain(yDomain);
            return scale;
        }

        private drawXScale(xScale, chartSvg, dimension) {
            var xaxis = d3.svg.axis()
                .scale(xScale)
                .orient("top")
                .tickValues(dimension.xTickval);
            if (this.showXAxis === true) {
                var xAxisG = chartSvg
                    .append("g")
                    .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")")
                    .attr("class", "axis")
                    .call(xaxis)

                if (this.xAxisLabel === "firstLast" || this.xAxisLabel === "firstMiddleLast") {
                    xAxisG.selectAll("text").style("text-anchor", function (d, i) {
                        if (i == 0) return "start";
                        if (i === dimension.xTickval.length - 1) return "end";
                        else return "middle";
                    });
                }
                if (dimension.xRotate == true) {
                    xAxisG.attr("text-anchor", "start");
                    xAxisG.selectAll("text")
                        .style("text-anchor", "start")
                        .attr("dx", 6)
                        .attr("dy", 10)
                        .attr("transform", function (d) {
                            return "rotate(" + (290) + ")";
                        });
                }
            }
           
        }

        private drawYScale(yScale, chartSvg, dimension) {
            var self = this;
            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickValues(dimension.yTickval);

            if (this.showYAxis === true) {
                var yAxisG = chartSvg
                    .append("g")
                    .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")")
                    .attr("class", "axis")
                    .call(yaxis)
            }
            //yAxisG.selectAll(".tick text").each(function (d, i) {
            //    d3.select(this).call(self.axisWrap, dimension.yOffet, "Horizontal", "Right");
            //});
        }

        private setHeatScale(data) {
            //var colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
            var colors = this.heatColorOptions[this.heatColor]
            var col = colors.slice(0, 10);
            var colorScale, heatDomain, min, max, upper, lower;
            var colorRange = col.slice(0, Math.ceil(this.heatRange / 2)).concat(col.splice(-Math.floor(this.heatRange / 2)));

            if ((this.heatRange % 2) !== 0 && this.middleBinValue !== undefined) {
                upper = colors.slice(0, 10);
                lower = colors.slice(0, 10);
                var sl = Math.floor(this.heatRange / 2);
                colorRange = upper.slice(0, sl).concat(["#b3b3b3"]).concat(lower.slice(-sl));
            }
           
            if (this.heatScale === "default") {

                min = d3.min(data.map(d => d.value));
                max = d3.max(data.map(d => d.value));

                if (this.heatColorType === "linear") heatDomain = [min, max];
                else heatDomain = data.map(d => d.value).sort();

                if (this.middleBinValue !== undefined) heatDomain = [d3.min([min, this.middleBinValue]), this.middleBinValue, d3.max([max, this.middleBinValue])];

                this.colorScale = d3.scale.quantile()
                                        .domain(heatDomain)
                                        .range(colorRange);

            };

            if (this.heatScale === "rows") {

                this.colorScale = {};

                var nestedData = d3.nest()
                                    .key((d) => d[this.xAxisIndex])
                                    .entries(data);
              
                nestedData.map(d => {
                    heatDomain = d.values.map(function (d) { return d.value; });

                    min = d3.min(heatDomain);
                    max = d3.max(heatDomain);

                    if (this.heatColorType === "linear") heatDomain = [min, max];
                    else heatDomain = data.map(d => d.value).sort();

                    if (this.middleBinValue !== undefined) heatDomain = [min, this.middleBinValue, max];

                    this.colorScale[d.key] = d3.scale.quantile()
                                                    .domain(heatDomain)
                                                    .range(colorRange);

                });

            };

            if (this.heatScale === "columns") {

                this.colorScale = {};

                var nestedData = d3.nest()
                    .key((d) => d[this.yAxisIndex])
                    .entries(data);

                nestedData.map(d => {
                    heatDomain = d.values.map(function (d) { return d.value; });

                    min = d3.min(heatDomain);
                    max = d3.max(heatDomain);

                    if (this.heatColorType === "linear") heatDomain = [min, max];
                    else heatDomain = data.map(d => d.value).sort();

                    if (this.middleBinValue !== undefined) heatDomain = [min, this.middleBinValue, max];

                    this.colorScale[d.key] = d3.scale.quantile()
                                                    .domain(heatDomain)
                                                    .range(colorRange);

                });

            };
            this.colorRange = colorRange;
            
            return colorScale;

        }

        private drawHeatRect(chartSvg, xScale, yScale, data, dimension) {

            var heatG = chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")");

            var rects = this.heatRects = heatG.selectAll(".rects")
                .data(data)
                .enter()
                .append("rect")
                .attr("rx", this.rectRadius)
                .attr("ry", this.rectRadius)
                .attr("x", d => xScale(d.xValue))
                .attr("y", d => yScale(d.yValue))
                .attr("height", d => yScale.rangeBand() - 1)
                .attr("width", d => xScale.rangeBand() - 1);

            if (this.heatScale === "default") {
                rects.attr("fill", d => d.value !== null ? this.colorScale(d.value) : "#ffffff");
            }
            else if (this.heatScale === "rows") {
                rects.attr("fill", d => d.value !== null ? this.colorScale[d.xValue](d.value) : "#ffffff");
            }
            else if (this.heatScale === "columns") {
                rects.attr("fill", d => d.value !== null ? this.colorScale[d.yValue](d.value) : "#ffffff");
            };


            rects.attr("fill", d => this.colorScale(d.value));

            rects.on("click", (d, i) => {
                d.isFiltered = !d.isFiltered;

                const categoryColumn: DataViewCategoryColumn = {
                    source: this.columns[this.xAxisIndex],
                    values: null,
                    identity: [d.identity]
                };

                var id = this.host.createSelectionIdBuilder()
                    .withCategory(categoryColumn, 0)
                    .createSelectionId();

                this.selectionManager.select(id, true);

                this.setFilterOpacity(rects);
                (<Event>d3.event).stopPropagation();
            });

            if (this.showLabel === true) {
                let heatLabels = heatG.selectAll(".heatText")
                    .data(data)
                    .enter()
                    .append("text")
                    .attr("x", d => xScale(d.xValue))
                    .attr("y", d => yScale(d.yValue))
                    .attr("dx", d => xScale.rangeBand()/2)
                    .attr("dy", d => yScale.rangeBand()/2 + 6)
                    .attr("text-anchor", "middle")
                    .text(d => this.iValueFormatter.format(d.value))
                    .on("click", (d, i) => {
                        d.isFiltered = !d.isFiltered;

                        const categoryColumn: DataViewCategoryColumn = {
                            source: this.columns[this.xAxisIndex],
                            values: null,
                            identity: [d.identity]
                        };

                        var id = this.host.createSelectionIdBuilder()
                            .withCategory(categoryColumn, 0)
                            .createSelectionId();

                        this.selectionManager.select(id, true);

                        this.setFilterOpacity(rects);
                        (<Event>d3.event).stopPropagation();
                    });

                this.tooltipServiceWrapper.addTooltip(heatLabels,
                    (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
            }


            this.tooltipServiceWrapper.addTooltip(this.heatRects,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
           
           
        }

        public setFilterOpacity(rects) {

            var anyFilter = false;
            rects.each(d => {
                if (d.isFiltered === true) anyFilter = true;
            });

            if (anyFilter) {
                rects.style("opacity", d => d.isFiltered ? 1 : 0.2);
            }
            else {
                rects.style("opacity", 1);
            }

        }

        private drawLegend(chartLegend, chartSvg, dimension, data) {

            if (this.legendPosition == "right") {
                chartLegend.attr("transform", "translate(" + (dimension.chartWidth + dimension.xOffset + 20) + "," + (dimension.yOffset + 15) + ")");
            }
            if (this.legendPosition == "top") {
                chartSvg.attr("transform", "translate(0,50)");
               chartLegend.attr("transform", "translate(" + (dimension.xOffset + 20)+ ",10)");
            }
            if (this.legendPosition == "bottom") {
                chartLegend.attr("transform", "translate(" + (dimension.xOffset + 20)+ "," + (dimension.chartHeight + dimension.yOffset) + ")");
            }
            let legendData = [];
            let min = d3.min(data.map(d => d.value));

            if (this.legendPosition === 'right') legendData = this.colorScale.quantiles().slice(0).reverse().concat([min]);
            else legendData = [min].concat(this.colorScale.quantiles());

            let rectHeight = 15;
            let rectWidth = 15;

            if (dimension.chartHeight < 200) rectHeight = dimension.chartHeight / 20;
            if (dimension.chartWidth < 200) rectWidth = dimension.chartWidth / 20;

            var legendG = chartLegend.selectAll(".legend")
                .data(legendData)
                .enter()
                .append("rect")
                .attr("id", function (d) { return d })
                .attr("width", rectWidth)
                .attr("height", rectHeight)
                .attr("cursor", "pointer")
                .style("fill", (d, i) => {
                    return this.colorRange[legendData.length - (i + 1)];
                });

           var legendText =  chartLegend.selectAll(".legendText")
                .data(legendData)
                .enter()
                .append("text")
               .text((d, i) => (i == 0 || i == legendData.length - 1) ? this.iValueFormatter.format(d) : "")
           

            if (this.legendPosition == "right") {
                legendG.attr("x", 15)
                    .attr("y", function (d, i) { return i * rectHeight; });

                legendText
                    .attr("x", 15)
                    .attr("text-anchor", "middle")
                    .attr("dy", (d, i) => i == 0 ? -5 : 32)
                    .attr("y", function (d, i) { return i * rectHeight; });
                
            }
            else {
                legendG.attr("y", 15)
                    .attr("x", function (d, i) { return i * rectWidth; });

                legendText.attr("y", 27)
                    .attr("dx", (d, i) => i == 0 ? -2 : 17)
                    .attr("x", function (d, i) { return i * rectWidth; });

                legendText.attr("text-anchor", (d, i) => i == 0 ? "end" : "start");
            }

        };

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];
           
            retData.push({
                displayName: data.yValue,
                value: data.xValue,
                header: data.value.toString()
            });
           
            return retData;
        }

        private getLegendMaxLength(data) {

            var dummySvg = d3.select('body').append("svg");
           
            var maxLegendLen = d3.max(data.map(d => { return this.getTextWidth(dummySvg, d); } )) + 40;

            dummySvg.remove();

            return maxLegendLen;
        };

        private getTextWidth(container, text) {
            
            var dummytext = container.append("text").text(text).attr("font-size", 16);
            var bbox = { width: 10, height: 10 };
            if (dummytext.node() !== null) bbox = dummytext.node().getBBox();
            dummytext.remove();

            return bbox.width;
        };

        private axisLabelArray(labels, chartwidth, el, orientation) {
            var self = this;
            var rotate = false;
            var wordsArray = [];
            var space = 0;
            var svg = el.append("svg").attr("width", 0).attr("height", 0);
          
            var scale = d3.scale.ordinal().domain(labels).rangeRoundBands([0, chartwidth]);
            var maxWidth = scale.rangeBand();
           
            if (orientation === "Vertical") {
               
                labels.map(function (text) {
                    var words = String(text).split(/\s+/).reverse();
                    words.map(function (d) { wordsArray.push(d); });

                    var word, line = [];

                });
                var longest = wordsArray.sort(function (a, b) { return b.length - a.length; })[0];
                if (this.getTextWidth(svg, longest) > maxWidth) rotate = true;
               
                if (rotate === true) {
                    var longest = labels.sort(function (a, b) { return b.length - a.length; })[0];
                    space = self.getTextWidth(svg, longest);
                }
                else {
                    var lineCountArr = [1];
                    labels.map(function (d, i) {

                        var mWidth = (i === 0 || i === labels.length - 1) ? maxWidth / 2 : maxWidth;
                        var textContent = String(d), spanContent;
                      
                        var words = textContent.split(/\s+/).reverse(),
                            word,
                            lineCount = 0;
                        let line = [],
                            t = "";
                        
                        while (word = words.pop()) {
                            line.push(word);
                            t = line.join(' ');
                            if (self.getTextWidth(svg, t) > mWidth) {
                               
                                line.pop();
                                spanContent = line.join(' ');
                                lineCountArr.push(++lineCount);
                            }
                        };

                    });
                   
                    space = 10 * (d3.max(lineCountArr));
                }
                
            }
            else {
                var long = labels.sort(function (a, b) { return b.length - a.length; })[0];
                let longest:any = String(long);
                var needWarpping = false;
              
                labels.map(function (d) {
                    var words = String(d).split(/\s+/).reverse();
                    if (words.length > 1) needWarpping = true;
                });
               
                if (longest.length < 25 || needWarpping == false) {
                    rotate = false;
                    space = this.getTextWidth(svg, longest);
                }
                else {

                    var noOfLines = d3.max([1, Math.ceil(maxWidth / 20)]);
                    if (noOfLines > 5) noOfLines = 4;
                    var words = longest.split(/\s+/).reverse();
                    longest = words.sort(function (a, b) { return b.length - a.length; }).join(" ");
                    var maxWord = longest.substring(0, (longest.length / noOfLines));

                    var maxText = longest.split(/\s+/).slice(0, maxWord.split(/\s+/).length).join(" ");

                    space = this.getTextWidth(svg, maxText);
                    
                }
            }
           
            svg.remove();

            return { Rotate: rotate, Space: space };

        }

        private axisWrap(text, width, orientation, alignment) {
           
            text.each(function () {

                var breakChars = ['/', '&'],
                    text = d3.select(this),
                    textContent = text.text(),
                    spanContent;

                breakChars.forEach(function (char) {
                    textContent = textContent.replace(char, char + ' ');
                });

                var words = textContent.split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    x = text.attr('x'),
                    y = text.attr('y'),
                    dy = parseFloat(text.attr('dy'));

                var tspan:any = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');

                while (word = words.pop()) {
                    line.push(word);

                    tspan.text(line.join(' '));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        spanContent = line.join(' ');

                        breakChars.forEach(function (char) {
                            spanContent = spanContent.replace(char + ' ', char);
                        });

                        if (spanContent.length > 0) {
                            tspan.text(spanContent);
                            line = [word];
                            tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
                        }
                    }
                }
            });

            if (orientation === "Horizontal") {
                var spans = text.selectAll("tspan")._groups[0];
                var margin = spans.length > 1 ? (spans.length / 2) * 8 : 0.5;
                text.selectAll("tspan").attr("y", text.selectAll("tspan").attr("y") - margin);
            }
            if (orientation === "HeatVertical") {
                var spans = text.selectAll("tspan")._groups[0];
                var margin = spans.length > 1 ? (spans.length) * 8 : 0;
                text.selectAll("tspan").attr("y", text.selectAll("tspan").attr("y") - margin);
            }

            if (alignment !== undefined) {
                var textAnchor = alignment === "Right" ? "end" : "start";
                if (alignment === "middle") textAnchor = "middle";
                text.selectAll("tspan").attr("text-anchor", textAnchor).attr("dx", text.attr('dx'));
            }

        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
          
            switch (objectName) {
                case 'Heat':
                    objectEnumeration.push({ objectName: objectName, properties: { heatColor: this.heatColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { heatScale: this.heatScale }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { heatRange: this.heatRange }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { heatColorType: this.heatColorType }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { rectRadius: this.rectRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { middleBinValue: this.middleBinValue }, selector: null });
                   
                    break;
                case 'Legend':
                    objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                 
                    break;
                case 'Axis':
                    objectEnumeration.push({ objectName: objectName, properties: { showXAxis: this.showXAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { xAxisLabel: this.xAxisLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showYAxis: this.showYAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                  
                    break;
                    
            };
           

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}