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
        private dimension:any
        private hasXaxis:any = false;
        private hasYaxis: any = false;
        private hasValue: any = false;

        private xAxisIndex: any;
        private yAxisIndex: any;
        private valueIndex: any;



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
       

       constructor(options: VisualConstructorOptions) {
           
           this.element = d3.select(options.element);
           this.host = options.host;
           this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
           this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
           this.columns = options.dataViews[0].metadata.columns;
            

           if (options.dataViews[0].metadata.objects) {
               if (options.dataViews[0].metadata.objects["Actual"]) {
                   var actObj = options.dataViews[0].metadata.objects["Actual"];
                   //if (actObj.showActual !== undefined) this.showActual = actObj["showActual"];
               }
              
            }
            console.log(this.columns);
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
            console.log(options.dataViews[0].table.rows);
            console.log(this.xAxisIndex, this.yAxisIndex, this.valueIndex)
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

            var dimension = this.getDimensions(options.viewport);

            //console.log(dimension);
            var chartSvg = chartContainer
                .append("svg")
                .attr("height", dimension.height)
                .attr("width", dimension.width);

            var xScale = this.setXScale(data, dimension);
            var yScale = this.setYScale(data, dimension);

            this.drawXScale(xScale, chartSvg, dimension);
            this.drawYScale(yScale, chartSvg, dimension);
            this.drawHeatRect(chartSvg, xScale, yScale, data, dimension);
        }
        private getDimensions(vp) {
            return {
                width: vp.width,
                height: vp.height,
                xOffset: 150,
                yOffset: 50,
                chartWidth: vp.width - 150,
                chartHeight: vp.height - 50,
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
            var xaxis = d3.svg.axis().scale(xScale).orient("top");

            chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")")
                .attr("class", "axis")
                .call(xaxis)

           
        }

        private drawYScale(yScale, chartSvg, dimension) {
            var yaxis = d3.svg.axis().scale(yScale).orient("left");

            chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")")
                .attr("class", "axis")
                .call(yaxis)

        }

        private drawHeatRect(chartSvg, xScale, yScale, data, dimension) {

            var heatG = chartSvg
                .append("g")
                .attr("transform", "translate(" + dimension.xOffset + "," + dimension.yOffset + ")");

            heatG.selectAll(".rects")
                .data(data)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.xValue))
                .attr("y", d => yScale(d.yValue))
                .attr("height", d => yScale.rangeBand()-1)
                .attr("width", d => xScale.rangeBand()-1);


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
                case 'Actual':
                    val = data.actual;
                    break;
                case 'Target':
                    val = data.target;
                    break;
                case 'Change':
                    val = data.change;
                    break;
                case 'perChange':
                    val = data.perChange;
                    break;
                case 'Prior':
                    val = data.values[data.values.length - 2].yValue;
                    break;
                case 'Variance':
                    val = data.variance;
                    break;
                case 'VariancePer':
                    val = data.variancePer;
                    break;
            }

            retData.push({
                displayName: data.key,
                value: val.toString(),
                header: data.key
            });
           
            return retData;
        }

       public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
          
            switch (objectName) {
                case 'Actual':
                   // objectEnumeration.push({ objectName: objectName, properties: { showActual: this.showActual}, selector: null });
                 
                    break;
               
                    
            };
           

            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}