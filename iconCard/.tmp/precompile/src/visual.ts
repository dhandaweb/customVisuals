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


module powerbi.extensibility.visual.iconCardCCFC224D9885417F9AAF5BB8D45B007E  {
    "use strict";

    export class Visual implements IVisual {

        private host: IVisualHost;
        //  private tooltipServiceWrapper: ITooltipServiceWrapper;

        private selectionManager: ISelectionManager;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;

        private columns: any;

        private selectedTemplate: any = "textCard";

        private actualHeader: any = "";
        private actualIndex: number;
        private hasActual: any;
        private actValueFormatter: any;
        private actualCaptionFontSize: any = 16;
        private actualValFontSize: any = 36;
        private actualValFormat: any = "default";
        private actualValPrecision: any = 0;

        private targetIndex: number;
        private hasTarget: any;
        private targetHeader: any = "";
        private targetValueFormatter: any;
        private targetFontSize: any = 11;
        private targetValFormat: any = "default";
        private targetValPrecision: any = 0;

        private element: d3.Selection<SVGElement>;
        private container: d3.Selection<SVGElement>;

        private stausIcon: any = 'arrow';
        private stausFontSize: any = 70;
        private bulletFill: any = { solid: { color: "#01b8aa" } };

        private chartData: any;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private TooltipEventArgs: any;
        public TooltipEnabledDataPoint: any;

        private showBorder: any = true;

        private icon: any = 'send';
        private iconColor: any = { solid: { color: "#ffffff" } };
        private iconBgColor: any = { solid: { color: "#01b8aa" } };
        
        private iconSize: any = 70;

