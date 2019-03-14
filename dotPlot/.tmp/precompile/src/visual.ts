
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


module powerbi.extensibility.visual.dotPlotD9885417F9AAF5BB8D45B007E  {
    "use strict";

    export class Visual implements IVisual {

        private host: IVisualHost;

        private selectionManager: ISelectionManager;

        //private settings: VisualSettings;

        private columns: any;
        private dimension: any

        private hasAxis: any = false;
        private hasColor: any = false;
        private hasValue: any = false;
        private hasSize: any = false;
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
        private axisFormat: any;
        private colorFormat: any;
        private circles: any;
        private colorScale: any;
        private iValueFormatter: any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;
        private valFormat: any = 'default';
        private valPrecision: any = 0;

        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;

        private yAxisMinValue: boolean = false;;
        private legendColor: any = 'Category1';
        private colorPalette: any;
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

        private connectDots: any = false;
        private connectDotsBy: any = 'color';
        private dumbbellSort: any = 'default';

        private dotRadius: any = 6;
        private circleOpacity: any = 100;
        private circlestroke: any = 1;

        private orientation: any = "vertical";
        private fontSize: any = 11;
        private legendFontSize: any = 10;

        private constantLineValue: any = '';
        private constantLineStrokeWidth:any = 1;
        private constantLineColor:any = { solid: { color: "#000000" } };

        private dumbbellLineStroke: any= 1;
      

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            this.element.style("overflow", "hidden");
            this.element.select('.dotPlot').remove();

            this.colorPalette.reset();

            this.draw(options);
        }

