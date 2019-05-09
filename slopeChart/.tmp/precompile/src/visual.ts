
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


module powerbi.extensibility.visual.slopeChartD9885417F9AAF5BB8D45B007E  {
    "use strict";

    export class Visual implements IVisual {

        private host: IVisualHost;

        private selectionManager: ISelectionManager;
        private element: any;

        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;
        private colorPalette: any;

        private hasAxis: any = false;
        private axisFormat: any;

        private hasPeriod: any = false;
        private periodFormat: any;
        private periodTitle: any = "";
        private hasValue: any = false;

        private legendPosition: any = "right";
        private legendName: any;
        private legendFontSize: any = 10;

        private fontSize: any = 10;

        private valFormat: any = 'default';
        private valPrecision: any = 0;

        private dotRadius: any = 14;
        private circleOpacity: any = 10;
        private showLabel: any = true;
        private showAxis: any = true;

        private formattedData: any = [];
        private slopes: any;

        private showConditionalColor: any = false;
        private upColor: any = { solid: { color: "#01b8aa" } };
        private downColor: any = { solid: { color: "#3557B8" } };
        private showAs: any = "default";

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            this.element.style("overflow", "hidden");
            this.element.select('.slopeChart').remove();

            this.colorPalette.reset();
            this.draw(options);
        }

        public draw(options) {

            this.findAvailableMetadata(options.dataViews[0].metadata.columns);

            var chartContainer = this.element
                .append("div")
                .attr("class", "slopeChart")
                .attr("style", "width:100%;");

            if (this.hasAxis == false || this.hasValue == false) {
                chartContainer.append("span").html("Axis and Value is required to draw the chart");
                return;
            }

            this.setProperties(options);

            var data = this.formatData(options.dataViews[0]);
            var dimension = this.getDimensions(options.viewport, data);

            var chart = chartContainer
                .append("svg")
                .attr("height", dimension.height)
                .attr("width", dimension.width)
                .on("click", (d, i) => {
                    this.selectionManager.clear();
                    this.slopes.style("opacity", (d: any) => {
                        d.isFiltered = false;
                        return 1;
                    });
                });

            var chartSvg = chart.append("g")

            chartSvg.attr("transform", "translate(0," + this.dotRadius + ")");

            var chartLegend = chart.append("g");
           
            var yScale = this.setYScale(data, dimension);
           
            if (this.showAxis) {
                this.drawLeftAxis(yScale, chartSvg, dimension, data);
                this.drawRightAxis(yScale, chartSvg, dimension, data);
            }

            this.drawSlope(yScale, chartSvg, dimension, data);
            if (this.legendPosition !== "legendOnCircle" && this.showConditionalColor === false) this.drawLegend(chartLegend, chartSvg, dimension, data);
            this.setFontSize(chartSvg);
        }

        //region Format data
        public formatData(rawData) {
            var metadata = rawData.metadata.columns;

            var formattedData = [];

            if (this.hasAxis && this.hasValue) {
                var xAxis = rawData.categorical.categories[0].values;
                var xMetadata = rawData.categorical.categories[0].source;
                var identityData = rawData.categorical.categories[0].identity;
                var grouped = rawData.categorical.values.grouped();

                if (this.axisFormat !== undefined) {
                    var axisFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.axisFormat });
                    xAxis = xAxis.map(d => { return axisFormat.format(d) });
                }

                var valFormat;
                var sizeValues = [];
                var valuesG = rawData.categorical.values.filter(d => d.source.roles.values);


