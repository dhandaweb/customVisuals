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


module powerbi.extensibility.visual.histogramCCFC224D9885417F9AAF5BB8D45B007E  {
    "use strict";

    export class Visual implements IVisual {

        private host: IVisualHost;
        //  private tooltipServiceWrapper: ITooltipServiceWrapper;

        private selectionManager: ISelectionManager;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;

        private columns: any;

        private valuesIndex: number;
        private hasValues: any;
        private valuesFormatter: any;

        private groupIndex: number;
        private hasGroup: any;
        private groupFormatter: any;

        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private chartData: any;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;

        private fontSize: any = 10;
        private valFormat: any = 'default';
        private valPrecision: any = 1;
        private binCount: any = 10;
        private showLabel: any = false;
        private showYAxis: any = true;
        private barFill: any = { solid: { color: "#01b8aa" } };
        private formattedData: any = [];
        private showAs: any = "bar";
        private colorPalette: any;
        private rangeBandPadding: any = 0;
        private colorTitle: any = '';
        private legendFontSize: any = 10;
        private legendPosition: any = "right";
        private legendName: any;

        private xAxisFormat:any;

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
            this.colorPalette = this.host.colorPalette;
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            this.colorPalette.reset();
            this.draw(options);

        }

        public draw(options) {
            this.setProperties(options);

            this.hasValues = false;
            this.hasGroup = false;

            this.columns.forEach((d, i) => {
                if (d.roles["group"]) {
                    this.hasGroup = true;
                    this.groupIndex = i;
                    this.colorTitle = d.displayName;
                }
                if (d.roles["values"]) {
                    this.hasValues = true;
                    this.valuesIndex = i;
                    this.valuesFormatter = d.format;
                }
            });

            this.element.style("overflow", "hidden");
            this.element.select('.histogram').remove();

            var container = this.element
                .append("div")
                .attr("class", "histogram")
                .attr("style", "width:100%;text-align:left;padding:1px;border-spacing:0;")
                .attr("style", 'font-family: "Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif');

            if (this.hasValues === false && this.hasGroup === false) {
                container
                    .append("html")
                    .attr("style", "")
                    .html("Data is missing to draw the visual");
                return;
            }

            var data = [];

            options.dataViews[0].table.rows.forEach((d: any, i) => {
                var id = null;

                if (this.hasGroup) {
                    const categoryColumn: DataViewCategoryColumn = {
                        source: this.columns[this.groupIndex],
                        values: null,
                        identity: [options.dataViews[0].categorical.__proto__.categories[this.groupIndex].identity[i]]
                    };

                    id = this.host.createSelectionIdBuilder()
                        .withCategory(categoryColumn, 0)
                        .createSelectionId();
                }

                data.push({
                    val: d[this.valuesIndex],
                    group: d[this.groupIndex],
                    iden: id
                });

            });
          
            var nestedData = d3.nest()
                .key((d: any) => d.group)
                .entries(data);

            var values = data.map(d => d.val);
            var max = d3.max(values);
            var min = d3.min(values);
            var tickValues = [];

            var step = (max - min) / this.binCount;
            var i;
            for (i = 0; i < (this.binCount + 1); i++) {
                tickValues.push(min + (i * step))
            };

            this.formattedData = nestedData.map((item: any, i) => {
                var data: any = d3.layout.histogram()
                    .bins(tickValues)
                    (item.values.map(d => d.val));

                item.list = data;
                item.yMax = d3.max(data, function (d: any) { return d.length });
                item.iden = item.values[0].iden;
                item.color = this.hasGroup ? this.colorPalette.getColor(item.key).value : this.barFill.solid.color
                if (this.hasGroup) {
                    if (options.dataViews[0].categorical.categories[0].objects) {
                        if (options.dataViews[0].categorical.categories[0].objects[i]) {
                            item.color = options.dataViews[0].categorical.categories[0].objects[i].colorSelector.fill.solid.color;
                        }
                    }
                }

                return item;
            });
           
            let legendD = this.formattedData.map((d: any) => { return { key: d.key, color: d.color } });

            let nm = (this.legendName !== undefined) ? this.legendName.length > 0 ? this.legendName : this.colorTitle : this.colorTitle;
            if (this.hasGroup) legendD.unshift({ key: nm, color: "transparent" });
            var legend = this.setLegendWidth(this.element, legendD);

            var dimension = this.getDimensions(options.viewport, legend);

            var yMax = d3.max(nestedData.map((d: any) => d.yMax));
            yMax = yMax + (yMax / 10);
            var yScale = d3.scale.linear()
                .domain([0, yMax])
                .range([dimension.chartHeight, 0]);

            var xScale = d3.scale.linear()
                .domain([min, max])
                .range([0, dimension.chartWidth-10]);

            var rangeBand = xScale(tickValues[1]) - xScale(tickValues[0]);
            this.rangeBandPadding = rangeBand / 20;
            rangeBand = rangeBand - this.rangeBandPadding;
            var xScale1 = d3.scale.ordinal()
                .domain(this.formattedData.map(d => d.key))
                .rangeBands([0, rangeBand]);

            this.formattedData.map((item: any) => {
                item.dx = xScale1(item.key);
                item.width = xScale1.rangeBand();
            })

            this.xAxisFormat = this.getValueFormat(this.valuesFormatter, max, this.valFormat, this.valPrecision);
            var chartCon = container
                .attr("style", "fill: rgb(102, 102, 102); font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;")
                .append("svg")
                .attr("height", dimension.height)
                .attr("width", dimension.width);

            var chart = chartCon.append("g").attr("transform", "translate(0," + 5 + ")");;
            var chartLegend = chartCon.append("g");
         
            this.drawXAxis(chart, dimension.chartHeight, xScale, tickValues, max, dimension.yOffset);
            this.drawYAxis(chart, yScale, dimension.yOffset);
            this.drawHistrogram(this.formattedData, chart, xScale, yScale, dimension.yOffset, xScale1, dimension.chartHeight);
            this.setFontSize(chart);

            if (this.hasGroup) this.drawLegend(chartLegend, chart, dimension, legend);
        }



