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

        private iValueFormatter:any;
        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private sparklineSelection: d3.Selection<SVGElement>;
        private sparklineMarker: d3.Selection<SVGElement>;
        private sparklineMarkerLine: d3.Selection<SVGElement>;
        private sparklineCaptionName: d3.Selection<SVGElement>;
        private sparklineCaptionValue: d3.Selection<SVGElement>;


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

        
        private heatColor: any = "Heat";

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
                          
            //console.log(options);

            var dimension = this.getDimensions(options.viewport,data);

            //console.log(dimension);
            var chartSvg = chartContainer
                .append("svg")
                .attr("height", dimension.height)
                .attr("width", dimension.width);

            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);

            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension);
            var colorScale = this.setHeatScale(data);
            this.drawHeatRect(chartSvg, xScale, yScale, data, dimension);
        }
        private getDimensions(vp,data) {

            let xdata = data.map(d => d.xValue);
            let ydata = data.map(d => d.yValue);
            let yScale = d3.scale.ordinal().domain(ydata);
            let xDomain = d3.scale.ordinal().domain(xdata).domain();
            let yDomain = yScale.domain();
           
            let xT:any = this.axisLabelArray(xDomain.slice(0), vp.width, this.element, "Vertical");
            let yT: any = this.axisLabelArray(yDomain.slice(0), vp.height, this.element, "Horizontal");
            
            console.log(xT);
            console.log(yT);

            let xOffset = yT.Space + 15;
            let yOffset = xT.Space + 15;
            let chartWidth = vp.width - xOffset;
            let chartHeight = vp.height - yOffset;

            yScale.rangeRoundBands([0, chartHeight]);

            console.log((chartHeight / yDomain.length) , yScale.rangeBand())
            let xFilter = (xT.Rotate === true) ? Math.round((xDomain.length / chartWidth * 100) / 2) : 1;
            let yFilter = ((chartHeight / yDomain.length) < 15) ? Math.round((yDomain.length / chartHeight * 100) / 4) : 1;
           
            let xTickval = xDomain.filter((d, i) => (i % xFilter === 0));
            let yTickval = yDomain.filter((d, i) => (i % yFilter === 0));
           
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

            var xAxisG = chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")")
                .attr("class", "axis")
                .call(xaxis)

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

        private drawYScale(yScale, chartSvg, dimension) {
            var self = this;
            var yaxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickValues(dimension.yTickval);

           var yAxisG = chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")")
                .attr("class", "axis")
                .call(yaxis)

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

            if ((this.heatRange % 2) !== 0) {
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

                    this.colorScale[d.key] = d3.scale.quantile()
                                                    .domain(heatDomain)
                                                    .range(colorRange);

                });

            };

            return colorScale;

        }

        private drawHeatRect(chartSvg, xScale, yScale, data, dimension) {

            var heatG = chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")");

            var rects =  heatG.selectAll(".rects")
                .data(data)
                .enter()
                .append("rect")
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


        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any, vtype:any): VisualTooltipDataItem[] {
            var retData = [];
            var val = '';
            switch (vtype) {
                case 'Current':
                    val = data.values[data.values.length - 1].yValue;
                    break;
               
            }

            retData.push({
                displayName: data.key,
                value: val.toString(),
                header: data.key
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
                   
                    break;
               
                    
            };
           

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}