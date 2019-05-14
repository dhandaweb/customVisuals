
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


module powerbi.extensibility.visual.bubbleD9885417F9AAF5BB8D45B007E  {
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
        private colorPalette: any;

        private showLabel: any = false;

        private dotRadius: any = 6;
        private circleOpacity: any = 100;
        private circlestroke: any = 1;

        private orientation: any = "vertical";
        private fontSize: any = 11;

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            this.element.style("overflow", "hidden");
            this.element.select('.bubbleChart').remove();

            this.colorPalette.reset();

            this.draw(options);
        }

        public draw(options) {

            this.findAvailableMetadata(options.dataViews[0].metadata.columns);

            var chartContainer = this.element
                .append("div")
                .attr("class", "bubbleChart")
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
                });

            var chartSvg = chart.append("g")

            chartSvg.attr("transform", "translate(0," + 5 + ")");

            this.drawBubble(dimension, chartSvg, data);

        }

        public drawBubble(dimension, chartSvg, data) {

            var bubble = d3.layout.pack()
                .sort(null)
                .size([dimension.width, dimension.height])
                .padding(1.5);

            var data = this.formattedData.map(d => { return { packageName: d.xValue.value, color:d.color, className: d.xValue.value, value: d.yValue.value } });

            var bubbleData = bubble.nodes({ children: data })
         
            var node = chartSvg.selectAll(".node")
                .data(bubbleData.filter(d=> !d.children))
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", d=> "translate(" + d.x + "," + d.y + ")");

            node.append("circle")
                .attr("r", d=> d.r)
                .style("fill", d => d.color)

            node.append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .style("font-size", this.fontSize + "px")
                .style("pointer-events", "none")
                .style("fill",d=>this.gettextColor(d.color))
                .text(d=> d.className.substring(0, d.r / 4));

        }

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
            
                var valuesG = rawData.categorical.values.filter(d => d.source.roles.values);


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


                                return {
                                    xValue: { title: xMetadata.displayName, value: xAxis[j], caption: xAxis[j] },
                                    yValue: { title: d.source.displayName, value: t, caption: valFormat.format(t) },
                                    legend: d.source.groupName,
                                    selectionId: this.host.createSelectionIdBuilder().withCategory(rawData.categorical.categories[0], i).withSeries(rawData.categorical.values, rawData.categorical.values[i]).createSelectionId(),
                                    color: color,
                                    colorValue: { title: this.colorTitle, caption: d.source.groupName },
                                }
                            })
                        }
                    })

                }
                else {

                    formattedData = valuesG.map((d, i) => {

                        valFormat = this.getValueFormat(d.source.format, d3.max(d.values.map(d => d)));

                        return {
                            key: d.source.displayName,
                            // color: color,
                            iden: this.host.createSelectionIdBuilder().withMeasure(d.source.queryName).createSelectionId(),
                            values: d.values.map((t, j) => {
                                var color = this.colorPalette.getColor(xAxis[j]).value;

                                if (grouped[0].values[i].source.objects) {
                                    color = grouped[0].values[i].source.objects.colorSelector.fill.solid.color;
                                }

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

            var retData = formattedData;
            var yAxis = [];

            retData.map(d => {
                d.values.map(d => {
                    yAxis.push(d.yValue.value);
                })
            });


            this.formattedData = [];


            formattedData.forEach(d => {
                d.values.forEach(d => {
                    this.formattedData.push(d);
                })
            })

// console.log(formattedData);
// console.log("********Formatted Data *******");

            return { xAxis: xAxis, yAxis: yAxis, yFormat: valFormat.format, data: retData }
        }

        private setProperties(options) {

            if (options.dataViews[0].metadata.objects) {

                if (options.dataViews[0].metadata.objects["Basic"]) {
                    var basic = options.dataViews[0].metadata.objects["Basic"];
                    if (basic.dotRadius !== undefined) this.dotRadius = basic["dotRadius"];
                    if (basic.circlestroke !== undefined) this.circlestroke = basic["circlestroke"];
                    if (basic.circleOpacity !== undefined) this.circleOpacity = basic["circleOpacity"];
                    if (basic.showLabel !== undefined) this.showLabel = basic["showLabel"];
                    if (basic.orientation !== undefined) this.orientation = basic["orientation"];
                    if (basic.valFormat !== undefined) this.valFormat = basic["valFormat"];
                    if (basic.valPrecision !== undefined) this.valPrecision = basic["valPrecision"];
                }




                if (options.dataViews[0].metadata.objects["Axis"]) {
                    var axis = options.dataViews[0].metadata.objects["Axis"];
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

            });



        }

        private gettextColor(bgColor) {
           var lightColor:any = "#ffffff";
           var darkColor:any = "#000000";
            var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
            var r = parseInt(color.substring(0, 2), 16); // hexToR
            var g = parseInt(color.substring(2, 4), 16); // hexToG
            var b = parseInt(color.substring(4, 6), 16); // hexToB
            var uicolors = [r / 255, g / 255, b / 255];
            var c = uicolors.map((col) => {
              if (col <= 0.03928) {
                return col / 12.92;
              }
              return Math.pow((col + 0.055) / 1.055, 2.4);
            });
            var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
            return (L > 0.179) ? darkColor : lightColor;
          }

        private getDimensions(vp, data) {
            let xlegendOffset = 0;
            let ylegendOffset = 0;

            if (this.legendPosition == "right") ylegendOffset = 0;
            if (this.legendPosition == "top" || this.legendPosition === "bottom") xlegendOffset = 0;

            let xdata = data.xAxis;
            let xDomain = d3.scale.ordinal().domain(xdata).domain();

            let xT: any = this.axisLabelArray(xDomain.slice(0).filter(d => d !== null), (vp.width - this.getYOffset(data) - ylegendOffset), this.element, this.orientation);

            let xOffset, yOffset, chartWidth, chartHeight, xFilter, xTickval;

            xOffset = xT.Space + 20;
            if (xOffset > vp.height / 4) xOffset = vp.height / 4 > 100 ? 100 : vp.height / 4;
            yOffset = this.getYOffset(data);
            chartWidth = vp.width - yOffset - ylegendOffset;
            chartHeight = vp.height - xOffset - xlegendOffset;
            xFilter = (xT.Rotate === true) ? (chartWidth / xDomain.length < 12 ? (Math.ceil(xDomain.length / chartWidth * 20)) : 1) : 1;
            xTickval = xDomain.filter((d, i) => (i % xFilter === 0));



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

      



        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {

                case 'Basic':

                    objectEnumeration.push({ objectName: objectName, properties: { dotRadius: this.dotRadius }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circlestroke: this.circlestroke }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valFormat: this.valFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { valPrecision: this.valPrecision }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { circleOpacity: this.circleOpacity }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showLabel: this.showLabel }, selector: null });

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

                case 'Axis':
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.fontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { yAxisMinValue: this.yAxisMinValue }, selector: null });
                    break;




            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}