        public draw(options) {

            this.findAvailableMetadata(options.dataViews[0].metadata.columns);
            var chartContainer = this.element
                .append("div")
                .attr("class", "dotPlot")
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
                    this.circles.style("opacity", (d: any) => {
                        d.isFiltered = false;
                        return 1;
                    });
                });

            var chartSvg = chart.append("g")

            chartSvg.attr("transform", "translate(0," + 5 + ")");
           
            var chartLegend = chart.append("g")
            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);
           
            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension, data);
           
            this.drawDumbellLines(data, chartSvg, dimension, xScale, yScale);
            this.drawCircles(xScale, yScale, chartSvg, data, dimension);
           
            this.drawConstantLine(yScale, chartSvg, data, dimension);
           
            this.drawLegend(chartLegend, chartSvg, dimension, data);
           
            this.setFontSize(chartSvg);
            this.drawStastics(xScale, yScale, chartSvg, data, dimension);
          
        }

        public formatData(rawData) {
            var metadata = rawData.metadata.columns;
            this.colorScale = d3.scale.ordinal().range(this.colorOptions[this.legendColor]);

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

                if (this.hasSize == true) {
                    var sizeMetadata = rawData.categorical.values.filter(d => d.source.roles.size)[0];

                    var sizeG = sizeMetadata.values;

                    var sizeFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: sizeMetadata.source.format });

                    var sizeV = rawData.categorical.values.filter(d => d.source.roles.size);

                }

                if (this.hasColor) {

                    var valuesMetadata = metadata.filter(d => d.roles["values"])[0].displayName;
                    var filteredValues = valuesG.filter(d => d.source.displayName == valuesMetadata);

                    if (this.colorFormat !== undefined) {
                        var colorFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: this.colorFormat });
                    }

                    formattedData = filteredValues.map((d, i) => {
                        valFormat = this.getValueFormat(d.source.format, d3.max(d.values.map(d => d)));

                        let color: any = this.colorPalette.getColor(d.source.groupName).value;

                        if (grouped[i].objects) color = grouped[i].objects.colorSelector.fill.solid.color;

                        return {
                            key: this.colorFormat !== undefined ? colorFormat.format(d.source.groupName) : d.source.groupName,
                            iden: this.host.createSelectionIdBuilder().withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                            color: color,
                            values: d.values.map((t, j) => {

                                if (this.hasSize) if (sizeV[i].values[j] !== null) sizeValues.push(sizeV[i].values[j]);
                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.groupName,
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                                    color: color,
                                    colorValue: { title: this.colorTitle, caption: d.source.groupName },
                                    size: this.hasSize ? { title: sizeMetadata.source.displayName, value: sizeV[i].values[j], caption: sizeFormat.format(sizeV[i].values[j]) } : null
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
                                if (this.hasSize) sizeValues.push(sizeG[j]);
                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.displayName,
                                    color: color,
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], j).createSelectionId(),
                                    size: this.hasSize ? { title: sizeMetadata.source.displayName, value: sizeG[j], caption: sizeFormat.format(sizeG[j]) } : null
                                }
                            })
                        }
                    })

                }
            }
            let legendD = formattedData.map(d => { return { key: d.key, color: d.color } });
            let nm = (this.legendName !== undefined) ? this.legendName.length > 0 ? this.legendName : this.colorTitle : this.colorTitle;
            if (this.hasColor) legendD.unshift({ key: nm, color: "transparent" });

            var legend = this.setLegendWidth(this.element, legendD);

            var retData = this.setUpAnalyticData(formattedData)
            var yAxis = [];

            retData.map(d => {
                d.values.map(d => {
                    yAxis.push(d.yValue.value);
                })
            });

            if (this.showAs == "perDifference"
                //|| this.showAs == "perDifferenceFromAverage"
                || this.showAs == "perTotal"
                || this.showAs == "perGrandTotal"
                || this.showAs == "perAxisValue"
            ) valFormat = powerbi.extensibility.utils.formatting.valueFormatter.create({ format: "0.00 %;-0.00 %;0.00 %" });

            var dumbellData: any = []

            if (this.connectDots == true) {
                if (this.connectDotsBy == 'axis') {

                    xAxis.map((d, i) => {
                        var t = { key: d, sortValue: 0, values: [] };

                        retData.map(g => {
                            t.values.push({
                                xValue: d,
                                yValue: g.values[i].yValue.value,
                            })
                        });
                        t.sortValue = Math.abs(t.values[0].yValue - t.values[t.values.length - 1].yValue);
                        dumbellData.push(t);
                    });

                    if (this.dumbbellSort == "ascending") {
                        dumbellData.sort((a, b) => a.sortValue - b.sortValue);
                        xAxis = dumbellData.map(d => d.key);
                    }
                    else if (this.dumbbellSort == "descending") {
                        dumbellData.sort((a, b) => b.sortValue - a.sortValue);
                        xAxis = dumbellData.map(d => d.key);
                    }

                }
                else {
                    dumbellData = retData;
                }




            }
            this.formattedData = retData;

            return { xAxis: xAxis, yAxis: yAxis, yFormat: valFormat.format, data: retData, legend: legend, sizeValues: sizeValues, dumbellData: dumbellData }
        }

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.dotRadius !== undefined) this.dotRadius = basic["dotRadius"];
                    if (basic.circlestroke !== undefined) this.circlestroke = basic["circlestroke"];
                    if (basic.circleOpacity !== undefined) this.circleOpacity = basic["circleOpacity"];
                    if (basic.showLabel !== undefined) this.showLabel = basic["showLabel"];
                    if (basic.connectDots !== undefined) this.connectDots = basic["connectDots"];
                    if (basic.connectDotsBy !== undefined) this.connectDotsBy = basic["connectDotsBy"];
                    if (basic.orientation !== undefined) this.orientation = basic["orientation"];
                    if (basic.valFormat !== undefined) this.valFormat = basic["valFormat"];
                    if (basic.valPrecision !== undefined) this.valPrecision = basic["valPrecision"];
                

                }
                if (options.dataViews[0].metadata.objects["Dumbbell"]) {
                    var dumbbell = options.dataViews[0].metadata.objects["Dumbbell"];
                    if (dumbbell.connectDots !== undefined) this.connectDots = dumbbell["connectDots"];
                    if (dumbbell.connectDotsBy !== undefined) this.connectDotsBy = dumbbell["connectDotsBy"];
                    if (dumbbell.dumbbellSort !== undefined) this.dumbbellSort = dumbbell["dumbbellSort"];
                    if (dumbbell.dumbbellLineStroke !== undefined) this.dumbbellLineStroke = dumbbell["dumbbellLineStroke"];
                    
                }


                if (options.dataViews[0].metadata.objects["Legend"]) {
                    var legend = options.dataViews[0].metadata.objects["Legend"];
                    if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
                    if (legend.legendColor !== undefined) this.legendColor = legend["legendColor"];
                    if (legend.fontSize !== undefined) this.legendFontSize = legend["fontSize"];
                    if (legend.legendName !== undefined) this.legendName = legend["legendName"];

                }
                if (options.dataViews[0].metadata.objects["Axis"]) {
                    var axis = options.dataViews[0].metadata.objects["Axis"];
                    if (axis.showAxis !== undefined) this.showAxis = axis["showAxis"];
                    if (axis.showLabel !== undefined) this.showLabel = axis["showLabel"];
                    if (axis.fontSize !== undefined) this.fontSize = axis["fontSize"];
                    if (axis.yAxisMinValue !== undefined) this.yAxisMinValue = axis["yAxisMinValue"];
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
                    var constantLineObj = options.dataViews[0].metadata.objects["ConstantLine"];
                    if (constantLineObj.constantLineValue !== undefined) this.constantLineValue = constantLineObj["constantLineValue"];
                    if (constantLineObj.constantLineStrokeWidth !== undefined) this.constantLineStrokeWidth = constantLineObj["constantLineStrokeWidth"];
                    if (constantLineObj.constantLineColor !== undefined) this.constantLineColor = constantLineObj["constantLineColor"];
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

        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;

            if (this.legendPosition == "right") ylegendOffset = d3.max(data.legend.map(d => d.width)) + (4 * this.legendFontSize);
            if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = this.legendFontSize * 3;

            let xdata = data.xAxis;
            let xDomain = d3.scale.ordinal().domain(xdata).domain();

            let xT: any = this.axisLabelArray(xDomain.slice(0).filter(d => d !== null), (vp.width - this.getYOffset(data) - ylegendOffset), this.element, this.orientation);

            let xOffset, yOffset, chartWidth, chartHeight, xFilter, xTickval;
            if (this.orientation == 'vertical') {
                xOffset = xT.Space + 20;
                if (xOffset > vp.height / 4) xOffset = vp.height / 4 > 100 ? 100 : vp.height / 4;
                yOffset = this.getYOffset(data);
                chartWidth = vp.width - yOffset - ylegendOffset;
                chartHeight = vp.height - xOffset - xlegendOffset;
                xFilter = (xT.Rotate === true) ? (chartWidth / xDomain.length < 12 ? (Math.ceil(xDomain.length / chartWidth * 20)) : 1) : 1;
                xTickval = xDomain.filter((d, i) => (i % xFilter === 0));

            }
            else {

                yOffset = xT.Space + 15;
                if (yOffset > vp.width / 4) yOffset = vp.width / 4 > 100 ? 100 : vp.width / 4;
                xOffset = 30;
                chartWidth = vp.width - yOffset - ylegendOffset;
                chartHeight = vp.height - xOffset - xlegendOffset;
                xFilter = chartHeight / xDomain.length < this.fontSize ? Math.round((xDomain.length / chartHeight * 20)) : 1;
                xTickval = xDomain.filter((d, i) => (i % xFilter === 0));


            }


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
            let rg = this.orientation == 'vertical' ? dimension.chartWidth : dimension.chartHeight;
            var scale = d3.scale.ordinal().rangeBands([0, rg]).domain(data.xAxis);
            return scale;
        }

        private setYScale(data, dimension) {
            let yDomain = data.yAxis;

            let valueDomain = this.setValueDomain(d3.min(yDomain), d3.max(yDomain));
            let rg = this.orientation == 'vertical' ? dimension.chartHeight : dimension.chartWidth;
            let rng = this.orientation == 'vertical' ? [rg, 0] : [0, rg];

            let scale = d3.scale.linear()
                .range(rng)
                .domain([valueDomain.Min, valueDomain.Max]);

            return scale;
        }

        private drawXScale(xScale, chartSvg, dimension) {
            let direction = this.orientation == 'vertical' ? "bottom" : "left";

            let translate = this.orientation == 'vertical' ?
                "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight) + ")" :
                "translate(" + (dimension.yOffset) + "," + 0 + ")";

            var xaxis = d3.svg.axis()
                .scale(xScale)
                .orient(direction)
                .tickValues(dimension.xTickval);

            var xAxisG = chartSvg
                .append("g")
                .attr("transform", translate)
                .attr("class", "axis")
                .call(xaxis)

            xAxisG.selectAll("text").text(d => {
                if (this.orientation == 'vertical') {
                    if (this.getTextWidth(chartSvg, d, this.fontSize) > dimension.xOffset - this.fontSize && dimension.xRotate == true) return (d.substring(0, Math.floor(dimension.xOffset / (this.fontSize / 2))) + "..");
                    else return d;
                }
                else {
                    if (this.getTextWidth(chartSvg, d, this.fontSize) > dimension.yOffset - this.fontSize) return (d.substring(0, Math.floor(dimension.yOffset / (this.fontSize / 1.6))) + "..");
                    else return d;
                }
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
            var self = this;
            let direction = this.orientation == 'vertical' ? "left" : "bottom";
            let translate = this.orientation == 'vertical' ?
                "translate(" + (dimension.yOffset) + "," + (0) + ")" :
                "translate(" + (dimension.yOffset) + "," + dimension.chartHeight + ")";

            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient(direction)
                .ticks(5)
                .tickFormat(data.yFormat);

            var yAxisG = chartSvg
                .append("g")
                .attr("fill", "rgb(119, 119, 119)")
                .attr("transform", translate)
                .attr("class", "axis")
                .call(yaxis);

            yAxisG.selectAll("text").attr("fill", "rgb(119, 119, 119)");
        }

        private drawCircles(xScale, yScale, chartSvg, data, dimension) {

            var circleData = data.data;

            var circleG = chartSvg.selectAll(".dots")
                .data(circleData)
                .enter()
                .append("g")

            var circle = this.circles = circleG.selectAll(".dots")
                .data(d => d.values.filter(d => d.yValue.value !== null))
                .enter()
                .append("circle");

            if (this.orientation == 'vertical') {

                circleG.attr("transform", "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)");

                circle
                    .attr("cx", d => xScale(d.xValue.value))
                    .attr("cy", d => yScale(d.yValue.value))
            }
            else {
                circleG.attr("transform", "translate(0," + (xScale.rangeBand() / 2) + ")");

                circle
                    .attr("cy", d => xScale(d.xValue.value))
                    .attr("cx", d => dimension.yOffset + yScale(d.yValue.value))
            }

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
           
            if (this.showLabel == true) {
                var text = circleG.selectAll(".dotText")
                    .data(d => d.values.filter(d => d.yValue.value !== null))
                    .enter()
                    .append("text");


                text.text(d => d.yValue.caption)


                if (this.orientation == 'vertical') {

                    text.attr("x", d => xScale(d.xValue.value) + 2)
                        .attr("dx", this.dotRadius)
                        .attr("dy", this.dotRadius / 2)
                        .attr("y", d => yScale(d.yValue.value))
                }
                else {
                    text.attr("y", d => xScale(d.xValue.value) + 2)
                        .attr("dy", -this.dotRadius * 2)
                        .style("text-anchor", "middle")
                        .attr("x", d => dimension.yOffset + yScale(d.yValue.value))
                }


            }

            if (this.hasSize) {

                var sizeScale = d3.scale.linear()
                    .range([this.dotRadius, d3.min([25, (5 * this.dotRadius)])])
                    .domain([d3.min(data.sizeValues), d3.max(data.sizeValues)]);

                circle.attr("r", d => {
                    return d.size.value !== null ? sizeScale(Math.abs(d.size.value)) : 0
                });

            }

            this.tooltipServiceWrapper.addTooltip(circle,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        private drawConstantLine(yScale, chartSvg, data, dimension) {
            if (this.constantLineValue.length > 0) {
                var constLine = this.constantLineValue;


                if (this.orientation == 'vertical') {
                    var constantLine = chartSvg.append("line")
                        .attr("x1", dimension.yOffset)
                        .attr("x2", dimension.yOffset + dimension.chartWidth)
                        .attr("y1", yScale(constLine))
                        .attr("y2", yScale(constLine))
                }
                else {
                    var constantLine = chartSvg.append("line")
                        .attr("y1", 0)
                        .attr("y2", dimension.chartHeight)
                        .attr("x1", dimension.yOffset + yScale(constLine))
                        .attr("x2", dimension.yOffset + yScale(constLine))
                }

                constantLine.style("stroke", this.constantLineColor.solid.color)
                    .style("stroke-width", this.constantLineStrokeWidth + "px");
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
                chartLegend.attr("transform", "translate(" + (dimension.chartWidth + dimension.yOffset + (this.legendFontSize * 2)) + "," + (5) + ")");
            }
            if (this.legendPosition == "top") {
                chartSvg.attr("transform", "translate(0," + this.legendFontSize * 3 + ")");
                chartLegend.attr("transform", "translate(" + (dimension.yOffset) + "," + this.legendFontSize + ")");
            }
            if (this.legendPosition == "bottom") {
                chartLegend.attr("transform", "translate(" + (dimension.yOffset) + "," + (dimension.chartHeight + dimension.xOffset + (this.legendFontSize * 2)) + ")");
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

        private setFontSize(chartSvg) {

            chartSvg.selectAll("text").style("font-size", this.fontSize + "px");
        }

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

        private getYOffset(data) {

            let max = d3.max(data.yAxis);

            return 2 + (data.yFormat(max).length + 1) * this.fontSize / 1.5;
        }

        private setValueDomain = function (Min, Max) {
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

            if (this.yAxisMinValue == true) {
                domain.Min = Min > 0 ? Min - ((Min * 10) / 100) : Min + ((Min * 10) / 100);
                domain.Max = Max + ((Max * 10) / 100);
            }

            return domain;
        };

        private drawDumbellLines(data, chartSvg, dimension, xScale, yScale) {

            if (this.connectDots == true) {
                var line: any;
                line = d3.svg.line();

                var dumbellG = chartSvg.selectAll(".dots")
                    .data(data.dumbellData)
                    .enter()
                    .append("g")

                if (this.orientation == 'vertical') {
                    line
                        .y((d: any) => yScale(this.connectDotsBy == 'axis' ? d.yValue : d.yValue.value))
                        .x((d: any) => xScale(this.connectDotsBy == 'axis' ? d.xValue : d.xValue.value));

                    dumbellG.attr("transform", "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)");

                }
                else {
                    line
                        .x((d: any) => yScale(this.connectDotsBy == 'axis' ? d.yValue : d.yValue.value))
                        .y((d: any) => xScale(this.connectDotsBy == 'axis' ? d.xValue : d.xValue.value));

                    dumbellG.attr("transform", "translate(" + dimension.yOffset + "," + (xScale.rangeBand() / 2) + ")");

                }

                var dumbell = dumbellG.append("path")
                    .attr("style", "fill:none;")
                    .style("stroke", "#b3b3b3")
                    .attr("stroke-width", this.dumbbellLineStroke + "px")
                    .attr("d", d => line(d.values));

                if (this.connectDotsBy === "color") dumbell.style("stroke", d => d.color)
            }


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
                    x: this.orientation === 'vertical' ? dimension.yOffset : dimension.yOffset + yScale(mean),
                    y: this.orientation === 'vertical' ? yScale(mean) : 0,
                    dx: this.orientation === 'vertical' ? dimension.chartWidth - 5 : 5,
                    dy: this.orientation === 'vertical' ? -5 : 15,
                    color: "#ff6f69",
                    width: this.orientation === 'vertical' ? dimension.chartWidth : 2,
                    height: this.orientation === 'vertical' ? 2 : dimension.chartHeight,
                })
            }

            if (this.showMedian === true) {
                let median = d3.median(data.yAxis);
                statData.push({
                    title: 'Median:' + data.yFormat(median),
                    x: this.orientation === 'vertical' ? dimension.yOffset : dimension.yOffset + yScale(median),
                    y: this.orientation === 'vertical' ? yScale(median) : 0,
                    dx: this.orientation === 'vertical' ? dimension.chartWidth - 5 : 5,
                    dy: this.orientation === 'vertical' ? -5 : dimension.chartHeight / 2,
                    color: "#010c0e",
                    width: this.orientation === 'vertical' ? dimension.chartWidth : 2,
                    height: this.orientation === 'vertical' ? 2 : dimension.chartHeight,
                })
            }

            if (this.showMode === true) {
                let mode = data.yAxis[Math.ceil(data.yAxis.length / 2)];
                statData.push({
                    title: 'Mode:' + data.yFormat(mode),
                    x: this.orientation === 'vertical' ? dimension.yOffset : dimension.yOffset + yScale(mode),
                    y: this.orientation === 'vertical' ? yScale(mode) : 0,
                    dx: this.orientation === 'vertical' ? dimension.chartWidth - 5 : 5,
                    dy: this.orientation === 'vertical' ? -5 : dimension.chartHeight - 15,
                    color: "#74002f",
                    width: this.orientation === 'vertical' ? dimension.chartWidth : 2,
                    height: this.orientation === 'vertical' ? 2 : dimension.chartHeight,
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
                .style("text-anchor", this.orientation === 'vertical' ? "end" : "start")
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

            if (this.orientation === 'vertical') {
                trendLine
                    .attr("x1", d => xScale(d[0]) + dimension.yOffset)
                    .attr("y1", d => yScale(d[1]))
                    .attr("x2", d => xScale(d[2]) + dimension.yOffset + (xScale.rangeBand()))
                    .attr("y2", d => yScale(d[3]));
            }
            else {
                trendLine
                    .attr("y1", d => xScale(d[0]))
                    .attr("x1", d => yScale(d[1]) + dimension.yOffset)
                    .attr("y2", d => xScale(d[2]) + (xScale.rangeBand()))
                    .attr("x2", d => yScale(d[3]) + dimension.yOffset);
            }

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

            if (this.orientation === 'vertical') {

                var expExpRegressionLine = d3.svg.line()
                    .x((d, i) => { return xScale(xSeries[i]) + dimension.yOffset; })
                    .y(d => yScale(d[1]))
                    .interpolate('monotone');
            }
            else {
                var expExpRegressionLine = d3.svg.line()
                    .y((d, i) => { return xScale(xSeries[i]); })
                    .x(d => yScale(d[1]) + dimension.yOffset)
                    .interpolate('monotone');
            }

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

            if (this.orientation === 'vertical') {

                expExpSmoothLine = d3.svg.line()
                    .x((d, i) => xScale(xSeries[i]) + dimension.yOffset)
                    .y(d => yScale(d))
                    .interpolate('monotone');
            }
            else {
                expExpSmoothLine = d3.svg.line()
                    .y((d, i) => { return xScale(xSeries[i]); })
                    .x((d, i) => { return yScale(d) + dimension.yOffset; })
                    .interpolate('monotone');
            }

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


            if (this.orientation === "vertical") {

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
            else {

                var lower = yScale(mean - sd) < yScale.range()[0] ? yScale.range()[0] : yScale(mean - sd);
                var upper = yScale(mean + sd) > yScale.range()[1] ? yScale.range()[1] : yScale(mean + sd);

                stdDevGMeanLine
                    .attr("width", 2)
                    .attr("height", dimension.chartHeight - dimension.xOffset)
                    .attr("x", yScale(mean) + dimension.yOffset);

                stdDevGRect
                    .attr("height", dimension.chartHeight - dimension.xOffset)
                    .attr("x", lower + dimension.yOffset)
                    .attr("width", Math.abs(upper - lower))

                var xpos = yScale(mean) + dimension.xOffset + 5;

                stdDevGText
                    .attr("y", 15)
                    .append("tspan")
                    .attr("x", xpos)
                    .text("Std dev: " + format(sd));

                stdDevGText.append("tspan")
                    .attr("dy", 15)
                    .attr("x", xpos)
                    .text("Mean + Std dev: " + format(mean + sd));

                stdDevGText.append("tspan")
                    .attr("x", xpos)
                    .attr("dy", 15)
                    .text("Mean: " + format(mean));

                stdDevGText.append("tspan")
                    .attr("dy", 15)
                    .attr("x", xpos)
                    .text("Mean - Std dev: " + format(mean - sd));
            }





        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {

                case 'Basic':
                    objectEnumeration.push({ objectName: objectName, properties: { orientation: this.orientation }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { dotRadius: this.dotRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circlestroke: this.circlestroke }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valFormat: this.valFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valPrecision: this.valPrecision }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleOpacity: this.circleOpacity }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { constantLineValue: this.constantLineValue }, selector: null });

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

                case 'Dumbbell':
                    objectEnumeration.push({ objectName: objectName, properties: { connectDots: this.connectDots }, selector: null });
                    if (this.connectDots == true) {
                        objectEnumeration.push({ objectName: objectName, properties: { connectDotsBy: this.connectDotsBy }, selector: null });
                        if (this.connectDotsBy == "axis") objectEnumeration.push({ objectName: objectName, properties: { dumbbellSort: this.dumbbellSort }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { dumbbellLineStroke: this.dumbbellLineStroke }, selector: null });

                        
                    }
                    break;
                case 'Legend':

                    objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                    if (this.hasColor) objectEnumeration.push({ objectName: objectName, properties: { legendName: this.legendName }, selector: null });
                    //objectEnumeration.push({ objectName: objectName, properties: { legendColor: this.legendColor }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.legendFontSize }, selector: null });
                    break;

                case 'Axis':
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { yAxisMinValue: this.yAxisMinValue }, selector: null });
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

                case 'ConstantLine':
                    objectEnumeration.push({ objectName: objectName, properties: { constantLineValue: this.constantLineValue }, selector: null });
                    if (this.constantLineValue.length > 0) {
                        objectEnumeration.push({ objectName: objectName, properties: { constantLineStrokeWidth: this.constantLineStrokeWidth }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { constantLineColor: this.constantLineColor }, selector: null });
                    }
                    break;


            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}