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

   
        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            if (options.dataViews[0].metadata.objects) {
            
            }

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
                data.push({ val: d[this.valuesIndex], group: d[this.groupIndex]})
            });

            var chart = container
                .append("svg")
                .attr("height", options.viewport.height)
                .attr("width", options.viewport.width)
                .append("g")
            .attr("transform","translate(20,20)")

            console.log(data);
            this.drawHistrogram(data, options.viewport.height-50, options.viewport.width-20, chart);
        }

       
        private drawHistrogram(data, height, width, svg) {
            var values = data.map(d => d.val);
            var max = d3.max(values);
            var min = d3.min(values);
            var x = d3.scale.linear()
                .domain([min, max])
                .range([0, width]);

            // Generate a histogram using twenty uniformly-spaced bins.
            var data:any = d3.layout.histogram()
                .bins(x.ticks(20))
                (values);

            var yMax = d3.max(data, function (d:any) { return d.length });
            var yMin = d3.min(data, function (d:any) { return d.length });

            var y = d3.scale.linear()
                .domain([0, yMax])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d:any) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", (x(data[0].dx) - x(0)) - 1)
                .attr("height", function (d: any) { return height - y(d.y); })
                .attr("fill","rgb(1, 184, 170)")

            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", -15)
                .attr("x", (x(data[0].dx) - x(0)) / 2)
                .attr("text-anchor", "middle")
                .text((d:any) => d.y);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
        }
      

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any, vtype: any): VisualTooltipDataItem[] {
            var retData = [];
            var val = '';

            retData.push({
                displayName: vtype,
                value: val.toString(),
                header: vtype
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

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'displayTemplate':
                  
                    break;
            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}