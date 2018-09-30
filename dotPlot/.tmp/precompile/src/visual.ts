
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


module powerbi.extensibility.visual.dotPlotCCFC224D9885417F9AAF5BB8D45B007E  {
    "use strict";
   
    export class Visual implements IVisual {
       
        private host: IVisualHost;

        private selectionManager: ISelectionManager;
       
        private settings: VisualSettings;

        private columns: any;
        private dimension:any

        private hasAxis: any = false;
        private hasColor: any = false;
        private hasValue: any = false;
        private hasSize: any = false;
        private colorTitle: any = '';
        private legendPosition: any = "right";

        private axisFormat: any;
        private colorFormat: any;
        private circles: any;
        private colorScale: any;
        private iValueFormatter:any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public  TooltipEnabledDataPoint: any;

        private yAxisMinValue: boolean = false;;
        private legendColor: any = 'Category1'
        private colorOptions: any = {
            Category1: ["#26C6DA", "#EC407A", "#9CCC65", "#FFCA28", "#EF5350", "#78909C", "#42A5F5", "#FFA726", "#26A69A", "#AB47BC", "#BDBDBD", "#5C6BC0", "#8D6E63", "#D4E157", "#29B6F6", "#66BB6A", "#FF7043", "#7E57C2", "#FFEE58", "#9CCC64"],
            Category2: ["#C79A6B", "#737373", "#97C7C5", "#67B0E1", "#FEBC4A", "#A7D679", "#ED82B7", "#ADAEB5", "#C8B570", "#448EC9", "#F6B982", "#9DBE59", "#5BBE94", "#5884B3", "#CC6686", "#E68570"],
            Category3: ["#ACD15F", "#F64747", "#F69647", "#2B9494", "#F6CD47", "#699DCF", "#B5253C", "#868686", "#4CA2B3", "#DBA13A", "#D2527F", "#4CB972", "#3598DB", "#F8CF47", "#FF2100", "#BBBBBB", "#AD7CCA", "#FDE3A7", "#5DB753", "#EE91AC"],
            Category4: ["#F64747", "#ACD15F", "#F69647", "#3598DB", "#F8CF47", "#2B9494", "#BBBBBB", "#D03C7D", "#4CB972", "#B5253C", "#9CDAEE", "#868686", "#699DCF", "#FDE3A7", "#2B9494", "#FF2100", "#5DB753", "#EE91AC", "#AD7CCA", "#E08283"],
            Category5: ["#3D94D1", "#B5253C", "#45A8A8", "#F64747", "#00AF64", "#F8CF47", "#AD7CCA", "#EE91AC", "#C79A6B", "#868686", "#9CDAEE", "#FFB300", "#B5253C", "#4CA2B3", "#ACD15F", "#FDE3A7", "#D03C7D", "#2B9494", "#BBBBBB", "#3598DB"],
            Category6: ["#00A0B0", "#FE4365", "#7AB317", "#EDC951", "#CC333F", "#F69647", "#4DBCE9", "#EE91AC", "#99B2B7", "#4ECDC4", "#948C75", "#C7F464", "#FF6B6B", "#00CDAC", "#3598DB", "#FFB300", "#5DB753", "#868686", "#699DCF", "#CD8C52"],
            Category7: ["#699DCF", "#C79A6B", "#E15759", "#45A8A8", "#59A14E", "#EDC951", "#B07AA1", "#F69647", "#EE91AC", "#99B2B7", "#ACD15F", "#F06D69", "#FFAE0B", "#8BC2CB", "#5785C1", "#CD8C52", "#A1CEA8", "#F8CF47", "#FF9DA7", "#9CDAEE"],
            Category8: ["#699DCF", "#F69647", "#E15759", "#45A8A8", "#C79A6B", "#99B2B7", "#B07AA1", "#F8CF47", "#9CDAEE", "#5785C1", "#C3BC29", "#FF9DA7", "#2B9494", "#868686", "#ACD15F", "#4CB972", "#F69647", "#EE91AC", "#9C755F", "#D7CE9B"],
            Category9: ["#C79A6B", "#699DCF", "#868686", "#FF9DA7", "#A1CEA8", "#F69647", "#F8CF47", "#45A8A8", "#F06D69", "#9CDAEE", "#53AD87", "#EE91AC", "#ACD15F", "#DBA13A", "#BAB0AC", "#A1CEA8", "#C3BC29", "#C7F464", "#EE91AC", "#FFC107"],
            Category10: ["#699DCF", "#F69647", "#99B2B7", "#ACD15F", "#C79A6B", "#FF9DA7", "#45A8A8", "#F8CF47", "#E15759", "#BAB0AC", "#5785C1", "#CD8C52", "#A1CEA8", "#FFAE0B", "#EE91AC", "#9CDAEE", "#B07AA1", "#868686", "#53AD87", "#CD8C52"],
        }
    
