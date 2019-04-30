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
        private barFill: any = { solid: { color: "rgb(69, 168, 168)" } };

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            this.setProperties(options);

            this.hasValues = false;
            this.hasGroup = false;

            this.columns.forEach((d, i) => {
                if (d.roles["group"]) {
                    this.hasGroup = true;
                    this.groupIndex = i;
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

            if (this.hasValues === false || this.hasGroup === false) {
                container
                    .append("html")
                    .attr("style", "")
                    .html("Data is missing to draw the visual");
                return;
            }

            var data = [];

            options.dataViews[0].table.rows.forEach((d: any, i) => {
                data.push({ val: d[this.valuesIndex], group: d[this.groupIndex] })
            });

            var chart = container
            .attr("style","fill: rgb(102, 102, 102); font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;")
                .append("svg")
                .attr("height", options.viewport.height)
                .attr("width", options.viewport.width)
                .append("g")
                .attr("transform", "translate(20,20)")

            var leftOffset = 15;
            this.drawHistrogram(data, options.viewport.height - 50, options.viewport.width - 40 - leftOffset, chart, leftOffset);
        }


        private drawHistrogram(data, height, width, svg, leftOffset) {
            var values = data.map(d => d.val);
            var max = d3.max(values);
            var min = d3.min(values);

            var xScale = d3.scale.linear()
                .domain([min, max])
                .range([0, width]);

            var data: any = d3.layout.histogram()
                .bins(this.binCount)
                (values);

            var yMax = d3.max(data, function (d: any) { return d.length });
            var yMin = d3.min(data, function (d: any) { return d.length });

            var yScale = d3.scale.linear()
                .domain([0, yMax])
                .range([height, 0]);

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d: any) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });

            this.drawBars(bar, data, xScale, yScale, height, leftOffset);

            this.drawDataLabel(bar, xScale, data,leftOffset);

            this.drawXAxis(svg, height, xScale, min, max, leftOffset);

            this.drawYAxis(svg, yScale, leftOffset);

            this.setFontSize(svg);
        }

        private drawBars(bar, data, xScale, yScale, height, leftOffset) {

            var rects = bar.append("rect")
                .attr("x", leftOffset + 1)
                .attr("width", (xScale(data[0].dx) - xScale(0)) - 2)
                .attr("height", function (d: any) { return height - yScale(d.y); })
                .attr("fill", this.barFill.solid.color);

            this.tooltipServiceWrapper.addTooltip(rects,
                (tooltipEvent: TooltipEventArgs<any>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<any>) => null
            );

        }

        private drawXAxis(svg, height, xScale, min, max, leftOffset) {

            var format: any = this.getValueFormat(this.valuesFormatter, max, this.valFormat, this.valPrecision);
            var tickValues = [];

            var step = (max - min) / this.binCount;
            var i;
            for (i = 0; i < (this.binCount + 1); i++) {
                tickValues.push(min + (i * step))
            };

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickFormat(format.format)
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

        private drawDataLabel(bar, xScale, data,leftOffset) {

            if (this.showLabel == true) {
                bar.append("text")
                    .attr("dy", ".75em")
                    .attr("y", -10)
                    .attr("x", (leftOffset + (xScale(data[0].dx) - xScale(0)) / 2))
                    .attr("text-anchor", "middle")
                    .text((d: any) => d.y == 0 ? "" : d.y);
            }

        }

        private setFontSize(chartSvg) {

            chartSvg.selectAll("text").style("font-size", this.fontSize + "px");
        }
        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any): VisualTooltipDataItem[] {
            var retData = [];
            var val = '';

            retData.push({
                displayName: data.dx,
                value: val.toString(),
                header: data.y
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
                    if (basic.binCount !== undefined) this.binCount = basic["binCount"];
                    if (basic.showLabel !== undefined) this.showLabel = basic["showLabel"];
                    if (basic.showYAxis !== undefined) this.showYAxis = basic["showYAxis"];
                    if (basic.barFill !== undefined) this.barFill = basic["barFill"];

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
                    objectEnumeration.push({ objectName: objectName, properties: { binCount: this.binCount }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showYAxis: this.showYAxis }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { barFill: this.barFill }, selector: null });

                    break;
            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}