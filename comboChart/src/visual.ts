
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

        private selectionManager: ISelectionManager;

        //private settings: VisualSettings;

        private columns: any;
        private dimension: any

        private hasAxis: any = false;
        private axisFormat: any;

        private hasColor: any = false;
        private colorFormat: any;

        private hasBar: any = false;
        private showBarLabel: any = false;
        private barAxis: any = "left";
        private barFormat: any;
        private barGroupType: any = "group";

        private hasArea: any = false;
        private showAreaLabel: any = false;
        private areaAxis: any = "left";
        private areaFormat: any;
        private showAreaDots: any = false;
        private areaDotRadius: any = 5;

        private hasLine: any = false;
        private showLineLabel: any = false;
        private lineAxis: any = "left";
        private lineFormat: any;
        private lineDotRadius: any = 5;

        private hasDot: any = false;
        private showLineDots: any = false;
        private showDotLabel: any = false;
        private dotAxis: any = "left";
        private dotFormat: any;
        private dotRadius: any = 5;
        private circleOpacity: any = 100;
        private circlestroke: any = 1;

        private colorTitle: any = '';
        private legendPosition: any = "right";
        private legendName: any;

        private showAs: any = "default";

        private showMean: any = false;
        private showMedian: any = false;
        private showMode: any = false;

        private regressionLine: any = false;
        private regressionLineType: any = "single";
        private regressionCurveType: any = "linear";

        private standardDeviation: any = false;
        private noOfStandardDeviation: any = "1";

        private exponentialSmoothingLine: any = false;

        private formattedData: any = [];

        private colorScale: any;
        private iValueFormatter: any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private leftAxisMinValue: any = false;
        private leftValFormat: any = 'default';
        private leftValPrecision: any = 0;
        private leftConstantLineValue: any = '';
        private leftConstantLineStrokeWidth: any = 1;
        private leftConstantLineColor: any = { solid: { color: "#000000" } };


        private rightAxisMinValue: any = false;
        private rightValFormat: any = 'default';
        private rightValPrecision: any = 0;
        private rightConstantLineValue: any = '';
        private rightConstantLineStrokeWidth: any = 1;
        private rightConstantLineColor: any = { solid: { color: "#000000" } };

        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;

        private yAxisMinValue: boolean = false;;
        private colorIndex: any = 0;
        private colorPalette: any;

        private showAxis: any = true;


        private fontSize: any = 11;
        private legendFontSize: any = 10;

      


        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            this.element.style("overflow", "hidden");
            this.element.select('.comboChart').remove();

            this.colorPalette.reset();

            this.draw(options);
        }

        public draw(options) {
            this.colorIndex = 0;
            this.findAvailableMetadata(options.dataViews[0].metadata.columns);

            var chartContainer = this.element
                .append("div")
                .attr("class", "comboChart")
                .attr("style", "width:100%;");

            if (this.hasAxis == false || (this.hasBar || this.hasArea || this.hasLine || this.hasDot) == false) {
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
                });

            var chartSvg = chart.append("g")

            chartSvg.attr("transform", "translate(0," + 5 + ")");

            var chartLegend = chart.append("g");

            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);
            var yRightScale = this.setRightYScale(data, dimension);

            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension, data);
            this.drawRightYScale(yRightScale, chartSvg, dimension, data);

            this.drawAreaChart(xScale, yScale, yRightScale, chartSvg, data.areaData, dimension);

            this.drawBarChart(xScale, yScale, yRightScale, chartSvg, data.barData, dimension);

            this.drawLineChart(xScale, yScale, yRightScale, chartSvg, data.lineData, dimension);
            this.drawDotChart(xScale, yScale, yRightScale, chartSvg, data.dotData, dimension);

            this.drawLeftConstantLine(yScale, chartSvg, data, dimension);
            this.drawRightConstantLine(yRightScale, chartSvg, data, dimension);

            this.drawLegend(chartLegend, chartSvg, dimension, data);

            this.setFontSize(chartSvg);
            // this.drawStastics(xScale, yScale, chartSvg, data, dimension);

        }

        public formatData(rawData) {
            var metadata = rawData.metadata.columns;
            var barData: any = [], lineData = [], areaData = [], dotData = [], allData = [];

            var leftAxisData: any = [], rightAxisData: any = [], legend: any = [], legendD: any = [];
            var leftAxisFormat, rightAxisFormat;
            let legendName = (this.legendName !== undefined) ? this.legendName.length > 0 ? this.legendName : this.colorTitle : this.colorTitle;

            if (this.hasAxis && ((this.hasBar || this.hasArea || this.hasLine || this.hasDot))) {
                var xAxis = rawData.categorical.categories[0].values;
                var xMetadata = rawData.categorical.categories[0].source;

                if (this.axisFormat !== undefined) {
                    var axisFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.axisFormat });
                    xAxis = xAxis.map(d => { return axisFormat.format(d) });
                }

                var grouped = rawData.categorical.values.grouped();

                if (this.hasBar) {
                    var valuesG = rawData.categorical.values.filter(d => d.source.roles.bar);
                    barData = this.getMeasureColorData(grouped, valuesG, metadata, rawData, xAxis, xMetadata, "bar");

                    if (this.barGroupType === "stacked") {

                        var stackFunction = d3.layout.stack()
                            //.offset("wiggle")
                            .values((d: any) => d.values);

                        stackFunction(barData);

                    }


                    barData.map(d => {
                        d.values.map(d => {
                            if (this.barAxis === "left") {
                                
                                if (this.barGroupType === "stacked") leftAxisData.push(d.y0 + d.y);
                                else leftAxisData.push(d.yValue.value);
                            }
                            else {
                                if (this.barGroupType === "stacked") rightAxisData.push(d.y0 + d.y);
                                else rightAxisData.push(d.yValue.value);
                            }
                        })
                    });

                    


                }

                if (this.hasArea) {
                    var valuesG = rawData.categorical.values.filter(d => d.source.roles.area);
                    areaData = this.getMeasureColorData(grouped, valuesG, metadata, rawData, xAxis, xMetadata, "area");
                    areaData.map(d => {
                        d.values.map(d => {
                            if (this.areaAxis === "left") leftAxisData.push(d.yValue.value);
                            else rightAxisData.push(d.yValue.value);
                        })
                    });
                }

                if (this.hasLine) {
                    var valuesG = rawData.categorical.values.filter(d => d.source.roles.line);
                    lineData = this.getMeasureColorData(grouped, valuesG, metadata, rawData, xAxis, xMetadata, "line");
                    lineData.map(d => {
                        d.values.map(d => {
                            if (this.lineAxis === "left") leftAxisData.push(d.yValue.value);
                            else rightAxisData.push(d.yValue.value);
                        })
                    });
                }

                if (this.hasDot) {
                    var valuesG = rawData.categorical.values.filter(d => d.source.roles.dot);
                    dotData = this.getMeasureColorData(grouped, valuesG, metadata, rawData, xAxis, xMetadata, "dot");
                    dotData.map(d => {
                        d.values.map(d => {
                            if (this.dotAxis === "left") leftAxisData.push(d.yValue.value);
                            else rightAxisData.push(d.yValue.value);
                        })
                    });
                }

            };

            allData = barData.concat(lineData.concat(areaData.concat(dotData)));

            legendD = allData.map(d => { return { key: d.key, color: d.color } });

            if (this.hasColor) legendD.unshift({ key: legendName, color: "transparent" });

            leftAxisFormat = this.getValueFormat(this.barFormat, d3.max(leftAxisData));
            rightAxisFormat = this.getValueFormat(this.lineFormat, d3.max(rightAxisData));

            var legend = this.setLegendWidth(this.element, legendD);

            return {
                xAxis: xAxis,
                leftAxis: { data: leftAxisData, format: leftAxisFormat },
                rightAxis: { data: rightAxisData, format: rightAxisFormat },
                barData: barData,
                areaData: areaData,
                lineData: lineData,
                dotData: dotData,
                legend: legend,
            }
        }

        private getMeasureColorData(grouped, valuesG, metadata, rawData, xAxis, xMetadata, type) {

            var formattedData = [];

            if (this.hasColor) {
                var valuesMetadata = metadata.filter(d => d.roles[type])[0].displayName;
                var filteredValues = valuesG.filter(d => d.source.displayName == valuesMetadata);

                formattedData = this.getColorData(filteredValues, grouped, rawData, xMetadata, xAxis);

            }
            else formattedData = this.getMeasureData(valuesG, grouped, rawData, xMetadata, xAxis);

            var retData = this.setUpAnalyticData(formattedData)

            return retData;
        }

        private getColorData(filteredValues, grouped, rawData, xMetadata, xAxis) {

            if (this.colorFormat !== undefined) {
                var colorFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.colorFormat });
            }

            return filteredValues.map((d, i) => {
                var valFormat = this.getValueFormat(d.source.format, d3.max(d.values.map(d => d)));

                let color: any = this.colorPalette.getColor(d.source.groupName).value;

                if (grouped[i].objects) color = grouped[i].objects.colorSelector.fill.solid.color;

                return {
                    key: this.colorFormat !== undefined ? colorFormat.format(d.source.groupName) : d.source.groupName,
                    iden: this.host.createSelectionIdBuilder().withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                    color: color,
                    values: d.values.map((t, j) => {
                        return {
                            xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                            yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                            y: t,
                            legend: d.source.groupName,
                            selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                            color: color,
                            colorValue: { title: this.colorTitle, caption: d.source.groupName },

                        }
                    })
                }
            })
        }

        private getMeasureData(filteredValues, grouped, rawData, xMetadata, xAxis) {
            return filteredValues.map((d, i) => {

                var valFormat = this.getValueFormat(d.source.format, d3.max(d.values.map(d => d)));

                var color = this.colorPalette.colors[this.colorIndex].value;

                if (grouped[0].values[i].source.objects) {
                    color = grouped[0].values[i].source.objects.colorSelector.fill.solid.color;
                }
                this.colorIndex = this.colorIndex + 1;
                return {
                    key: d.source.displayName,
                    color: color,
                    iden: this.host.createSelectionIdBuilder().withMeasure(d.source.queryName).createSelectionId(),
                    values: d.values.map((t, j) => {

                        return {
                            xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                            yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                            y: t,
                            legend: d.source.displayName,
                            color: color,
                            selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], j).createSelectionId(),
                        }
                    })
                }
            })
        }

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.fontSize !== undefined) this.fontSize = basic["fontSize"];
                }
                if (options.dataViews[0].metadata.objects["Bar"]) {
                    var bar = options.dataViews[0].metadata.objects["Bar"];
                    if (bar.showLabel !== undefined) this.showBarLabel = bar["showLabel"];
                    if (bar.axis !== undefined) this.barAxis = bar["axis"];
                    if (bar.barGroupType !== undefined) this.barGroupType = bar["barGroupType"];

                }
                if (options.dataViews[0].metadata.objects["Area"]) {
                    var area = options.dataViews[0].metadata.objects["Area"];
                    if (area.showLabel !== undefined) this.showAreaLabel = area["showLabel"];
                    if (area.axis !== undefined) this.areaAxis = area["axis"];
                    if (area.showAreaDots !== undefined) this.showAreaDots = area["showAreaDots"];
                    if (area.areaDotRadius !== undefined) this.areaDotRadius = area["areaDotRadius"];
                }
                if (options.dataViews[0].metadata.objects["Line"]) {
                    var line = options.dataViews[0].metadata.objects["Line"];
                    if (line.showLabel !== undefined) this.showLineLabel = line["showLabel"];
                    if (line.showLineDots !== undefined) this.showLineDots = line["showLineDots"];
                    if (line.lineDotRadius !== undefined) this.lineDotRadius = line["lineDotRadius"];


                    if (line.axis !== undefined) this.lineAxis = line["axis"];
                }
                if (options.dataViews[0].metadata.objects["Dot"]) {
                    var dot = options.dataViews[0].metadata.objects["Dot"];
                    if (dot.showLabel !== undefined) this.showDotLabel = dot["showLabel"];
                    if (dot.axis !== undefined) this.dotAxis = dot["axis"];
                    if (dot.dotRadius !== undefined) this.dotRadius = dot["dotRadius"];
                    if (dot.circleOpacity !== undefined) this.circleOpacity = dot["circleOpacity"];
                    if (dot.circlestroke !== undefined) this.circlestroke = dot["circlestroke"];

                }
                if (options.dataViews[0].metadata.objects["Legend"]) {
                    var legend = options.dataViews[0].metadata.objects["Legend"];
                    if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
                    if (legend.fontSize !== undefined) this.legendFontSize = legend["fontSize"];
                    if (legend.legendName !== undefined) this.legendName = legend["legendName"];

                }
                if (options.dataViews[0].metadata.objects["leftAxis"]) {
                    var leftAxis = options.dataViews[0].metadata.objects["leftAxis"];
                    if (leftAxis.leftValFormat !== undefined) this.leftValFormat = leftAxis["leftValFormat"];
                    if (leftAxis.leftValPrecision !== undefined) this.leftValPrecision = leftAxis["leftValPrecision"];
                    if (leftAxis.leftAxisMinValue !== undefined) this.leftAxisMinValue = leftAxis["leftAxisMinValue"];
                    if (leftAxis.constantLineValue !== undefined) this.leftConstantLineValue = leftAxis["constantLineValue"];
                    if (leftAxis.constantLineStrokeWidth !== undefined) this.leftConstantLineStrokeWidth = leftAxis["constantLineStrokeWidth"];
                    if (leftAxis.constantLineColor !== undefined) this.leftConstantLineColor = leftAxis["constantLineColor"];
                }

                if (options.dataViews[0].metadata.objects["rightAxis"]) {
                    var rightAxis = options.dataViews[0].metadata.objects["rightAxis"];
                    if (rightAxis.rightValFormat !== undefined) this.rightValFormat = rightAxis["rightValFormat"];
                    if (rightAxis.rightValPrecision !== undefined) this.rightValPrecision = rightAxis["rightValPrecision"];
                    if (rightAxis.rightAxisMinValue !== undefined) this.rightAxisMinValue = rightAxis["rightAxisMinValue"];
                    if (rightAxis.constantLineValue !== undefined) this.rightConstantLineValue = rightAxis["constantLineValue"];
                    if (rightAxis.constantLineStrokeWidth !== undefined) this.rightConstantLineStrokeWidth = rightAxis["constantLineStrokeWidth"];
                    if (rightAxis.constantLineColor !== undefined) this.rightConstantLineColor = rightAxis["constantLineColor"];
                }

                if (options.dataViews[0].metadata.objects["Statistics"]) {
                    var statistics = options.dataViews[0].metadata.objects["Statistics"];
                    if (statistics.showAs !== undefined) this.showAs = statistics["showAs"];
                    if (statistics.showMean !== undefined) this.showMean = statistics["showMean"];
                    if (statistics.showMedian !== undefined) this.showMedian = statistics["showMedian"];
                    if (statistics.showMode !== undefined) this.showMode = statistics["showMode"];
                    if (statistics.regressionLine !== undefined) this.regressionLine = statistics["regressionLine"];
                    if (statistics.regressionLineType !== undefined) this.regressionLineType = statistics["regressionLineType"];
                    if (statistics.regressionCurveType !== undefined) this.regressionCurveType = statistics["regressionCurveType"];
                    if (statistics.exponentialSmoothingLine !== undefined) this.exponentialSmoothingLine = statistics["exponentialSmoothingLine"];
                    if (statistics.standardDeviation !== undefined) this.standardDeviation = statistics["standardDeviation"];
                    if (statistics.noOfStandardDeviation !== undefined) this.noOfStandardDeviation = statistics["noOfStandardDeviation"];

                }
                if (options.dataViews[0].metadata.objects["ConstantLine"]) {
                   
                }


            }
        }

        private findAvailableMetadata(metadata) {
            this.hasBar = false;
            this.hasArea = false;
            this.hasLine = false;
            this.hasDot = false;
            this.hasColor = false;
            this.hasAxis = false;

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
                if (d.roles["bar"]) {
                    this.hasBar = true;
                    this.barFormat = d.format;
                }
                if (d.roles["area"]) {
                    this.hasArea = true;
                    this.areaFormat = d.format;
                }
                if (d.roles["line"]) {
                    this.hasLine = true;
                    this.lineFormat = d.format;
                }
                if (d.roles["dot"]) {
                    this.hasDot = true;
                    this.dotFormat = d.format;
                }
            });
        }

        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;
            let yRightOff = 0;

            if (this.legendPosition == "right") ylegendOffset = d3.max(data.legend.map(d => d.width)) + (4 * this.legendFontSize);
            if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = this.legendFontSize * 3;

            let xdata = data.xAxis;
            let xDomain = d3.scale.ordinal().domain(xdata).domain();

            let yOff = this.getYOffset(data);
            yRightOff = this.getYRightOffset(data);

            let xT: any = this.axisLabelArray(xDomain.slice(0), (vp.width - yOff - ylegendOffset), this.element, "vertical");

            let xOffset, yOffset, chartWidth, chartHeight, xFilter, xTickval;

            xOffset = xT.Space + 20;
            if (xOffset > vp.height / 4) xOffset = vp.height / 4 > 100 ? 100 : vp.height / 4;
            yOffset = yOff;
            chartWidth = vp.width - yOffset - ylegendOffset - yRightOff;
            chartHeight = vp.height - xOffset - xlegendOffset;
            xFilter = (xT.Rotate === true) ? (chartWidth / xDomain.length < 12 ? (Math.ceil(xDomain.length / chartWidth * 20)) : 1) : 1;
            xTickval = xDomain.filter((d, i) => (i % xFilter === 0));

            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                yRightOff: yRightOff,
                chartWidth: chartWidth,
                chartHeight: chartHeight,
                xRotate: xT.Rotate,
                xTickval: xTickval,
            }
        }

        private setXScale(data, dimension) {
            var scale = d3.scale.ordinal()
                .rangeBands([0, dimension.chartWidth], .05)
                .domain(data.xAxis);

            return scale;
        }

        private setYScale(data, dimension) {
            let yDomain = data.leftAxis.data;

            let valueDomain = this.setValueDomain(d3.min(yDomain), d3.max(yDomain), this.leftAxisMinValue);

            let scale = d3.scale.linear()
                .range([dimension.chartHeight, 0])
                .domain([valueDomain.Min, valueDomain.Max]);


            return scale;
        }

        private setRightYScale(data, dimension) {
            let yDomain = data.rightAxis.data;

            let valueDomain = this.setValueDomain(d3.min(yDomain), d3.max(yDomain),this.rightAxisMinValue);

            let scale = d3.scale.linear()
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

            xAxisG.selectAll("text").text(d => {
                if (this.getTextWidth(chartSvg, d, this.fontSize) > dimension.xOffset - this.fontSize && dimension.xRotate == true) return (d.substring(0, Math.floor(dimension.xOffset / (this.fontSize / 2))) + "..");
                else return d;
            })
                .attr("fill", "rgb(119, 119, 119)")
                .append("title")
                .text(d => d);

            if (dimension.xRotate == true) {
                xAxisG.attr("text-anchor", "start");


                xAxisG.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", -7)
                    .attr("dy", 0)
                    .attr("transform", function (d) {
                        return "rotate(" + (-55) + ")";
                    });
            }

            xAxisG.selectAll("text").attr("fill", "rgb(119, 119, 119)");

        }

        private drawYScale(yScale, chartSvg, dimension, data) {
            if (data.leftAxis.data.length === 0) return;
            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(5)
                .tickFormat(data.leftAxis.format.format);

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", "translate(" + (dimension.yOffset) + "," + (0) + ")")
                .attr("class", "axis")
                .call(yaxis);

            yAxisG.selectAll("text").attr("fill", "rgb(119, 119, 119)");
        }

        private drawRightYScale(yScale, chartSvg, dimension, data) {
            if (data.rightAxis.data.length === 0) return;
            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("right")
                .ticks(5)
                .tickFormat(data.rightAxis.format.format);

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", "translate(" + (dimension.yOffset + dimension.chartWidth) + "," + (0) + ")")
                .attr("class", "axis")
                .call(yaxis);

            yAxisG.selectAll("text").attr("fill", "rgb(119, 119, 119)");
        }

        private drawBarChart(xScale, yScale, yRightScale, chartSvg, data, dimension) {
            if (this.hasBar) {

                var scale = this.barAxis === "left" ? yScale : yRightScale;

                if (this.barGroupType === "group") {

                    var barG = chartSvg.selectAll(".BarG")
                        .data(data)
                        .enter()
                        .append("g");

                    var x1 = d3.scale.ordinal()
                        .domain(data.map(d => d.key))
                        .rangeBands([0, xScale.rangeBand()], .05);

                    barG.attr("transform", d => "translate(" + (dimension.yOffset + x1(d.key)) + ",0)");

                    barG.selectAll("rect")
                        .data(d => d.values)
                        .enter()
                        .append("rect")
                        .attr("width", x1.rangeBand())
                        .attr("x", d => xScale(d.xValue.value))
                        .attr("y", d => {
                            return d.y < 0 ? scale(0) : scale(d.y);
                        })
                        .attr("fill", d => d.color)
                        .attr("height", d => {
                            return d.y < 0 ? (scale(d.y) - scale(0)) : (scale(0) - scale(d.y));
                        });
                }

                else if (this.barGroupType === "stacked") {

                    var barG = chartSvg.selectAll(".BarG")
                        .data(data)
                        .enter()
                        .append("g");

                    barG.attr("transform", d => "translate(" + (dimension.yOffset) + ",0)");

                    barG.selectAll("rect")
                        .data(d => d.values)
                        .enter()
                        .append("rect")
                        .attr("width", xScale.rangeBand())
                        .attr("x", d => xScale(d.xValue.value))
                        .attr("y", d => {
                            return d.y < 0 ? scale(d.y0) : scale(d.y0 + d.y);
                        })
                        .attr("fill", d => d.color)
                        .attr("height", d => {
                            return d.y < 0 ? (scale(d.y) - scale(0)) : (scale(0) - scale(d.y));
                        });
                }
                // else if (this.barGroupType === "stacked100") {

                //     var barG = chartSvg.selectAll(".BarG")
                //         .data(data)
                //         .enter()
                //         .append("g");

                //     barG.attr("transform", d => "translate(" + (dimension.yOffset) + ",0)");

                //     barG.selectAll("rect")
                //         .data(d => d.values)
                //         .enter()
                //         .append("rect")
                //         .attr("width", x1.rangeBand())
                //         .attr("x", d => xScale(d.xValue.value))
                //         .attr("y", d => scale(0) - scale(d.y))
                //         .attr("fill", d => d.color)
                //         .attr("height", d => scale(d.y));
                // }

            }

        }

        private drawAreaChart(xScale, yScale, yRightScale, chartSvg, data, dimension) {
            if (this.hasArea) {

                var scale = this.areaAxis === "left" ? yScale : yRightScale;

                var areaG = chartSvg.selectAll(".AreaG")
                    .data(data)
                    .enter()
                    .append("g")
                    .attr("transform", "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)");

                var linePath = d3.svg.line()
                    .x((d: any) => xScale(d.xValue.value))
                    .y((d: any) => scale(d.yValue.value));

                var areaPath = d3.svg.area()
                    .x((d: any) => xScale(d.xValue.value))
                    .y0(scale(0))
                    .y1((d: any) => scale(d.yValue.value));

                areaG.append("path")
                    .attr("fill", d => d.color)
                    .attr("fill-opacity", ".1")
                    .attr("d", d => areaPath(d.values));

                areaG.append("path")
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", d => d.color)
                    .attr("d", d => linePath(d.values));

                if (this.showAreaDots) {
                    var circle = areaG.selectAll(".dots")
                        .data(d => d.values.filter(d => d.yValue.value !== null))
                        .enter()
                        .append("circle");

                    circle
                        .attr("cx", d => xScale(d.xValue.value))
                        .attr("cy", d => scale(d.yValue.value))
                        .attr("r", this.areaDotRadius)
                        .attr("fill", d => d.color);

                    circle.on("click", (d, i) => {
                        d.isFiltered = !d.isFiltered;

                        this.selectionManager.select(d.selectionId, true);

                        this.setFilterOpacity(circle);
                        (<Event>d3.event).stopPropagation();
                    });

                    this.tooltipServiceWrapper.addTooltip(circle,
                        (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                        (tooltipEvent: TooltipEventArgs<any>) => null
                    );
                }

                if (this.showAreaLabel) {
                    var text = areaG.selectAll(".areaText")
                        .data(d => d.values.filter(d => d.yValue.value !== null))
                        .enter()
                        .append("text")
                        .text(d => d.yValue.caption)

                    text.attr("x", d => xScale(d.xValue.value) + 2)
                        .attr("dx", this.areaDotRadius)
                        .attr("dy", this.areaDotRadius / 2)
                        .attr("y", d => scale(d.yValue.value))

                }

            }

        }

        private drawLineChart(xScale, yScale, yRightScale, chartSvg, data, dimension) {
            if (this.hasLine) {

                var scale = this.lineAxis === "left" ? yScale : yRightScale;

                var lineG = chartSvg.selectAll(".lineG")
                    .data(data)
                    .enter()
                    .append("g")
                    .attr("transform", "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)");

                var linePath = d3.svg.line()
                    .x((d: any) => xScale(d.xValue.value))
                    .y((d: any) => scale(d.yValue.value));

                lineG.append("path")
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", d => d.color)
                    .attr("d", d => linePath(d.values));

                if (this.showLineDots) {
                    var circle = lineG.selectAll(".dots")
                        .data(d => d.values.filter(d => d.yValue.value !== null))
                        .enter()
                        .append("circle");

                    circle
                        .attr("cx", d => xScale(d.xValue.value))
                        .attr("cy", d => scale(d.yValue.value))
                        .attr("r", this.lineDotRadius)
                        .attr("fill", d => d.color);

                    circle.on("click", (d, i) => {
                        d.isFiltered = !d.isFiltered;

                        this.selectionManager.select(d.selectionId, true);

                        this.setFilterOpacity(circle);
                        (<Event>d3.event).stopPropagation();
                    });

                    this.tooltipServiceWrapper.addTooltip(circle,
                        (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                        (tooltipEvent: TooltipEventArgs<any>) => null
                    );
                }

                if (this.showLineLabel) {
                    var text = lineG.selectAll(".dotText")
                        .data(d => d.values.filter(d => d.yValue.value !== null))
                        .enter()
                        .append("text")
                        .text(d => d.yValue.caption)

                    text.attr("x", d => xScale(d.xValue.value) + 2)
                        .attr("dx", this.lineDotRadius)
                        .attr("dy", this.lineDotRadius / 2)
                        .attr("y", d => scale(d.yValue.value))


                }

            }

        }

        private drawDotChart(xScale, yScale, yRightScale, chartSvg, data, dimension) {
            if (this.hasDot) {

                var scale = this.dotAxis === "left" ? yScale : yRightScale;

                var circleG = chartSvg.selectAll(".dots")
                    .data(data)
                    .enter()
                    .append("g")

                var circle = circleG.selectAll(".dots")
                    .data(d => d.values.filter(d => d.yValue.value !== null))
                    .enter()
                    .append("circle");


                circleG.attr("transform", "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)");

                circle
                    .attr("cx", d => xScale(d.xValue.value))
                    .attr("cy", d => scale(d.yValue.value))


                circle
                    .attr("r", this.dotRadius)
                    .attr("fill", d => d.color)
                    .style("stroke", d => d.color)
                    .style("stroke-width", this.circlestroke + "px")
                    .style("fill-opacity", this.circleOpacity / 100);


                circle.on("click", (d, i) => {
                    d.isFiltered = !d.isFiltered;

                    this.selectionManager.select(d.selectionId, true);

                    this.setFilterOpacity(circle);
                    (<Event>d3.event).stopPropagation();
                });

                if (this.showDotLabel) {
                    var text = circleG.selectAll(".dotText")
                        .data(d => d.values.filter(d => d.yValue.value !== null))
                        .enter()
                        .append("text");

                    text.text(d => d.yValue.caption)

                    text.attr("x", d => xScale(d.xValue.value) + 2)
                        .attr("dx", this.dotRadius)
                        .attr("dy", this.dotRadius / 2)
                        .attr("y", d => scale(d.yValue.value))

                    this.tooltipServiceWrapper.addTooltip(circle,
                        (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                        (tooltipEvent: TooltipEventArgs<any>) => null
                    );
                }
            }

        }

        private drawLeftConstantLine(scale, chartSvg, data, dimension) {
            if (this.leftConstantLineValue.length > 0 && data.leftAxis.data.length > 0) {
                var constLine = this.leftConstantLineValue;

                chartSvg.append("line")
                    .attr("x1", dimension.yOffset)
                    .attr("x2", dimension.yOffset + dimension.chartWidth)
                    .attr("y1", scale(constLine))
                    .attr("y2", scale(constLine))
                    .style("stroke", this.leftConstantLineColor.solid.color)
                    .style("stroke-width", this.leftConstantLineStrokeWidth + "px");
            }
        }

        private drawRightConstantLine(scale, chartSvg, data, dimension) {
            if (this.rightConstantLineValue.length > 0 && data.rightAxis.data.length > 0) {
                var constLine = this.rightConstantLineValue;

                chartSvg.append("line")
                    .attr("x1", dimension.yOffset)
                    .attr("x2", dimension.yOffset + dimension.chartWidth)
                    .attr("y1", scale(constLine))
                    .attr("y2", scale(constLine))
                    .style("stroke", this.rightConstantLineColor.solid.color)
                    .style("stroke-width", this.rightConstantLineStrokeWidth + "px");
            }
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
                chartLegend.attr("transform", "translate(" + (dimension.chartWidth + dimension.yOffset + dimension.yRightOff + (this.legendFontSize * 2)) + "," + (5) + ")");
            }
            if (this.legendPosition == "top") {
                chartSvg.attr("transform", "translate(0," + this.legendFontSize * 3 + ")");
                chartLegend.attr("transform", "translate(" + (10 + dimension.yOffset) + "," + this.legendFontSize + ")");
            }
            if (this.legendPosition == "bottom") {
                chartLegend.attr("transform", "translate(" + (10 + dimension.yOffset) + "," + (dimension.chartHeight + dimension.xOffset + (this.legendFontSize * 2)) + ")");
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
                    width: this.getTextWidth(svg, d.key, this.legendFontSize) + 20,
                    color: d.color,
                    text: d.key
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

                var tspan: any = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');

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

            if (alignment !== undefined) {
                var textAnchor = alignment === "Right" ? "end" : "start";
                if (alignment === "middle") textAnchor = "middle";
                text.selectAll("tspan").attr("text-anchor", textAnchor).attr("dx", text.attr('dx'));
            }

        }

        private setFontSize(chartSvg) {

            chartSvg.selectAll("text").style("font-size", this.fontSize + "px");
        }

        private getValueFormat(val, max) {

            let valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
            let iValueFormatter = valueFormatter.create({});
            let valF = null;
            switch (this.leftValFormat) {
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
                    return { format: d3.format(",." + this.leftValPrecision + "f") }
            }

            iValueFormatter = valueFormatter.create({ format: val, value: valF, precision: this.leftValPrecision });

            return iValueFormatter;
        }

        private getYOffset(data) {
            if (data.leftAxis.data.length === 0) return 0;
            let max = d3.max(data.leftAxis.data);
            return 2 + (data.leftAxis.format.format(max).length + 1) * this.fontSize / 1.5;
        }

        private getYRightOffset(data) {
            if (data.rightAxis.data.length === 0) return 0;
            let max = d3.max(data.rightAxis.data);

            return 2 + (data.rightAxis.format.format(max).length + 1) * this.fontSize / 1.5;
        }

        private setValueDomain = function (Min, Max, minTrue) {
            var domain: any = {};

            if (Min > 0) {
                domain.Min = 0;
                domain.Max = Max + ((Max * 15) / 100);
                domain.OMin = 0;
                domain.OMax = Max;
            }
            else if (Max < 0) {
                domain.Max = 0;
                domain.Min = Min + ((Min * 15) / 100);
                domain.OMax = 0;
                domain.OMin = Min;
            }
            else {
                domain.Min = Min > 0 ? Min - ((Min * 10) / 100) : Min + ((Min * 10) / 100);
                domain.Max = Max + ((Max * 15) / 100);
                domain.OMin = Min;
                domain.OMax = Max;
            }

            if (minTrue == true) {
                domain.Min = Min > 0 ? Min - ((Min * 10) / 100) : Min + ((Min * 10) / 100);
                domain.Max = Max + ((Max * 10) / 100);
            }

            return domain;
        };

        private setUpAnalyticData(data) {
            var retData;
            var cdata = JSON.parse(JSON.stringify(data));
            switch (this.showAs) {

                case "runningTotal":
                    retData = cdata.map(function (d) {
                        var cumulative = 0;
                        d.values.map(function (d) {
                            if (d.yValue.value !== null) {
                                d.ShowingAs = "Running Total";
                                cumulative += d.yValue.value;
                                d.yValue.value = cumulative;
                            }
                        });
                        return d;
                    });
                    break;

                case "difference":
                    var current, previous;
                    retData = cdata.map(d => {
                        previous = 0;
                        d.values.map(function (d, i) {
                            if (d.yValue.value !== null) {
                                current = d.yValue.value;
                                if (i !== 0) d.yValue.value = current - previous;
                                else d.yValue.value = 0;
                                previous = current;
                            }
                        });
                        return d;
                    });

                    break;

                case "perDifference":
                    var previous;
                    retData = cdata.map(d => {
                        previous = 0;
                        d.values.map(d => {
                            if (d.yValue.value !== null) {
                                current = d.yValue.value;
                                if (previous !== 0) d.yValue.value = (current - previous) / previous;
                                else d.yValue.value = 0;
                                previous = current;
                            }
                        });
                        return d;
                    });

                    break;

                case "differenceFromAverage":
                    var average;
                    retData = cdata.map(function (d) {
                        average = d3.sum(d.values.map(function (d) { return d.yValue.value; })) / d.values.length;
                        d.AnalyticValue = average;
                        d.values.map(function (d, i) {
                            if (d.yValue.value !== null) {
                                d.yValue.value = d.yValue.value - average / average;
                            }
                        });
                        return d;
                    });
                    break;

                case "perDifferenceFromAverage":
                    var average;
                    retData = cdata.map(function (d) {
                        average = d3.sum(d.values.map(function (d) { return d.yValue.value; })) / d.values.length;
                        d.AnalyticValue = average;
                        d.values.map(function (d) {
                            if (d.yValue.value !== null) {
                                d.yValue.value = d.yValue.value - average / average;
                            }
                        });
                        return d;
                    });

                    break;

                case "perAxisValue":
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

                case "perTotal":
                    retData = cdata.map(function (d) {
                        var total = d3.sum(d.values.map(function (d) { return d.yValue.value; }));
                        d.values.map(function (d, i) {
                            if (d.yValue.value !== null) d.yValue.value = (d.yValue.value / total);
                        });
                        return d;
                    });
                    break;

                case "perGrandTotal":

                    var grandTotal = d3.sum(data.map(function (d) { return d3.sum(d.values.map(d => d.yValue.value)) }));

                    retData = cdata.map(function (d) {
                        d.AnalyticValue = grandTotal;
                        d.values.map(function (d, i) {
                            if (d.yValue.value !== null) d.yValue.value = (d.yValue.value / grandTotal);
                        });
                        return d;
                    });

                    break;

                case "movingAverage":
                    var previous: any = 0, secondprevious = 0;
                    retData = cdata.map(function (d) {
                        d.values.map(function (d) {
                            if (d.yValue.value !== null) {
                                d.yValue.value = (d.yValue.value + previous + secondprevious) / 3;
                                secondprevious = previous;
                                previous = d.yValue.value;
                            }
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

        private drawStastics(xScale, yScale, chartSvg, data, dimension) {

            let statData = [];;

            if (this.showMean === true) {
                let mean = d3.mean(data.yAxis);
                statData.push({
                    title: 'Mean:' + data.yFormat(mean),
                    x: dimension.yOffset,
                    y: yScale(mean),
                    dx: dimension.chartWidth - 5,
                    dy: -5,
                    color: "#ff6f69",
                    width: dimension.chartWidth,
                    height: 2,
                })
            }

            if (this.showMedian === true) {
                let median = d3.median(data.yAxis);
                statData.push({
                    title: 'Median:' + data.yFormat(median),
                    x: dimension.yOffset,
                    y: yScale(median),
                    dx: dimension.chartWidth - 5,
                    dy: -5,
                    color: "#010c0e",
                    width: dimension.chartWidth,
                    height: 2,
                })
            }

            if (this.showMode === true) {
                let mode = data.yAxis[Math.ceil(data.yAxis.length / 2)];
                statData.push({
                    title: 'Mode:' + data.yFormat(mode),
                    x: dimension.yOffset,
                    y: yScale(mode),
                    dx: dimension.chartWidth - 5,
                    dy: -5,
                    color: "#74002f",
                    width: dimension.chartWidth,
                    height: 2,
                })
            }

            let statG = chartSvg.selectAll('.stat')
                .data(statData)
                .enter()
                .append("g");

            statG.append("rect")
                .style("fill", d => d.color)
                .attr("width", d => d.width)
                .attr("height", d => d.height)
                .attr("x", d => d.x)
                .attr("y", d => d.y);

            statG.append("text")
                .style("fill", d => d.color)
                .style("text-anchor", "end")
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .attr("dx", d => d.dx)
                .attr("dy", d => d.dy)
                .text(d => d.title);

            if (this.exponentialSmoothingLine === true) {
                data.data.map(d => {
                    this.drawExponentialSmoothing(d, xScale, yScale, chartSvg, dimension);
                });
            }

            if (this.regressionLine === true) {
                this.buildRegression(data.data, xScale, yScale, chartSvg, dimension)
            }
            if (this.standardDeviation === true) {
                this.drawStandardDeviation(data, xScale, yScale, chartSvg, dimension, data.yFormat);
            }
        }

        private buildRegression(data, xScale, yScale, chartSvg, dimension) {

            if (this.regressionCurveType === "linear") {
                var xLabels = xScale.domain();

                var xSeries = xLabels.map((d, i) => i);
                var ySeries = [];
                var multipleRegressionData = [];

                data.map(d => {
                    var regData = []
                    d.values.map(d => {
                        ySeries.push(d.yValue.value);
                        regData.push(d.yValue.value);
                    });

                    if (this.regressionLineType === "multiple" && this.hasColor) multipleRegressionData.push({ data: regData, color: d.color });

                });

                if (this.regressionLineType === "multiple" && this.hasColor) {
                    multipleRegressionData.map(d => {

                        var xSeries = d3.range(1, d.data.length + 1);
                        ySeries = d.data;

                        if (ySeries.length > 1) {
                            var regressionCoeff = this.getRegression(xSeries, ySeries);

                            var x1 = xLabels[0];
                            var y1 = regressionCoeff[0] + regressionCoeff[1];
                            var x2 = xLabels[xLabels.length - 1];
                            var y2 = regressionCoeff[0] * xSeries.length + regressionCoeff[1];

                            var x1 = xLabels[0];
                            var y1 = regressionCoeff[0] + regressionCoeff[1];
                            var x2 = xLabels[xLabels.length - 1];
                            var y2 = regressionCoeff[0] * xSeries.length + regressionCoeff[1];

                            var trendData = [[x1, y1, x2, y2]];

                            this.drawLinearRegression(trendData, d.color, xScale, yScale, chartSvg, dimension);
                        }

                    })
                }
                else {

                    var regressionCoeff = this.getRegression(xSeries, ySeries);

                    var x1 = xLabels[0];
                    var y1 = regressionCoeff[0] + regressionCoeff[1];
                    var x2 = xLabels[xLabels.length - 1];
                    var y2 = regressionCoeff[0] * xSeries.length + regressionCoeff[1];

                    var x1 = xLabels[0];
                    var y1 = regressionCoeff[0] + regressionCoeff[1];
                    var x2 = xLabels[xLabels.length - 1];
                    var y2 = regressionCoeff[0] * xSeries.length + regressionCoeff[1];

                    var trendData = [[x1, y1, x2, y2]];
                    var regressionLineColor = "#b4b6bd";

                    this.drawLinearRegression(trendData, regressionLineColor, xScale, yScale, chartSvg, dimension);

                }
            }
            else {
                data.map(d => {
                    this.drawExponentialRegression(d, xScale, yScale, chartSvg, dimension);
                });
            }


        }

        private drawLinearRegression(trendData, regressionLineColor, xScale, yScale, chartSvg, dimension) {

            let trendLine = chartSvg
                .selectAll(".trendline")
                .data(trendData)
                .enter()
                .append("line")
                .attr("class", "regression-line");

            trendLine
                .attr("x1", d => xScale(d[0]) + dimension.yOffset)
                .attr("y1", d => yScale(d[1]))
                .attr("x2", d => xScale(d[2]) + dimension.yOffset + (xScale.rangeBand()))
                .attr("y2", d => yScale(d[3]));


            trendLine.style("stroke", "#000")
                .style("stroke-width", 3)
                .style("stroke-dasharray", "3,3")

            if (this.regressionLineType === "multiple" && this.hasColor) {
                trendLine.style("stroke", regressionLineColor);
            }
        }

        private drawExponentialRegression(data, xScale, yScale, chartSvg, dimension) {

            var ySeries = this.getYSeries(data, xScale).ySeries;
            var xSeries = this.getYSeries(data, xScale).xSeries;

            var expExpRegressionLineData = this.getExponentialRegressionLine(ySeries, '').data;

            var expExpRegressionLine = d3.svg.line()
                .x((d, i) => { return xScale(xSeries[i]) + dimension.yOffset; })
                .y(d => yScale(d[1]))
                .interpolate('monotone');

            chartSvg.append("path")
                .attr("fill", "none")
                .style("stroke", data.color)
                .style("stroke-width", 3)
                .style("stroke-dasharray", "3,3")
                .attr("class", "ExponentialRegressionLine")
                .attr("d", expExpRegressionLine(expExpRegressionLineData));
        }

        private drawExponentialSmoothing(data, xScale, yScale, chartSvg, dimension) {

            var ySeries = this.getYSeries(data, xScale).ySeries;
            var xSeries = this.getYSeries(data, xScale).xSeries;
            var expExpSmoothLine;
            var expExpSmoothLineData = this.getExponentialSmoothingLine(ySeries, ySeries.length);

            expExpSmoothLine = d3.svg.line()
                .x((d, i) => xScale(xSeries[i]) + dimension.yOffset)
                .y(d => yScale(d))
                .interpolate('monotone');

            chartSvg.append("path")
                .attr("fill", "none")
                .style("stroke", data.color)
                .style("stroke-width", 3)
                .style("stroke-dasharray", "3,3")
                .attr("class", "ExponentialSmoothingLine")
                .attr("d", expExpSmoothLine(expExpSmoothLineData.slice(0, -1)));
        }

        private getYSeries(data, xScale) {
            var ySeries = [];
            var xSeries = [];

            data.values.map(function (d) {
                ySeries.push(d.yValue.value);
                xSeries.push(d.xValue.value);
            });
            return { ySeries: ySeries, xSeries: xSeries };
        }

        private getExponentialRegressionLine = function (data, type) {
            function regression(x, y) {

                var N = x.length;
                var slope;
                var intercept;
                var SX = 0;
                var SY = 0;
                var SXX = 0;
                var SXY = 0;
                var SYY = 0;
                var Y = [];
                var X = [];


                for (var i = 0; i < y.length; i++) {
                    if (y[i] <= 0) {
                        N--;
                    }
                    else {
                        X.push(x[i]);
                        Y.push(Math.log(y[i]));
                    }
                }


                for (var i = 0; i < N; i++) {
                    SX = SX + X[i];
                    SY = SY + Y[i];
                    SXY = SXY + X[i] * Y[i];
                    SXX = SXX + X[i] * X[i];
                    SYY = SYY + Y[i] * Y[i];
                }

                slope = (N * SXY - SX * SY) / (N * SXX - SX * SX);
                intercept = (SY - slope * SX) / N;

                return [slope, intercept];
            }

            function expRegression(X, Y) {
                var ret;
                var x = X;
                var y = Y;
                ret = regression(x, y);
                var base = Math.exp(ret[0]);
                var coeff = Math.exp(ret[1]);
                return [base, coeff];
            }


            var ret;
            var res;
            var x = [];
            var y = [];
            var ypred = [];

            if (type === "scatter") {
                for (i = 0; i < data.length; i++) {
                    x.push(data[i][0]);
                    y.push(data[i][1]);
                }
            }
            else {
                for (i = 0; i < data.length; i++) {
                    x.push(i);
                    y.push(data[i]);
                }
            }


            ret = expRegression(x, y);
            for (var i = 0; i < x.length; i++) {
                res = ret[1] * Math.pow(ret[0], x[i]);
                ypred.push([x[i], res]);
            }

            return {
                data: ypred,
                slope: ret[0],
                intercept: ret[1]
            };
        };

        private getExponentialSmoothingLine = function (data, n) {
            var alpha = 0.5;
            var beta = 0.5;
            var n = n || 32;
            var forecasts = [data[0]];
            var i: any;
            for (i = 1; i <= data.length; i++) {
                var oldf = forecasts[i - 1];
                forecasts.push(oldf + alpha * (data[i - 1] - oldf));
            }

            for (i = data.length + 1; i < n; i++) {
                forecasts.push(forecasts[data.length]);
            }

            return forecasts;
        }

        private getRegression(xSeries, ySeries) {
            var reduceSumFunc = function (prev, cur) { return prev + cur; };

            var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
            var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

            var ssXX = xSeries.map(function (d) { return Math.pow(d - xBar, 2); })
                .reduce(reduceSumFunc);

            var ssYY = ySeries.map(function (d) { return Math.pow(d - yBar, 2); })
                .reduce(reduceSumFunc);

            var ssXY = xSeries.map(function (d, i) { return (d - xBar) * (ySeries[i] - yBar); })
                .reduce(reduceSumFunc);

            var slope = ssXY / ssXX;
            var intercept = yBar - (xBar * slope);
            var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

            return [slope, intercept, rSquare];
        }

        private drawStandardDeviation(data, xScale, yScale, chartSvg, dimension, format) {

            var valuesArray = [];
            data.data.map(d => {
                d.values.map(d => {
                    valuesArray.push(d.yValue.value);
                });
            });

            var mean = d3.mean(valuesArray);
            var sd = d3.deviation(valuesArray) !== undefined ? (d3.deviation(valuesArray) * parseInt(this.noOfStandardDeviation)) : 0;

            let stdDevG = chartSvg.append("g");

            let stdDevGMeanLine = stdDevG
                .append("rect")
                .attr("fill", "red");

            let stdDevGRect = stdDevG
                .append("rect")
                .attr("fill", "#b3b3b3")
                .attr("style", "stroke: #b3b3b3; stroke-width: .5;fill-opacity:.2")

            let stdDevGText = stdDevG.append("text").style("fill", "#000000");

            var upper = yScale(mean - sd) > yScale.range()[0] ? yScale.range()[0] : yScale(mean - sd);
            var lower = yScale(mean + sd) < yScale.range()[1] ? yScale.range()[1] : yScale(mean + sd);

            stdDevGMeanLine
                .attr("x", dimension.yOffset)
                .attr("width", dimension.chartWidth)
                .attr("height", 2)
                .attr("y", yScale(mean));

            stdDevGRect
                .attr("x", dimension.yOffset)
                .attr("width", dimension.chartWidth)
                .attr("y", lower)
                .attr("height", upper - lower)

            stdDevGText
                .attr("y", yScale(mean) - 5)
                .append("tspan")
                .attr("x", dimension.yOffset + 5)
                .text("Std dev: " + format(sd));

            stdDevGText.append("tspan")
                .attr("text-anchor", "end")
                .attr("x", dimension.chartWidth + dimension.yOffset - 5)
                .text("Mean + Std dev: " + format(mean + sd));

            stdDevGText.append("tspan")
                .attr("x", dimension.yOffset + 5)
                .attr("dy", 20)
                .text("Mean: " + format(mean));

            stdDevGText.append("tspan")
                .attr("x", dimension.chartWidth + dimension.yOffset - 5)
                .attr("text-anchor", "end")
                .text("Mean - Std dev: " + format(mean - sd));
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'Basic':
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    break;

                case 'Bar':
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showBarLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { axis: this.barAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { barGroupType: this.barGroupType }, selector: null });

                    break;

                case 'Area':
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showAreaLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { axis: this.areaAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showAreaDots: this.showAreaDots }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { areaDotRadius: this.areaDotRadius }, selector: null });

                    break;

                case 'Line':
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLineLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { axis: this.lineAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLineDots: this.showLineDots }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { lineDotRadius: this.lineDotRadius }, selector: null });

                    break;

                case 'Dot':
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showDotLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { axis: this.dotAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { dotRadius: this.dotRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleOpacity: this.circleOpacity }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circlestroke: this.circleOpacity }, selector: null });

                    break;

                case 'colorSelector':
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
                    break;


                case 'Legend':

                    objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                    if (this.hasColor) objectEnumeration.push({ objectName: objectName, properties: { legendName: this.legendName }, selector: null });
                    //objectEnumeration.push({ objectName: objectName, properties: { legendColor: this.legendColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.legendFontSize }, selector: null });
                    break;

                case 'leftAxis':

                    objectEnumeration.push({ objectName: objectName, properties: { leftAxisMinValue: this.leftAxisMinValue }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { leftValFormat: this.leftValFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { leftValPrecision: this.leftValPrecision }, selector: null });

                    objectEnumeration.push({ objectName: objectName, properties: { constantLineValue: this.leftConstantLineValue }, selector: null });
                    if (this.leftConstantLineValue.length > 0) {
                        objectEnumeration.push({ objectName: objectName, properties: { constantLineStrokeWidth: this.leftConstantLineStrokeWidth }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { constantLineColor: this.leftConstantLineColor }, selector: null });
                    }

                    break;

                case 'rightAxis':

                    objectEnumeration.push({ objectName: objectName, properties: { rightAxisMinValue: this.rightAxisMinValue }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { rightValFormat: this.rightValFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { rightValPrecision: this.rightValPrecision }, selector: null });

                    objectEnumeration.push({ objectName: objectName, properties: { constantLineValue: this.rightConstantLineValue }, selector: null });
                    if (this.rightConstantLineValue.length > 0) {
                        objectEnumeration.push({ objectName: objectName, properties: { constantLineStrokeWidth: this.rightConstantLineStrokeWidth }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { constantLineColor: this.rightConstantLineColor }, selector: null });
                    }

                    break;

                case 'Statistics':
                    objectEnumeration.push({ objectName: objectName, properties: { showAs: this.showAs }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showMean: this.showMean }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showMedian: this.showMedian }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showMode: this.showMode }, selector: null });

                    objectEnumeration.push({ objectName: objectName, properties: { regressionLine: this.regressionLine }, selector: null });
                    if (this.regressionLine === true) {
                        objectEnumeration.push({ objectName: objectName, properties: { regressionCurveType: this.regressionCurveType }, selector: null });
                        if (this.regressionCurveType == 'linear') objectEnumeration.push({ objectName: objectName, properties: { regressionLineType: this.regressionLineType }, selector: null });

                    }
                    objectEnumeration.push({ objectName: objectName, properties: { exponentialSmoothingLine: this.exponentialSmoothingLine }, selector: null });

                    objectEnumeration.push({ objectName: objectName, properties: { standardDeviation: this.standardDeviation }, selector: null });
                    if (this.standardDeviation == true) objectEnumeration.push({ objectName: objectName, properties: { noOfStandardDeviation: this.noOfStandardDeviation }, selector: null });
                    break;


            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}