        constructor(options: VisualConstructorOptions) {

            this.element = d3.select(options.element);
            this.host = options.host;
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.selectionManager = options.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {
            this.columns = options.dataViews[0].metadata.columns;

            if (options.dataViews[0].metadata.objects) {
                if (options.dataViews[0].metadata.objects["displayTemplate"]) {
                    var displayTemplateObj = options.dataViews[0].metadata.objects["displayTemplate"];
                    if (displayTemplateObj["selectedTemplate"] !== undefined) this.selectedTemplate = displayTemplateObj["selectedTemplate"];
                    if (displayTemplateObj["showBorder"] !== undefined) this.showBorder = displayTemplateObj["showBorder"];

                }
                if (options.dataViews[0].metadata.objects["actual"]) {
                    var actualObj = options.dataViews[0].metadata.objects["actual"];
                    if (actualObj["actualHeader"] !== undefined) this.actualHeader = actualObj["actualHeader"];
                    if (actualObj["actualCaptionFontSize"] !== undefined) this.actualCaptionFontSize = actualObj["actualCaptionFontSize"];
                    if (actualObj["fontSize"] !== undefined) this.actualValFontSize = actualObj["fontSize"];
                    if (actualObj["actualValFormat"] !== undefined) this.actualValFormat = actualObj["actualValFormat"];
                    if (actualObj["actualValPrecision"] !== undefined) this.actualValPrecision = actualObj["actualValPrecision"];

                }
                if (options.dataViews[0].metadata.objects["target"]) {
                    var targetObj = options.dataViews[0].metadata.objects["target"];
                    if (targetObj["targetHeader"] !== undefined) this.targetHeader = targetObj["targetHeader"];
                    if (targetObj["fontSize"] !== undefined) this.targetFontSize = targetObj["fontSize"];
                    if (targetObj["targetValFormat"] !== undefined) this.targetValFormat = targetObj["targetValFormat"];
                    if (targetObj["targetValPrecision"] !== undefined) this.targetValPrecision = targetObj["targetValPrecision"];
                }
                if (options.dataViews[0].metadata.objects["status"]) {
                    var statusObj = options.dataViews[0].metadata.objects["status"];
                    if (statusObj["stausIcon"] !== undefined) this.stausIcon = statusObj["stausIcon"];
                    if (statusObj["bulletFill"] !== undefined) this.bulletFill = statusObj["bulletFill"];
                    if (statusObj["stausFontSize"] !== undefined) this.stausFontSize = statusObj["stausFontSize"];

                }
                if (options.dataViews[0].metadata.objects["icon"]) {
                    var iconObj = options.dataViews[0].metadata.objects["icon"];
                    if (iconObj["icon"] !== undefined) this.icon = iconObj["icon"];
                    if (iconObj["iconColor"] !== undefined) this.iconColor = iconObj["iconColor"];
                    if (iconObj["iconBgColor"] !== undefined) this.iconBgColor = iconObj["iconBgColor"];
                    if (iconObj["iconSize"] !== undefined) this.iconSize = iconObj["iconSize"];

                }
               
            }

            this.hasTarget = false;
            this.hasActual = false;

            this.columns.forEach((d, i) => {
                if (d.roles["target"]) {
                    this.hasTarget = true;
                    this.targetIndex = i;
                }
                if (d.roles["actual"]) {
                    this.hasActual = true;
                    this.actualIndex = i;
                }
            });
            

            this.element.style("overflow", "auto");
            this.element.select('.iconCard').remove();

            var container = this.element
                .append("div")
                .attr("class", "iconCard")
                .attr("style", "width:100%;text-align:left;border-spacing:0")
                .attr("style", 'color:rgb(102, 102, 102);font-family: "Segoe UI", wf_segoe-ui_normal, helvetica, arial, sans-serif');

            if (this.hasActual === false) {
                container
                    .append("html")
                    .attr("style", "")
                    .html("Data is missing to draw the visual");
                return;
            }

            var data = [];

            var act;
            var target;
           
            options.dataViews[0].table.rows.forEach((d: any, i) => {
                act = d[this.actualIndex];
                if (d[this.targetIndex] !== undefined) target = d[this.targetIndex];
            });
          
            var actHeader = this.actualHeader.length === 0 ? this.columns[this.actualIndex].displayName : this.actualHeader;

            this.columns.forEach((d, i) => {
                if (d.roles["target"]) this.targetValueFormatter = this.getValueFormat(d.format, target, this.targetValFormat, this.targetValPrecision );
                if (d.roles["actual"]) this.actValueFormatter = this.getValueFormat(d.format, act, this.actualValFormat, this.actualValPrecision );
               
            });

            this.chartData = [{
                actual: { header: actHeader, value: act, caption: this.actValueFormatter.format(act) },
                height: options.viewport.height,
                width: options.viewport.width,
            }];
          
            if (this.hasTarget) {
                var targetHeader = this.targetHeader.length === 0 ? this.columns[this.targetIndex].displayName : this.targetHeader;
                this.chartData = [{
                    actual: { header: actHeader, value: act, caption: this.actValueFormatter.format(act) },
                    target: { header: targetHeader, value: target, caption: this.targetValueFormatter.format(target) },
                    height: options.viewport.height,
                    width: options.viewport.width,
                }];
            }
            

            var table = container
                .data(this.chartData)
                .append("table")
                .attr("style", "width:100%;padding:4px;height:" + options.viewport.height + "px;");

            var tbody = table.append("tbody");


            switch (this.selectedTemplate) {

                case "textCard":
                    this.drawActualTarget(tbody);
                    break;

                case "textCard2":
                    this.drawTargetActual(tbody);
                    break;

                case "status":
                    this.status(tbody);
                    break;

                case "leftIcon":
                    table.style("padding", "0px");
                    this.leftIcon(tbody);
                    break;

                case "rightIcon":
                    table.style("padding", "0px");
                    this.rightIcon(tbody);
                    break;

            }
          
            this.setBorder(table);
        }

        private drawActualTarget(container) {
            var row1 = container.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
            var row2 = container.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
           

            this.drawActualHeader(row1);
            this.drawActual(row2);
            if (this.hasTarget) {
                var row3 = container.append("tr").append("td").attr("style", "text-align:right;vertical-align:bottom;");
                this.drawTarget(row3);
            }

        }

        private drawTargetActual(container) {
            var row1 = container.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
            var row2 = container.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");

            this.drawActual(row1);
            this.drawActualHeader(row2);

            if (this.hasTarget) {
                var row3 = container.append("tr").append("td").attr("style", "text-align:right;vertical-align:bottom;");
                this.drawTarget(row3);
            }
        }

        private status(container) {

            if (this.hasTarget) {
                var row1 = container.append("tr").append("td").attr("style", "text-align:left;vertical-align:middle;");
                var row2 = container.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
                var row3 = container.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
                var row4 = container.append("tr").append("td").attr("style", "text-align:right;vertical-align:bottom;");

                this.drawActualHeader(row1);

                this.drawStatusIcon(row2);
                this.drawActual(row3);

                this.drawStatus(row4);
            }
            else {
                container.append("span").html("Actual and target is required to draw status card.")
            }
        }

        private leftIcon(container) {
            var row1 = container.append("tr");
            
            var iconCon = row1.append("td").attr("style", "text-align:center;vertical-align:middle;background:" + this.iconBgColor.solid.color + ";");
            var actTable = row1.append("td").append("table").attr("style","height:100%;width:100%");

            var actualHeader = actTable.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
          
            var actualCon = actTable.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
          

            this.drawIcon(iconCon);
            this.drawActualHeader(actualHeader);
            this.drawActual(actualCon);
            if (this.hasTarget) {
                var row2 = actTable.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
                this.drawTarget(row2);
            }
           
        }

        private rightIcon(container) {
            var row1 = container.append("tr");

         
            var actTable = row1.append("td").append("table").attr("style", "height:100%;width:100%");

            var actualHeader = actTable.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");

            var actualCon = actTable.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
           
            var iconCon = row1.append("td").attr("style", "text-align:center;vertical-align:middle;background:" + this.iconBgColor.solid.color + ";");
            this.drawIcon(iconCon);
            this.drawActualHeader(actualHeader);
            this.drawActual(actualCon);

            if (this.hasTarget) {
                var row2 = actTable.append("tr").append("td").attr("style", "text-align:center;vertical-align:middle;");
                this.drawTarget(row2);
            }
           
        }

        private backgroundIcon(container) {
            container.append("html").html(d => d.actual.display);
        }

        private drawActualHeader(container) {
            container
                .style("font-size", this.actualCaptionFontSize + "px")
                .html(d => d.actual.header);
        }

        private drawActual(container) {
            container
                .style("font-size", this.actualValFontSize + "px")
                .html(d => d.actual.caption);
        }

        private drawTarget(container) {

            container
                .style("font-size", this.targetFontSize + "px")
                .html(d => d.target.header + " : " + d.target.caption);
        }

        private drawStatusIcon(container) {

            let icons = ["arrow_upward", "arrow_downward"];

            switch (this.stausIcon) {

                case "arrow":
                    icons = ["arrow_upward", "arrow_downward"]
                    break;
                case "tick":
                    icons = ["done", "clear"]
                    break;
                case "mood":
                    icons = ["sentiment_satisfied", "sentiment_dissatisfied"]
                    break;
                case "thumb":
                    icons = ["thumb_up_alt", "thumb_down_alt"]
                    break;
            }

            let html = this.chartData[0].actual.value > this.chartData[0].target.value ? icons[0] : icons[1];

            container
                .append("span")
                .html(html)
                .attr("class", "material-icons")
                .style("font-size", this.stausFontSize + "px");

        }

        private drawIcon(container) {

            container
                .append("span")
                .html(this.icon)
                .attr("class", "material-icons")
                .style("font-size", this.iconSize + "px")
                .style("color", this.iconColor.solid.color);
            
        }

        private drawStatus(container) {

            var targetMax = this.chartData[0].target.value;
            var actualMax = this.chartData[0].actual.value;
            var min = 0;
            var backgroundBarLen = d3.max([targetMax, actualMax]) * 1.15;
            var width = this.chartData[0].width - 20;
            var barScale = d3.scale.linear().range([0, width]).domain([min, backgroundBarLen]);


            var bullet = container
                .append("svg")
                .attr("width", width)
                .attr("height", 9)
                .attr("class", "bullet");

            bullet.append("rect")
                .attr("y", 2)
                .attr("width", width)
                .attr("height", 5)
                .attr("style", "fill:#d0cece;")

            var bulletRect = bullet
                .append("rect")
                .attr("y", 2)
                .attr("width", barScale(actualMax))
                .attr("height", 5)
                .attr("fill", this.bulletFill.solid.color);

            bullet.append("rect")
                .attr("width", 2)
                .attr("x", barScale(targetMax))
                .attr("height", 9)
                .attr("style", "fill:#000;");
        }

        private setBorder(table) {

            if (this.showBorder) {
                table.style("border", "1px solid #b3b3b3");
            }

        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private getTooltipData(data: any, vtype: any): VisualTooltipDataItem[] {
            var retData = [];
            var val = '';
            switch (vtype) {
                case 'Needed':
                    val = this.chartData.needed.value;
                    break;
                case 'Actual':
                    val = this.chartData.actual.value;
                    break;
                case 'Target':
                    val = this.chartData.target.value;
                    break;

            }

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
            }

            iValueFormatter = valueFormatter.create({ format: val, value: valF, precision: precision });

            return iValueFormatter;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {

            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'displayTemplate':
                    objectEnumeration.push({ objectName: objectName, properties: { selectedTemplate: this.selectedTemplate }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { showBorder: this.showBorder }, selector: null });

                    break;

                case 'actual':
                    objectEnumeration.push({ objectName: objectName, properties: { actualHeader: this.actualHeader }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualCaptionFontSize: this.actualCaptionFontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.actualValFontSize }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualValFormat: this.actualValFormat }, selector: null });
                    objectEnumeration.push({ objectName: objectName, properties: { actualValPrecision: this.actualValPrecision }, selector: null });
                    break;

                case 'target':
                    if (this.hasTarget) {
                        objectEnumeration.push({ objectName: objectName, properties: { targetHeader: this.targetHeader }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { fontSize: this.targetFontSize }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { targetValFormat: this.targetValFormat }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { targetValPrecision: this.targetValPrecision }, selector: null });
                    }
                 
                    break;

                case 'status':
                    if (this.selectedTemplate === 'status') {
                        objectEnumeration.push({ objectName: objectName, properties: { stausIcon: this.stausIcon }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { bulletFill: this.bulletFill }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { stausFontSize: this.stausFontSize }, selector: null });
                    }

                    break;
                case 'icon':
                    if (this.selectedTemplate === 'leftIcon' || this.selectedTemplate === 'rightIcon') {
                        objectEnumeration.push({ objectName: objectName, properties: { icon: this.icon }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { iconColor: this.iconColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { iconBgColor: this.iconBgColor }, selector: null });
                        objectEnumeration.push({ objectName: objectName, properties: { iconSize: this.iconSize }, selector: null });
                    }
                  
                    break;
            };


            return objectEnumeration;
            //return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}