        private showAxis: any = true;
        private showLabel: any = false;

        private dotRadius: any = 6;
        private circleOpacity: any = 100;
        
        private fontSize: any = 14;
        private legendFontSize: any=10;

        constructor(options: VisualConstructorOptions) {
           
           this.element = d3.select(options.element);
           this.host = options.host;
           this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
           this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            
            this.setProperties(options);
            var data = this.formatData(options.dataViews[0]);
          
           this.element.style("overflow", "hidden");
           this.element.select('.dotPlot').remove();

            var chartContainer = this.element
                                        .append("div")
                                        .attr("class", "dotPlot")
                                        .attr("style", "width:100%;");

            var dimension = this.getDimensions(options.viewport,data);
        
            var chart = chartContainer
                            .append("svg")
                            .attr("height", dimension.height)
                            .attr("width", dimension.width)
                            .on("click", (d, i) => {
                                this.selectionManager.clear();
                                this.circles.style("opacity", (d: any) => {
                                    d.isFiltered = false;
                                    return 1;
                                });
                            });
           
            var chartSvg = chart.append("g")
            var chartLegend = chart.append("g")
            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);
           
            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension,data);
            this.drawCircles(xScale, yScale, chartSvg, data, dimension);

            this.drawLegend(chartLegend, chartSvg, dimension, data);
            this.setFontSize(chartSvg);
        }

        public formatData(rawData) {
            var metadata = rawData.metadata.columns;
            this.colorScale = d3.scale.ordinal().range(this.colorOptions[this.legendColor]);

            this.findAvailableMetadata(metadata);

            var formattedData = [];

            if (this.hasAxis && this.hasValue) {
                var xAxis = rawData.categorical.categories[0].values;
                var xMetadata = rawData.categorical.categories[0].source;
                var identityData = rawData.categorical.categories[0].identity;
              
                if (this.axisFormat !== undefined) {
                    var axisFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.axisFormat });
                    xAxis = xAxis.map(d => { return axisFormat.format(d) });
                }

                var yAxis = [], valFormat;
                var sizeValues = [];
                var valuesG = rawData.categorical.values.filter(d => d.source.roles.values);

                if (this.hasSize == true) {
                    var sizeMetadata = rawData.categorical.values.filter(d => d.source.roles.size)[0];
                    var sizeG = sizeMetadata.values;
                    var sizeFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: sizeMetadata.source.format });
                }

                if (this.hasColor) {
                    
                    var valuesMetadata = metadata.filter(d => d.roles["values"])[0].displayName;
                    var filteredValues = valuesG.filter(d => d.source.displayName == valuesMetadata);

                    if (this.colorFormat !== undefined) {
                        var colorFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.colorFormat });
                    }
                    

                    formattedData = filteredValues.map((d, i) => {
                        valFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.source.format });
                     
                        return {
                            key: this.colorFormat !== undefined ? colorFormat.format(d.source.groupName) : d.source.groupName,
                            values: d.values.map((t, i) => {
                                yAxis.push(t);
                                if (this.hasSize) sizeValues.push(sizeG[i]);
                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[i], caption: xAxis[i]},
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.groupName,
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                                    color: this.colorScale(d.source.groupName),
                                    colorValue: { title: this.colorTitle, caption: d.source.groupName },
                                    size: this.hasSize ? { title: sizeMetadata.source.displayName, value: sizeG[i], caption: sizeFormat.format(sizeG[i]) } : null
                                }
                            })
                        }
                    })

                }
                else {
                    
                    formattedData = valuesG.map((d, i) => {
                        valFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: d.source.format });
                        return {
                            key: d.source.displayName,
                            values: d.values.map((t, i) => {
                                yAxis.push(t);
                                if (this.hasSize )sizeValues.push(sizeG[i]);
                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[i], caption: xAxis[i] },
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.displayName,
                                    color: this.colorScale(d.source.displayName),
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).createSelectionId(),
                                    size: this.hasSize ? { title: sizeMetadata.source.displayName, value: sizeG[i], caption: sizeFormat.format(sizeG[i]) } : null
                                }
                            })
                        }
                    })

                }
            }

            var legend = this.setLegendWidth(this.element, formattedData.map(d => d.key));
           
            return { xAxis: xAxis, yAxis: yAxis, yFormat: valFormat.format, data: formattedData, legend: legend, sizeValues: sizeValues}
        }

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.dotRadius !== undefined) this.dotRadius = basic["dotRadius"];
                    if (basic.circleOpacity !== undefined) this.circleOpacity = basic["circleOpacity"];
                    if (basic.showLabel !== undefined) this.showLabel = basic["showLabel"];
                    
                }
                if (options.dataViews[0].metadata.objects["Legend"]) {
                    var legend = options.dataViews[0].metadata.objects["Legend"];
                    if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
                    if (legend.legendColor !== undefined) this.legendColor = legend["legendColor"];
                    if (legend.fontSize !== undefined) this.legendFontSize = legend["fontSize"];
                }
                if (options.dataViews[0].metadata.objects["Axis"]) {
                    var axis = options.dataViews[0].metadata.objects["Axis"];
                    if (axis.showAxis !== undefined) this.showAxis = axis["showAxis"];
                    if (axis.showLabel !== undefined) this.showLabel = axis["showLabel"];
                    if (axis.fontSize !== undefined) this.fontSize = axis["fontSize"];
                    if (axis.yAxisMinValue !== undefined) this.yAxisMinValue = axis["yAxisMinValue"];
                    
                }

                
            }
        }

        private findAvailableMetadata(metadata) {
            this.hasValue = false;
            this.hasColor = false;
            this.hasAxis = false;
            this.hasSize = false;

            metadata.map((d, i) => {
                if (d.roles["axis"]) {
                    this.hasAxis = true;
                    this.axisFormat = d.format;
                }
                if (d.roles["color"]) {
                    this.hasColor = true;
                    this.colorFormat = d.format;
                    this.colorTitle = d.displayName;
                }
                if (d.roles["values"]) {
                    this.hasValue = true;
                }
                if (d.roles["size"]) {
                    this.hasSize = true;
                }
            });

            

        }

        private getDimensions(vp,data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;
           
            if (this.legendPosition == "right") ylegendOffset = d3.max(data.legend.map(d => d.width)) + (4 * this.legendFontSize);
            if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = this.legendFontSize*3;
           
            let xdata = data.xAxis;
            let xDomain = d3.scale.ordinal().domain(xdata).domain();
           
            let xT:any = this.axisLabelArray(xDomain.slice(0), vp.width, this.element, "Vertical");
            
            let xOffset = xT.Space + 15;
            let yOffset = 50;

            let chartWidth = vp.width - yOffset - ylegendOffset;

            let chartHeight = vp.height - xOffset - xlegendOffset;

            let xFilter = (xT.Rotate === true) ? Math.round((xDomain.length / chartWidth * 100) / 2) : 1;
           
            let xTickval = xDomain.filter((d, i) => (i % xFilter === 0));

            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                chartWidth: chartWidth,
                chartHeight: chartHeight,
                xRotate: xT.Rotate,
                xTickval: xTickval,
            }
        }

        private setXScale(data, dimension) {
            
            var scale = d3.scale.ordinal().rangeBands([0, dimension.chartWidth]).domain(data.xAxis);
            return scale;
        }

        private setYScale(data, dimension) {
            var yDomain = data.yAxis;

            var valueDomain = this.setValueDomain(d3.min(yDomain), d3.max(yDomain));

            var scale = d3.scale.linear()
                            .range([dimension.chartHeight, 0])
                            .domain([valueDomain.Min, valueDomain.Max]);

            return scale;
        }

        private drawXScale(xScale, chartSvg, dimension) {

            var xaxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickValues(dimension.xTickval);

           
                var xAxisG = chartSvg
                    .append("g")
                    .attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight) + ")")
                    .attr("class", "axis")
                    .call(xaxis)
                
                if (dimension.xRotate == true) {
                    xAxisG.attr("text-anchor", "start");
                    xAxisG.selectAll("text")
                        .style("text-anchor", "start")
                        .attr("dx", 6)
                        .attr("dy", -1)
                        .attr("transform", function (d) {
                            return "rotate(" + (75) + ")";
                        });
                }
           
           
        }

        private drawYScale(yScale, chartSvg, dimension,data) {
            var self = this;

            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(5)
                .tickFormat(data.yFormat);
           
                var yAxisG = chartSvg
                    .append("g")
                    .attr("transform", "translate(" + (dimension.yOffset) + "," + 0 + ")")
                    .attr("class", "axis")
                    .call(yaxis)
            
        }

        private drawCircles(xScale, yScale, chartSvg, data, dimension) {

            var circleData = data.data;
            
            var circleG = chartSvg.selectAll(".dots")
                                .data(circleData)
                                .enter()
                                .append("g")
                                .attr("transform", "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)");


            var circle = this.circles = circleG.selectAll(".dots")
                                        .data(d => d.values.filter(d => d.yValue.value !== null))
                                    .enter()
                                    .append("circle");


            circle.attr("cx", d => xScale(d.xValue.value))
                .attr("cy", d => yScale(d.yValue.value))
                .attr("r", this.dotRadius)
                .attr("fill", d => d.color)
                .style("stroke", d => d.color)
                .style("fill-opacity", this.circleOpacity / 100);


            circle.on("click", (d, i) => {
                d.isFiltered = !d.isFiltered;

                const categoryColumn: DataViewCategoryColumn = {
                    source: d.xValue.value,
                    values: null,
                    identity: d.identity
                };

               
                //host.createSelectionIdBuilder()
                //    .withCategory(category, i)
                //    .createSelectionId()

                var id = this.host.createSelectionIdBuilder()
                    .withCategory(categoryColumn, 0)
                    .createSelectionId();
                console.log(d.selectionId);
                this.selectionManager.select(d.selectionId, true);

                this.setFilterOpacity(circle);
                (<Event>d3.event).stopPropagation();
            });

            if (this.showLabel == true) {
                var text = circleG.selectAll(".dotText")
                            .data(d => d.values.filter(d => d.yValue.value !== null))
                            .enter()
                    .append("text");

                text.attr("x", d => xScale(d.xValue.value)+2)
                    .attr("dx", this.dotRadius)
                    .attr("dy", this.dotRadius/2)
                    .attr("y", d => yScale(d.yValue.value))
                    .text(d => d.yValue.caption)
               
            }

            if (this.hasSize) {

                var sizeScale = d3.scale.linear()
                                    .range([this.dotRadius, d3.min([25, (5 * this.dotRadius)])])
                                    .domain([d3.min(data.sizeValues), d3.max(data.sizeValues)]);

                circle.attr("r", d => sizeScale(Math.abs(d.size.value)));
                
            }

            this.tooltipServiceWrapper.addTooltip(circle,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        public setFilterOpacity(element) {

            var anyFilter = false;
            element.each(d => {
                if (d.isFiltered === true) anyFilter = true;
            });

            if (anyFilter) {
                element.style("opacity", d => d.isFiltered ? 1 : 0.2);
            }
            else {
                element.style("opacity", 1);
            }

        }

        private drawLegend(chartLegend, chartSvg, dimension, data) {
            if (this.legendPosition == "right") {
                chartLegend.attr("transform", "translate(" + (dimension.chartWidth + dimension.yOffset + (this.legendFontSize*2)) + "," + (5) + ")");
            }
            if (this.legendPosition == "top") {
                chartSvg.attr("transform", "translate(0," + this.legendFontSize * 3 +")");
                chartLegend.attr("transform", "translate(" + (dimension.yOffset) + "," + this.legendFontSize + ")");
            }
            if (this.legendPosition == "bottom") {
                chartLegend.attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight + (this.legendFontSize * 3)) + ")");
            }
            var fontSize = parseInt(this.legendFontSize);
           
            var legengG  = chartLegend.selectAll(".legend")
                                        .data(data.legend)
                                        .enter()
                                        .append("g");

            if (this.legendPosition == "right") legengG.attr("transform", (d, i) => "translate(0," + i * (fontSize + 5) + ")");
            else {
                var wd = -data.legend[0].width;
                legengG.attr("transform", (d, i) => {
                    wd = wd + d.width;

                    return "translate(" + wd + ",0)";
                });
            }

            legengG.append("circle")
                .attr("r", fontSize / 2)
                .attr("cy", fontSize / 5)
                .attr("fill", d => d.color);

            legengG
                .append("text")
                .attr("x", fontSize)
                .attr("y", fontSize / 2)
                .text(d => d.text);

            legengG.style("font-size", fontSize);
        };

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];

            retData.push({
                displayName: data.xValue.title,
                value: data.xValue.caption,
            });
            retData.push({
                displayName: data.yValue.title,
                value: data.yValue.caption,
            });

            if (this.hasSize === true) {
                retData.push({
                    displayName: data.size.title,
                    value: data.size.caption,
                });
            }
            if (this.hasColor === true) {
                retData.push({
                    displayName: data.colorValue.title,
                    value: data.colorValue.caption,
                });
            }

            return retData;
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
                    width: this.getTextWidth(svg, d, this.legendFontSize),
                    color: this.colorScale(d),
                    text:d
                }
            })
            svg.remove();

            return legend;
        }

        private axisLabelArray(labels, chartwidth, el, orientation) {
            var self = this;
            var fontsize = this.fontSize;
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
                if (this.getTextWidth(svg, longest, fontsize) > maxWidth) rotate = true;
               
                if (rotate === true) {
                    var longest = labels.sort(function (a, b) { return b.length - a.length; })[0];
                    space = self.getTextWidth(svg, longest, fontsize);
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
                            if (self.getTextWidth(svg, t, fontsize) > mWidth) {
                               
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
                    space = this.getTextWidth(svg, longest, fontsize);
                }
                else {

                    var noOfLines = d3.max([1, Math.ceil(maxWidth / 20)]);
                    if (noOfLines > 5) noOfLines = 4;
                    var words = longest.split(/\s+/).reverse();
                    longest = words.sort(function (a, b) { return b.length - a.length; }).join(" ");
                    var maxWord = longest.substring(0, (longest.length / noOfLines));

                    var maxText = longest.split(/\s+/).slice(0, maxWord.split(/\s+/).length).join(" ");

                    space = this.getTextWidth(svg, maxText, fontsize);
                    
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

        private setFontSize(chartSvg){

            chartSvg.selectAll("text").style("font-size", this.fontSize + "px");
        }

        private setValueDomain = function (Min, Max) {
            var domain:any = {};
          
            if (Min > 0) {
                domain.Min = 0;
                domain.Max = Max + ((Max * 15) / 100);
                domain.OMin = 0;
                domain.OMax = Max;
            }
            else if (Max < 0) {
                domain.Max = 0;
                domain.Min = Min - ((Min * 15) / 100);
                domain.OMax = 0;
                domain.OMin = Min;
            }
            else {
                domain.Min = Min - ((Min * 15) / 100);
                domain.Max = Max + ((Max * 15) / 100);
                domain.OMin = Min;
                domain.OMax = Max;
            }

            if (this.yAxisMinValue == true) {
                domain.Min = Min - ((Min * 10) / 100);
                domain.Max = Max + ((Max * 10) / 100);
            }

            return domain;
        };

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
          
            switch (objectName) {

                case 'Basic':
                    objectEnumeration.push({ objectName: objectName, properties: { dotRadius: this.dotRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleOpacity: this.circleOpacity }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                    
                    break;
                case 'Legend':
                    objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { legendColor: this.legendColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.legendFontSize }, selector: null });
                    break;
                case 'Axis':
                   // objectEnumeration.push({ objectName: objectName, properties: { showXAxis: this.showAxis }, selector: null });
                    //objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { yAxisMinValue: this.yAxisMinValue }, selector: null });
                    
                    break;
                     
            };
           

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}