        private drawHistrogram(nestedData, svg, xScale, yScale, leftOffset, xScale1, height) {

            var group = svg.selectAll(".barGroup")
                .data(nestedData)
                .enter().append("g")
                .attr("class", "barGroup")
                .attr("transform", function (d: any) { return "translate(" + (leftOffset + d.dx) + "," + 0 + ")"; })
                .attr("fill", d => d.color);


            switch (this.showAs) {
                case "bar":
                    this.drawBars(group, xScale, xScale1, yScale, height);
                    break;
                case "line":
                    this.drawLine(group, xScale, xScale1, yScale, height);
                    break;
                case "dot":

                    this.drawDots(group, xScale, xScale1, yScale, height);
                    break;
                case "lineDot":
                    this.drawLine(group, xScale, xScale1, yScale, height);
                    this.drawDots(group, xScale, xScale1, yScale, height);
                    break;
                default:
                    this.drawBars(group, xScale, xScale1, yScale, height);
                    break
            }


            this.drawLabels(group, xScale, xScale1, yScale, height);

        }

        private drawXAxis(svg, height, xScale, tickValues, max, leftOffset) {

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickFormat(this.xAxisFormat.format)
                .tickValues(tickValues);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + leftOffset + "," + height + ")")
                .call(xAxis);

        }

        private drawYAxis(svg, yScale, leftOffset) {



            if (this.showYAxis === true) {
                var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left");

                yAxis
                    .ticks(5)
                    .tickFormat(d3.format("s"));

                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + leftOffset + ",0)")
                    .call(yAxis);
            }

        }

        private drawBars(barGroup, xScale, xScale1, yScale, height) {

            var bars = barGroup.selectAll(".bar")
                .data(d => d.list)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x) + (this.rangeBandPadding / 2))
                .attr("width", xScale1.rangeBand() - 1)
                .attr("y", function (d: any) {
                    return yScale(d.y);
                })
                .attr("height", function (d: any) {
                    return height - yScale(d.y);
                });



            this.tooltipServiceWrapper.addTooltip(bars,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        private drawLine(barGroup, xScale, xScale1, yScale, height) {

            var line = d3.svg.line()
                .x((d: any) => (xScale(d.x) + xScale1.rangeBand() / 2))
                .y((d: any) => yScale(d.y))

            var lines = barGroup
                .append("path")
                .attr("fill", "none")
                .attr("d", d => line(d.list))
                .style("stroke", d => d.color);

            this.tooltipServiceWrapper.addTooltip(lines,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        private drawDots(barGroup, xScale, xScale1, yScale, height) {

            var radius = 5;
            var bars = barGroup.selectAll(".dot")
                .data(d => d.list)
                .enter()

                .append("circle")
                .attr("class", "dot")
                .attr("cx", (d: any) => (xScale(d.x) + - radius + xScale1.rangeBand() / 2))
                .attr("cy", (d: any) => {
                    return yScale(d.y);
                })
                .attr("r", radius);


            this.tooltipServiceWrapper.addTooltip(bars,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );
        }

        private drawLabels(barGroup, xScale, xScale1, yScale, height) {
            if (this.showLabel == true) {
                barGroup.selectAll(".barLabel")
                    .data(d => d.list)
                    .enter()
                    .append("text")
                    .attr("dy", -5)
                    .attr("y", function (d: any) {
                        return yScale(d.y);
                    })
                    .attr("x", d => (xScale(d.x) + xScale1.rangeBand() / 2))
                    .attr("text-anchor", "middle")
                    .attr("fill", "rgb(102, 102, 102)")
                    .text((d: any) => d.y == 0 ? "" : d.y);
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
                .data(data)
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

        private setFontSize(chartSvg) {
            chartSvg.selectAll("text").style("font-size", this.fontSize + "px");
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

        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;

            if (this.hasGroup) {
                if (this.legendPosition == "right") ylegendOffset = d3.max(data.map(d => d.width)) + (4 * this.legendFontSize);
                if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = this.legendFontSize * 3;
            }

            let xOffset, yOffset, chartWidth, chartHeight;

            xOffset = 5 + this.fontSize * 2;
            yOffset = 10 + this.fontSize * 2;
            chartWidth = vp.width - yOffset - ylegendOffset;
            chartHeight = vp.height - xOffset - xlegendOffset;

            return {
                width: vp.width,
                height: vp.height,
                xOffset: xOffset,
                yOffset: yOffset,
                chartWidth: chartWidth,
                chartHeight: chartHeight
            }
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];

            retData.push({
                displayName: "Range",
                value: "[ " + this.xAxisFormat.format(data.x).toString() + " - " + this.xAxisFormat.format((data.x + data.dx)).toString() + " ]"
            });

            retData.push({
                displayName: "Frequency",
                value: data.y.toString()
            });
        
            return retData;
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

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.fontSize !== undefined) this.fontSize = basic["fontSize"];
                    if (basic.valFormat !== undefined) this.valFormat = basic["valFormat"];
                    if (basic.valPrecision !== undefined) this.valPrecision = basic["valPrecision"];
                    if (basic.showYAxis !== undefined) this.showYAxis = basic["showYAxis"];

                }
                if (options.dataViews[0].metadata.objects["Histogram"]) {
                    var histogram = options.dataViews[0].metadata.objects["Histogram"];
                    if (histogram.barFill !== undefined) this.barFill = histogram["barFill"];
                    if (histogram.binCount !== undefined) this.binCount = histogram["binCount"];
                    if (histogram.showAs !== undefined) this.showAs = histogram["showAs"];
                    if (histogram.showLabel !== undefined) this.showLabel = histogram["showLabel"];

                }
                if (options.dataViews[0].metadata.objects["Legend"]) {
                    var legend = options.dataViews[0].metadata.objects["Legend"];
                    if (legend.legendPosition !== undefined) this.legendPosition = legend["legendPosition"];
                    if (legend.fontSize !== undefined) this.legendFontSize = legend["fontSize"];
                    if (legend.legendName !== undefined) this.legendName = legend["legendName"];

                }
            }
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'Basic':
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valFormat: this.valFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valPrecision: this.valPrecision }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showYAxis: this.showYAxis }, selector: null });

                    break;
                case 'Histogram':
                    objectEnumeration.push({ objectName: objectName, properties: { showAs: this.showAs }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { binCount: this.binCount }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                    if (!this.hasGroup) objectEnumeration.push({ objectName: objectName, properties: { barFill: this.barFill }, selector: null });

                    break;

                case 'colorSelector':
                    if (this.hasGroup) {
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
                    if (this.hasGroup) {
                        objectEnumeration.push({ objectName: objectName, properties: { legendPosition: this.legendPosition }, selector: null });
                        if (this.hasGroup) objectEnumeration.push({ objectName: objectName, properties: { legendName: this.legendName }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.legendFontSize }, selector: null });

                    }
                    break;
            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}