                if (this.hasPeriod) {

                    var valuesMetadata = metadata.filter(d => d.roles["values"])[0].displayName;
                    var filteredValues = valuesG.filter(d => d.source.displayName == valuesMetadata);

                    if (this.periodFormat !== undefined) {
                        var colorFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.periodFormat });
                    }

                    formattedData = filteredValues.map((d, i) => {
                        valFormat = this.getValueFormat(d.source.format, d3.max(d.values.map(d => d)));

                        let color: any = this.colorPalette.getColor(d.source.groupName).value;

                        if (grouped[i].objects) color = grouped[i].objects.colorSelector.fill.solid.color;

                        return {
                            key: this.periodFormat !== undefined ? colorFormat.format(d.source.groupName) : d.source.groupName,
                            iden: this.host.createSelectionIdBuilder().withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                            color: color,
                            values: d.values.map((t, j) => {

                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.groupName,
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                                    color: color,
                                    colorValue: { title: this.periodTitle, caption: d.source.groupName },

                                }
                            })
                        }
                    })

                }
                else {

                    formattedData = valuesG.map((d, i) => {

                        valFormat = this.getValueFormat(d.source.format, d3.max(d.values.map(d => d)));

                        //this.colorPalette.getColor(d.source.groupName).value
                        var color = this.colorPalette.colors[i].value;

                        if (grouped[0].values[i].source.objects) {
                            color = grouped[0].values[i].source.objects.colorSelector.fill.solid.color;
                        }

                        return {
                            key: d.source.displayName,
                            color: color,
                            iden: this.host.createSelectionIdBuilder().withMeasure(d.source.queryName).createSelectionId(),
                            values: d.values.map((t, j) => {

                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.displayName,
                                    color: color,
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], j).createSelectionId(),

                                }
                            })
                        }
                    })

                }
            }
            let legendD = formattedData.map(d => { return { key: d.key, color: d.color } });
            let nm = (this.legendName !== undefined) ? this.legendName.length > 0 ? this.legendName : this.periodTitle : this.periodTitle;
            if (this.hasPeriod) legendD.unshift({ key: nm, color: "transparent" });

            var legend = this.setLegendWidth(this.element, legendD);
            var retData = this.setUpAnalyticData(formattedData)

            var yAxis = [];

            retData.map(d => {
                d.values.map(d => {
                    yAxis.push(d.yValue.value);
                })
            });

            if (this.showAs == "perTotal") {
                //valFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: "0.00 %;-0.00 %;0.00 %", precision: this.valPrecision });
                valFormat = { format: d3.format(",." + this.valPrecision + "%") };
            }
            this.formattedData = retData;

            return { xAxis: xAxis, yAxis: yAxis, yFormat: valFormat.format, data: retData, legend: legend }
        }

        private setUpAnalyticData(data) {
            var retData;
            var cdata = JSON.parse(JSON.stringify(data)); 
            switch (this.showAs) {

                case "perTotal":
                    // retData = data.map(function (d) {
                    //     var total = d3.sum(d.values.map(function (d) { return d.yValue.value; }));
                    //     d.values.map(function (d, i) {
                    //         if (d.yValue.value !== null) d.yValue.value = (d.yValue.value / total);
                    //     });
                    //     return d;
                    // });


                    var axisTotalValue;
                   
                    retData = cdata.map(function (d, j) {
                        d.values.map(function (d, i) {
                           
                            axisTotalValue = d3.sum(data.map(function (d) {
                                return d.values[i].yValue.value
                            }));
                           
                            if (d.yValue.value !== null) d.yValue.value = d.yValue.value / axisTotalValue;
                          
                        });
                        return d;
                    });



                    break;


                default:
                    retData = data;
                    break;
            }

            return retData;
        }

        private findAvailableMetadata(metadata) {
            this.hasValue = false;
            this.hasPeriod = false;
            this.hasAxis = false;

            metadata.map((d, i) => {
                if (d.roles["axis"]) {
                    this.hasAxis = true;
                    this.periodFormat = d.format;
                    this.periodTitle = d.displayName;
                }
                if (d.roles["period"]) {
                    this.hasPeriod = true;
                    
                    this.axisFormat = d.format;
                }
                if (d.roles["values"]) {
                    this.hasValue = true;
                }

            });

        }
        //endregion

        //region Draw Axis
        private setYScale(data, dimension) {
            let yDomain = [];

            data.data.map(d => {
                yDomain.push(d.values[0].yValue.value);
                yDomain.push(d.values[d.values.length - 1].yValue.value);
            });

            let scale = d3.scale.linear()
                .range([dimension.chartHeight, 0])
                .domain([d3.min(yDomain), d3.max(yDomain)]);

            return scale;
        }

        private drawLeftAxis(yScale, chartSvg, dimension, data) {
           
            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(0)

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", "translate(" + dimension.xOffset + ",0)")
                .attr("class", "axis")
                .call(yaxis);

        }

        private drawRightAxis(yScale, chartSvg, dimension, data) {

            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("right")
                .ticks(0)

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", "translate(" + dimension.chartWidth + ",0)")
                .attr("class", "axis")
                .call(yaxis);
        }

        private drawSlope(yScale, chartSvg, dimension, data) {

            var format = data.yFormat;
            var radius = 14;
            var end = dimension.chartWidth;
            var start = dimension.xOffset;
            var slopeData = data.data.filter(d => {
                return d.values[0] !== undefined
                    && d.values[0].yValue.value !== null
                    && d.values[d.values.length - 1].yValue.value !== null
            });

            var slopes = this.slopes = chartSvg.selectAll("slopeGroups")
                .data(slopeData)
                .enter()
                .append("g");

            slopes.on("click", (d, i) => {
                d.isFiltered = !d.isFiltered;
               
                this.selectionManager.select(d.iden, true);

                this.setFilterOpacity(slopes);
                (<Event>d3.event).stopPropagation();
            });

           var slopeLine = slopes.append("line")
                .attr("x1", start)
                .attr("x2", end)
                .attr("y1", d => yScale(d.values[0].yValue.value))
                .attr("y2", d => yScale(d.values[d.values.length - 1].yValue.value))
                .attr("style", "stroke-width:1px;stroke:#b3b3b3");

           var startCircle = slopes.append("circle")
                .attr("cx", start)
                .attr("cy", d => yScale(d.values[0].yValue.value))
                .attr("r", this.dotRadius)
                .attr("fill", d => d.color)
                .attr("stroke", d => d.color)
                .attr("fill-opacity", this.circleOpacity / 10);

            this.tooltipServiceWrapper.addTooltip(startCircle,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data.values[0]),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

            var endCircles = slopes.append("circle")
                .attr("cx", end)
                .attr("cy", d => yScale(d.values[d.values.length - 1].yValue.value))
                .attr("r", this.dotRadius)
                .attr("fill", d => d.color)
                .attr("stroke", d => d.color)
                .attr("fill-opacity", this.circleOpacity / 10);

            this.tooltipServiceWrapper.addTooltip(endCircles,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data.values[tooltipEvent.data.values.length - 1]),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

            if (this.showLabel === true) {
                slopes.append("text")
                    .attr("x", start)
                    .attr("y", d => yScale(d.values[0].yValue.value) + this.dotRadius / 4)
                    .attr("text-anchor", "middle")
                    .attr("style", "pointer-events:none;")
                    .text(d => this.showAs == "perTotal" ? format(d.values[0].yValue.value) : d.values[0].yValue.caption)
                    .attr("fill", "#fff");

                slopes.append("text")
                    .attr("style", "pointer-events:none;")
                    .attr("x", end)
                    .attr("y", d => yScale(d.values[d.values.length - 1].yValue.value) + this.dotRadius / 4)
                    .attr("text-anchor", "middle")
                    .text(d => this.showAs == "perTotal" ? format(d.values[d.values.length - 1].yValue.value) :d.values[d.values.length - 1].yValue.caption)
                    .attr("fill", "#fff");
            }

            if (this.legendPosition === "legendOnCircle" || this.showConditionalColor === true) {
                slopes.append("text")
                    .attr("style", "pointer-events:none;")
                    .attr("class","legendOnCircle")
                    .attr("x", end + (this.dotRadius*2))
                    .attr("y", d => yScale(d.values[d.values.length - 1].yValue.value) + this.dotRadius / 4)
                    .attr("text-anchor", "start")
                    .text(d => d.key)
                    .attr("style", "font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;")
                    
                    .attr("fill", "#666666");
            }

            if (this.showConditionalColor === true) {
                startCircle.attr("fill", d => d.values[0].yValue.value < d.values[d.values.length - 1].yValue.value ? this.upColor.solid.color : this.downColor.solid.color);
                endCircles.attr("fill", d => d.values[0].yValue.value < d.values[d.values.length - 1].yValue.value ? this.upColor.solid.color : this.downColor.solid.color);
                startCircle.attr("stroke", d => d.values[0].yValue.value < d.values[d.values.length - 1].yValue.value ? this.upColor.solid.color : this.downColor.solid.color);
                endCircles.attr("stroke", d => d.values[0].yValue.value < d.values[d.values.length - 1].yValue.value ? this.upColor.solid.color : this.downColor.solid.color);

                slopeLine.style("stroke", d => d.values[0].yValue.value < d.values[d.values.length - 1].yValue.value ? this.upColor.solid.color : this.downColor.solid.color);
            }

            chartSvg.append("text")
                .attr("transform", "translate(" + dimension.xOffset + "," + (dimension.height-20) + ")")
                .attr("text-anchor","middle")
                .text(slopeData[0].values[0].xValue.caption);

            chartSvg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + dimension.chartWidth + "," + (dimension.height-20) + ")")
                .text(slopeData[0].values[slopeData[0].values.length - 1].xValue.caption)

        }
        //endregion

        private drawLegend(chartLegend, chartSvg, dimension, data) {
            if (this.legendPosition == "right") {
                chartLegend.attr("transform", "translate(" + (dimension.chartWidth + dimension.yOffset + (this.legendFontSize * 2)) + "," + (5) + ")");
            }
            if (this.legendPosition == "top") {
                chartSvg.attr("transform", "translate(0," + (this.legendFontSize * 3 + this.dotRadius) + ")");
                chartLegend.attr("transform", "translate(" + 10 + "," + this.legendFontSize + ")");
            } 
            if (this.legendPosition == "bottom") {
                chartLegend.attr("transform", "translate(" + 10 + "," + (dimension.chartHeight + dimension.xOffset + (this.legendFontSize * 2)) + ")");
            }
            var fontSize = parseInt(this.legendFontSize);

            var legengG = chartLegend.selectAll(".legend")
                .data(data.legend)
                .enter()
                .append("g");

            if (this.legendPosition == "right") legengG.attr("transform", (d, i) => "translate(0," + i * (fontSize + 5) + ")");
            else {
                var wd = 0, rt;
                legengG.attr("transform", (d, i) => {
                    rt = "translate(" + wd + ",0)"
                    wd = wd + d.width;
                    return rt;
                });
            }

            legengG.append("circle")
                .attr("r", fontSize / 2)
                .attr("cy", fontSize / 5)
                .attr("fill", d => d.color);

           
            legengG
                .append("text")

                .attr("x", d => d.color === "transparent" ? -5 : fontSize)
                .attr("font-weight", d => d.color === "transparent" ? "bold" : "normal")
                .attr("style", d => {
                    if (d.color === "transparent") return 'fill:rgb(102, 102, 102);font-family: "Segoe UI Semibold", wf_segoe-ui_semibold, helvetica, arial, sans-serif;';
                    else return 'fill:rgb(102, 102, 102);font-family: "Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif';
                })
                .style("font-size", fontSize + "px")
                .attr("y", fontSize / 2)
                .text(d => d.text);

            legengG.style("font-size", fontSize);
        };


        //region getDimensions
        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;
          
            if (this.legendPosition == "right") ylegendOffset = d3.max(data.legend.map(d => d.width)) + (3 * this.legendFontSize);
            if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = this.legendFontSize * 3;
            if (this.legendPosition === "legendOnCircle" || this.showConditionalColor === true) ylegendOffset = d3.max(data.legend.map(d => d.width)) + (this.legendFontSize);
           
            let xdata = data.xAxis;
            let xDomain = d3.scale.ordinal().domain(xdata).domain();

            let xT: any = this.axisLabelArray(xDomain.slice(0), (vp.width - this.getYOffset(data) - ylegendOffset), this.element, "Horizontal");

            let xOffset, yOffset, chartWidth, chartHeight, xFilter, xTickval;

            yOffset = 10 + parseFloat(this.dotRadius);
            if ((yOffset > vp.width / 4) && (this.legendPosition !== "legendOnCircle" || this.showConditionalColor !== true)) yOffset = vp.width / 4 > 100 ? 100 : vp.width / 4;
            xOffset = 30;
            chartWidth = vp.width - yOffset - ylegendOffset;
            chartHeight = vp.height - xOffset - xlegendOffset;
            xFilter = chartHeight / xDomain.length < this.fontSize ? Math.round((xDomain.length / chartHeight * 20)) : 1;
            xTickval = xDomain.filter((d, i) => (i % xFilter === 0));

            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                chartWidth: chartWidth,
                chartHeight: chartHeight - this.dotRadius,
                xRotate: xT.Rotate,
                xTickval: xTickval,
            }
        }
        //endregion



        //region Helper Functions
        private axisLabelArray(labels, chartwidth, el, orientation) {
            var self = this;
            var fontsize = this.fontSize;
            var rotate = false;
            var wordsArray = [];
            var space = 0;
            var svg = el.append("svg").attr("width", 0).attr("height", 0);

            var scale = d3.scale.ordinal().domain(labels).rangeRoundBands([0, chartwidth]);
            var maxWidth = scale.rangeBand();

            if (orientation === "vertical") {

                labels.map(function (text) {
                    var words = String(text).split(/\s+/).reverse();
                    words.map(function (d) { wordsArray.push(d); });

                    var word, line = [];

                });
                var longest = labels.sort(function (a, b) { return b.length - a.length; })[0];

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
                let longest: any = String(long);
                var needWarpping = false;
                space = this.getTextWidth(svg, longest, fontsize);
            }

            svg.remove();

            return { Rotate: rotate, Space: space };

        }

        private getYOffset(data) {

            let max = d3.max(data.yAxis);

            return 2 + (data.yFormat(max).length + 1) * this.fontSize / 1.5;
        }

        private getTextWidth(container, text, fontsize) {

            var dummytext = container.append("text").text(text).attr("font-size", this.legendFontSize);
            var bbox = { width: 10, height: 10 };
            if (dummytext.node() !== null) bbox = dummytext.node().getBBox();
            dummytext.remove();

            return bbox.width;
        };

        private getValueFormat(val, max) {

            let valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
            let iValueFormatter = valueFormatter.create({});
            let valF = null;
            switch (this.valFormat) {
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
                    return { format: d3.format(",." + this.valPrecision + "f") }
            }

            iValueFormatter = valueFormatter.create({ format: val, value: valF, precision: this.valPrecision });

            return iValueFormatter;
        }

        private setLegendWidth(el, legendData) {
            var svg = el.append("svg").attr("width", 0).attr("height", 0);

            var legend = legendData.map(d => {
                return {
                    width: this.getTextWidth(svg, d.key, this.legendFontSize) + 20,
                    color: d.color,
                    text: d.key
                }
            })
            svg.remove();

            return legend;
        }

        private setFontSize(chartSvg) {

            chartSvg.selectAll("text").style("font-size", this.fontSize + "px");

            chartSvg.selectAll(".legendOnCircle").style("font-size", this.legendFontSize + "px");
            
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

           
            if (this.hasPeriod === true) {
                retData.push({
                    displayName: data.colorValue.title,
                    value: data.colorValue.caption,
                });
            }

            return retData;
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
        //endregion


        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.dotRadius !== undefined) this.dotRadius = basic["dotRadius"];
                    if (basic.circleOpacity !== undefined) this.circleOpacity = basic["circleOpacity"];
                    if (basic.showLabel !== undefined) this.showLabel = basic["showLabel"];
                    if (basic.valFormat !== undefined) this.valFormat = basic["valFormat"];
                    if (basic.valPrecision !== undefined) this.valPrecision = basic["valPrecision"];
                    if (basic.showAxis !== undefined) this.showAxis = basic["showAxis"];
                    if (basic.showAs !== undefined) this.showAs = basic["showAs"];
                }

                if (options.dataViews[0].metadata.objects["Legend"]) {
                    var legend = options.dataViews[0].metadata.objects["Legend"];
                    if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
                    if (legend.fontSize !== undefined) this.legendFontSize = legend["fontSize"];
                    if (legend.legendName !== undefined) this.legendName = legend["legendName"];

                }

                if (options.dataViews[0].metadata.objects["conditionalColor"]) {
                    var conditionalColor = options.dataViews[0].metadata.objects["conditionalColor"];
                    if (conditionalColor.showConditionalColor !== undefined) this.showConditionalColor = conditionalColor["showConditionalColor"];
                    if (conditionalColor.upColor !== undefined) this.upColor = conditionalColor["upColor"];
                    if (conditionalColor.downColor !== undefined) this.downColor = conditionalColor["downColor"];

                }
            }
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {

                case 'Basic':

                    objectEnumeration.push({ objectName: objectName, properties: { dotRadius: this.dotRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                    if (this.showLabel == true) {
                        objectEnumeration.push({ objectName: objectName, properties: { valFormat: this.valFormat }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { valPrecision: this.valPrecision }, selector: null });
                    }
                    objectEnumeration.push({ objectName: objectName, properties: { showAxis: this.showAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showAs: this.showAs }, selector: null });

                   
                    
                    break;

                case 'colorSelector':
                    if (this.showConditionalColor == false) {
                        for (let barDataPoint of this.formattedData) {

                            objectEnumeration.push({
                                objectName: objectName,
                                displayName: barDataPoint.key,
                                properties: {
                                    fill: {
                                        solid: {
                                            color: barDataPoint.color
                                        }
                                    }
                                },
                                selector: barDataPoint.iden.getSelector()
                            });
                        }
                    }
                    break;

                case 'Legend':
                    if (this.showConditionalColor === false) {
                        objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                        if (this.hasAxis) objectEnumeration.push({ objectName: objectName, properties: { legendName: this.legendName }, selector: null });
                        //objectEnumeration.push({ objectName: objectName, properties: { legendColor: this.legendColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.legendFontSize }, selector: null });
                    }
                    break;

                case "conditionalColor":
                    objectEnumeration.push({ objectName: objectName, properties: { showConditionalColor: this.showConditionalColor }, selector: null });
                    if (this.showConditionalColor === true) {
                        objectEnumeration.push({ objectName: objectName, properties: { upColor: this.upColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { downColor: this.downColor }, selector: null });
                    }

                    break;

            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}