
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


module powerbi.extensibility.visual.stripPlotD9885417F9AAF5BB8D45B007E  {
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

        private yAxisMinValue: boolean = false;

        private colorPalette: any;

        private showAxis: any = true;

        private dotRadius: any = 6;
        private circleColor: any = { solid: { color: "#01b8aa" } };
        private circleOpacity: any = 100;
        private circlestroke: any = 1;
        private circleJitter: any = false;
        private drawMedian: any = false;
        private orientation: any = "vertical";
        private fontSize: any = 11;
        private percentiles: any = [0.05, 0.25, 0.50, 0.75, 0.95];


        private constantLineValue: any = '';

        private stripBox: any = true;
        private boxFill: any = { solid: { color: "#01b8aa" } };

        private valuesIndex: any;
        private groupIndex: any;
        private valuesFormatter: any;

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            this.element.style("overflow", "hidden");
            this.element.select('.stripPlot').remove();

            this.colorPalette.reset();

            this.draw(options);
        }

        public draw(options) {

            this.findAvailableMetadata(options.dataViews[0].metadata.columns);
            var chartContainer = this.element
                .append("div")
                .attr("class", "stripPlot")
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
                .attr("width", dimension.width);


            var chartSvg = chart.append("g")

            chartSvg.attr("transform", "translate(0," + 5 + ")");

            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);

            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension, data);

            this.drawCircles(xScale, yScale, chartSvg, data, dimension);

            if (this.stripBox === true) {
                this.drawBoxPlot(xScale, yScale, chartSvg, data, dimension);
            }

            if (this.drawMedian === true) {
                this.drawStripMedian(xScale, yScale, chartSvg, data, dimension);
            }

            this.setFontSize(chartSvg);

        }

        public formatData(rawData) {
            var metadata = rawData.metadata.columns;
            var data = [];

            rawData.table.rows.forEach((d: any, i) => {

                data.push({
                    val: d[this.valuesIndex],
                    group: d[this.groupIndex]
                });

            });

            var nestedData = d3.nest()
                .key((d: any) => d.group)
                .entries(data);

            var xAxis = data.map(d => d.group);
            var yAxis = data.map(d => d.val);
            var valFormat = this.getValueFormat(this.valuesFormatter, d3.map(yAxis), this.valFormat, this.valPrecision);

            return { xAxis: xAxis, yAxis: yAxis, yFormat: valFormat.format, data: nestedData }
        }

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.dotRadius !== undefined) this.dotRadius = basic["dotRadius"];
                    if (basic.circleColor !== undefined) this.circleColor = basic["circleColor"];
                    if (basic.circlestroke !== undefined) this.circlestroke = basic["circlestroke"];
                    if (basic.circleOpacity !== undefined) this.circleOpacity = basic["circleOpacity"];
                    if (basic.circleJitter !== undefined) this.circleJitter = basic["circleJitter"];
                    if (basic.drawMedian !== undefined) this.drawMedian = basic["drawMedian"];


                    if (basic.orientation !== undefined) this.orientation = basic["orientation"];
                    if (basic.valFormat !== undefined) this.valFormat = basic["valFormat"];
                    if (basic.valPrecision !== undefined) this.valPrecision = basic["valPrecision"];

                }

                if (options.dataViews[0].metadata.objects["Axis"]) {
                    var axis = options.dataViews[0].metadata.objects["Axis"];
                    if (axis.showAxis !== undefined) this.showAxis = axis["showAxis"];
                    if (axis.fontSize !== undefined) this.fontSize = axis["fontSize"];
                    if (axis.yAxisMinValue !== undefined) this.yAxisMinValue = axis["yAxisMinValue"];
                }
                if (options.dataViews[0].metadata.objects["Box"]) {
                    var Box = options.dataViews[0].metadata.objects["Box"];
                    if (Box.stripBox !== undefined) this.stripBox = Box["stripBox"];
                    if (Box.boxFill !== undefined) this.boxFill = Box["boxFill"];
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
                    this.groupIndex = i;
                    this.axisFormat = d.format;
                }
                if (d.roles["values"]) {
                    this.hasValue = true;
                    this.valuesIndex = i;
                    this.valuesFormatter = d.format;
                }

            });



        }

        private getValueFormat(val, max, format, precision) {

            let valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
            let iValueFormatter = valueFormatter.create({});
            let valF = null;
            switch (format) {
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
                    return { format: d3.format(",." + precision + "f") }
            }

            iValueFormatter = valueFormatter.create({ format: val, value: valF, precision: precision });

            return iValueFormatter;
        }

        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;

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
            var scale = d3.scale.ordinal().rangeBands([0, rg], .2).domain(data.xAxis);
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

            var offset;

            var circleG = chartSvg.selectAll(".dots")
                .data(circleData)
                .enter()
                .append("g")

            var circle = this.circles = circleG.selectAll(".dots")
                .data(d => d.values.filter(d => d.val !== null))
                .enter()
                .append("circle");

            if (this.orientation == 'vertical') {

                circleG.attr("transform", d => {
                    if (this.circleJitter) return "translate(" + dimension.yOffset + ",0)"
                    return "translate(" + (dimension.yOffset + xScale.rangeBand() / 2) + ",0)"
                });

                circle
                    .attr("cx", d => {
                        if (this.circleJitter) return (Math.random() * ((xScale(d.group) + xScale.rangeBand()) - xScale(d.group)) + xScale(d.group));
                        return xScale(d.group)
                    })
                    .attr("cy", d => yScale(d.val))
            }
            else {
                circleG.attr("transform", d => {
                    if (this.circleJitter) return "translate(0,0)";
                    return "translate(0," + (xScale.rangeBand() / 2) + ")"
                });

                circle
                    .attr("cy", d => {
                        if (this.circleJitter) return (Math.random() * ((xScale(d.group) + xScale.rangeBand()) - xScale(d.group)) + xScale(d.group));
                        return xScale(d.group)
                    })
                    .attr("cx", d => dimension.yOffset + yScale(d.val))
            }

            circle
                .attr("r", this.dotRadius)
                .attr("fill", this.circleColor.solid.color)
                .style("stroke", this.circleColor.solid.color)
                .style("stroke-width", this.circlestroke + "px")
                .style("fill-opacity", this.circleOpacity / 100);

            this.tooltipServiceWrapper.addTooltip(circle,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        private drawBoxPlot(xScale, yScale, chartSvg, data, dimension) {
            var format = data.yFormat;
            var boxBox = chartSvg.selectAll(".box")
                .data(data.data)
                .enter()
                .append("g")
                .attr("transform", "translate(" + (dimension.yOffset) + ",0)");;

            var data, data_sorted, q1, median, q3, min, max, svg;
            var orient = this.orientation;
            var color = this.boxFill.solid.color;
            var strokeColor = "#3a3737";

            var lines, lineData,rectData, upperRect, lowerRect;
            var self = this;
            boxBox.each(function (d) {
                data = d.values.map(d => d.val);
                data_sorted = data.sort(d3.ascending);
                q1 = d3.quantile(data_sorted, .25);
                median = d3.quantile(data_sorted, .5);
                q3 = d3.quantile(data_sorted, .75);
                min = d3.quantile(data_sorted, .05);
                max = d3.quantile(data_sorted, .95);

                svg = d3.select(this);

                lineData = [
                    { value: min, caption: "5th percentile", formattedVal: format(min) },
                    { value: median, caption: "50th percentile", formattedVal: format(median) },
                    { value: max, caption: "95th percentile", formattedVal: format(max) }
                ]

                rectData = [
                    { value: median - q1, caption: "25th percentile", formattedVal: format(median - q1) },
                    { value: median, caption: "50th percentile", formattedVal: format(median) },
                    { value: q3-median, caption: "75th percentile", formattedVal: format(q3-median) }
                ]

                if (orient == 'vertical') {
                    svg
                    // .append("line")
                    // .attr("x1", xScale(d.key) + xScale.rangeBand() / 2)
                    // .attr("x2", xScale(d.key) + xScale.rangeBand() / 2)
                    // .attr("y1", yScale(min))
                    // .attr("y2", yScale(max))
                    // .attr("stroke", strokeColor);

                    lowerRect = svg
                        .append("rect")
                        .data([rectData])
                        .attr("x", xScale(d.key))
                        .attr("y", yScale(median))
                        .attr("height", yScale(q1) - yScale(median))
                        .attr("width", xScale.rangeBand())
                        .style("fill-opacity", ".3")
                        .style("fill", "#000");

                    upperRect = svg
                        .append("rect")
                        .data([rectData])
                        .attr("x", xScale(d.key))
                        .attr("y", yScale(q3))
                        .attr("height", yScale(median) - yScale(q3))
                        .attr("width", xScale.rangeBand())
                        .style("fill-opacity", ".5")
                        .style("fill", "#ccc")

                    lines = svg
                        .selectAll("toto")
                        .data(lineData)
                        .enter()
                        .append("line")
                        .attr("stroke-width", 2)
                        .attr("x1", xScale(d.key))
                        .attr("x2", xScale(d.key) + xScale.rangeBand())
                        .attr("y1", function (d) { return (yScale(d.value)) })
                        .attr("y2", function (d) { return (yScale(d.value)) })
                        .attr("stroke", strokeColor);

                }
                else {
                    // svg
                    //     .append("line")
                    //     .attr("y1", xScale(d.key) + xScale.rangeBand() / 2)
                    //     .attr("y2", xScale(d.key) + xScale.rangeBand() / 2)
                    //     .attr("x1", yScale(min))
                    //     .attr("x2", yScale(max))
                    //     .attr("stroke", strokeColor);

                    lowerRect = svg
                        .append("rect")
                        .data([rectData])
                        .attr("y", xScale(d.key))
                        .attr("x", yScale(q1))
                        .attr("width", yScale(median) - yScale(q1))
                        .attr("height", xScale.rangeBand())
                        .style("fill-opacity", ".3")
                        .style("fill", "#000");

                    upperRect = svg
                        .append("rect")
                        .data([rectData])
                        .attr("y", xScale(d.key))
                        .attr("x", yScale(median))
                        .attr("width", yScale(q3) - yScale(median))
                        .attr("height", xScale.rangeBand())
                        .style("fill-opacity", ".5")
                        .style("fill", "#ccc")



                    // svg
                    //     .append("rect")
                    //     .attr("y", xScale(d.key))
                    //     .attr("x", yScale(q1))
                    //     .attr("width", yScale(q3) - yScale(q1))
                    //     .attr("height", xScale.rangeBand())
                    //     .attr("stroke", strokeColor)
                    //     .style("fill", color)

                    lines = svg
                        .selectAll("toto")
                        .data(lineData)
                        .enter()
                        .append("line")
                        .attr("y1", xScale(d.key))
                        .attr("y2", xScale(d.key) + xScale.rangeBand())
                        .attr("x1", d => yScale(d.value))
                        .attr("x2", d => yScale(d.value))
                        .attr("stroke-width", 2)
                        .attr("stroke", strokeColor);

                }


                self.tooltipServiceWrapper.addTooltip(lines,
                    (tooltipEvent: TooltipEventArgs<any>) => self.getLineTooltipData(tooltipEvent.data),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );

                self.tooltipServiceWrapper.addTooltip(upperRect,
                    (tooltipEvent: TooltipEventArgs<any>) => self.getUpperRectTooltipData(tooltipEvent.data),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
                self.tooltipServiceWrapper.addTooltip(lowerRect,
                    (tooltipEvent: TooltipEventArgs<any>) => self.getLowerRectTooltipData(tooltipEvent.data),
                    (tooltipEvent: TooltipEventArgs<any>) => null
                );
            })
        }

        private drawStripMedian(xScale, yScale, chartSvg, data, dimension) {

            var boxBox = chartSvg.selectAll(".stripBox")
                .data(data.data)
                .enter()
                .append("g")
                .attr("transform", "translate(" + (dimension.yOffset) + ",0)");;

            var data, data_sorted, q1, median, q3, min, max, svg;
            var orient = this.orientation;
            var strokeColor = "#3a3737";

            boxBox.each(function (d) {
                data = d.values.map(d => d.val);
                data_sorted = data.sort(d3.ascending);
                q1 = d3.quantile(data_sorted, .25);
                median = d3.quantile(data_sorted, .5);
                q3 = d3.quantile(data_sorted, .75);
                min = d3.quantile(data_sorted, .05);
                max = d3.quantile(data_sorted, .95);

                svg = d3.select(this);

                if (orient == 'vertical') {

                    svg
                        .selectAll("toto")
                        .data([median])
                        .enter()
                        .append("line")
                        .attr("x1", xScale(d.key))
                        .attr("x2", xScale(d.key) + xScale.rangeBand())
                        .attr("y1", function (d) { return (yScale(d)) })
                        .attr("y2", function (d) { return (yScale(d)) })
                        .attr("stroke", strokeColor);
                }
                else {

                    svg
                        .selectAll("toto")
                        .data([median])
                        .enter()
                        .append("line")
                        .attr("y1", xScale(d.key))
                        .attr("y2", xScale(d.key) + xScale.rangeBand())
                        .attr("x1", function (d) { return (yScale(d)) })
                        .attr("x2", function (d) { return (yScale(d)) })
                        .attr("stroke", strokeColor);
                }

            })
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

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];

            retData.push({
                displayName: data.group.toString(),
                value: data.val.toString()
            });

            return retData;
        }

        private getLineTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];

            retData.push({
                displayName: "Value",
                value: data.formattedVal.toString(),
                header: data.caption.toString()
            });

            return retData;
        }

        private getUpperRectTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];
          
            retData.push({
                displayName: data[1].caption.toString(),
                value: data[1].formattedVal.toString(),
                header: data[1].caption.toString() + ' - ' + data[2].caption.toString()
            });

            retData.push({
                displayName: data[2].caption.toString(),
                value: data[2].formattedVal.toString()
            });

            return retData;
        }

        private getLowerRectTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];
           
            retData.push({
                displayName: data[0].caption.toString(),
                value: data[0].formattedVal.toString(),
                header: data[0].caption.toString() + ' - ' + data[1].caption.toString()
            });

            retData.push({
                displayName: data[1].caption.toString(),
                value: data[1].formattedVal.toString()
            });


            return retData;
        }

        private getTextWidth(container, text, fontsize) {

            var dummytext = container.append("text").text(text).attr("font-size", fontsize);
            var bbox = { width: 10, height: 10 };
            if (dummytext.node() !== null) bbox = dummytext.node().getBBox();
            dummytext.remove();

            return bbox.width;
        };

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

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {

                case 'Basic':
                    objectEnumeration.push({ objectName: objectName, properties: { orientation: this.orientation }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { dotRadius: this.dotRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleColor: this.circleColor }, selector: null });

                    objectEnumeration.push({ objectName: objectName, properties: { circlestroke: this.circlestroke }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleJitter: this.circleJitter }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { drawMedian: this.drawMedian }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valFormat: this.valFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valPrecision: this.valPrecision }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleOpacity: this.circleOpacity }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { constantLineValue: this.constantLineValue }, selector: null });

                    break;

                case 'Axis':
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { yAxisMinValue: this.yAxisMinValue }, selector: null });
                    break;

                case 'Box':
                    objectEnumeration.push({ objectName: objectName, properties: { stripBox: this.stripBox }, selector: null });
                    // if (this.stripBox) objectEnumeration.push({ objectName: objectName, properties: { boxFill: this.boxFill }, selector: null });
                    break;

            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}