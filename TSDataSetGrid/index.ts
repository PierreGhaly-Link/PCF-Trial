﻿/*
	This file is part of the Microsoft PowerApps code samples. 
	Copyright (C) Microsoft Corporation.  All rights reserved. 
	This source code is intended only as a supplement to Microsoft Development Tools and/or  
	on-line documentation.  See these other materials for detailed information regarding  
	Microsoft code samples. 

	THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER  
	EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF  
	MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE. 
 */


import { IInputs, IOutputs } from "./generated/ManifestTypes";

import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
type DataSet = ComponentFramework.PropertyTypes.DataSet;

// Define const here
const RowRecordId: string = "rowRecId";

// Style name of Load More Button
const DataSetControl_LoadMoreButton_Hidden_Style = "DataSetControl_LoadMoreButton_Hidden_Style";

export class TSDataSetGrid implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    // Cached context object for the latest updateView
    private contextObj: ComponentFramework.Context<IInputs>;

    // Div element created as part of this control's main container
    private mainContainer: HTMLDivElement;

    // Div element created as part of this control's title container
    private titleContainer: HTMLDivElement;

    // Div element created as part of this control's resolved button
    private resolvedButton: HTMLButtonElement;

    // Div element created as part of this control's closed button
    private closedButton: HTMLButtonElement;

    // Div element created as part of this control's new button
    private newButton: HTMLButtonElement;

    // Table element created as part of this control's table
    private gridContainer: HTMLDivElement;

    // DataSets
    private dataSetNew: DataSet;
    private dataSetClosed: DataSet;
    private dataSetResolved: DataSet;

    // Button element created as part of this control
    //private loadPageButton: HTMLButtonElement;

    /**
     * Empty constructor.
     */
    constructor() {

    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
        // Need to track container resize so that control could get the available width. The available height won't be provided even this is true
        context.mode.trackContainerResize(true);

        // Create main table container div. 
        this.mainContainer = document.createElement("div");

        // Create title container div.
        this.titleContainer = document.createElement("div");

        this.newButton = document.createElement("button");
        this.newButton.textContent = "New cases (" + context.parameters.dataSetGridNew.sortedRecordIds.length + ")";
        this.newButton.setAttribute("type", "button");
        this.newButton.addEventListener("click", this.reloadViewEvent.bind(this));

        this.resolvedButton = document.createElement("button");
        this.resolvedButton.textContent = "Resolved cases (" + context.parameters.dataSetGridResolved.sortedRecordIds.length + ")";
        this.resolvedButton.setAttribute("type", "button");
        this.resolvedButton.addEventListener("click", this.reloadViewEvent.bind(this));

        this.closedButton = document.createElement("button");
        this.closedButton.textContent = "Closed cases (" + context.parameters.dataSetGridClosed.sortedRecordIds.length + ")";
        this.closedButton.setAttribute("type", "button");
        this.closedButton.addEventListener("click", this.reloadViewEvent.bind(this));

        this.titleContainer.appendChild(this.newButton);
        this.titleContainer.appendChild(this.resolvedButton);
        this.titleContainer.appendChild(this.closedButton);

        // Create data table container div. 
        this.gridContainer = document.createElement("div");
        this.gridContainer.classList.add("DataSetControl_grid-container");

        // Create data table container div. 
        //this.loadPageButton = document.createElement("button");
        //this.loadPageButton.setAttribute("type", "button");
        //this.loadPageButton.innerText = context.resources.getString("PCF_DataSetControl_LoadMore_ButtonLabel");
        //this.loadPageButton.classList.add(DataSetControl_LoadMoreButton_Hidden_Style);
        //this.loadPageButton.classList.add("DataSetControl_LoadMoreButton_Style");
        //this.loadPageButton.addEventListener("click", this.onLoadMoreButtonClick.bind(this));

        // Adding the main table and loadNextPage button created to the container DIV.
        this.mainContainer.appendChild(this.titleContainer);
        this.mainContainer.appendChild(this.gridContainer);
        //this.mainContainer.appendChild(this.loadPageButton);
        this.mainContainer.classList.add("DataSetControl_main-container");
        container.appendChild(this.mainContainer);

        // Load Data @TODO
        //context.parameters.dataSetGridNew = this.dataSetNew;
    }


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>, color?: string, grid?: string): void {
        this.contextObj = context;

        var dataSet;
        switch (grid) {
            case 'new':
                dataSet = context.parameters.dataSetGridNew;
                break;
            case 'closed':
                dataSet = context.parameters.dataSetGridClosed;
                break;
            case 'resolved':
                dataSet = context.parameters.dataSetGridResolved;
                break;
            default:
                dataSet = context.parameters.dataSetGridNew;
                break;
        }

        //this.toggleLoadMoreButtonWhenNeeded(context.parameters.dataSetGrid);

        if (!(context.parameters.dataSetGridNew.loading || context.parameters.dataSetGridClosed.loading || context.parameters.dataSetGridResolved.loading)) {

            // Get sorted columns on View
            let columnsOnView = this.getSortedColumnsOnView(context, grid);

            if (!columnsOnView || columnsOnView.length === 0) {
                return;
            }

            while (this.gridContainer.firstChild) {
                this.gridContainer.removeChild(this.gridContainer.firstChild);
            }

            this.gridContainer.appendChild(this.createGridBody(context, columnsOnView, dataSet, color));
        }
        // this is needed to ensure the scroll bar appears automatically when the grid resize happens and all the tiles are not visible on the screen.
        this.mainContainer.style.maxHeight = window.innerHeight - this.gridContainer.offsetTop - 75 + "px";
    }

    /** 
     * It is called by the framework prior to a control receiving new data. 
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /** 
         * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
    }

    /**
     * Get sorted columns on view
     * @param context 
     * @return sorted columns object on View
     */
    private getSortedColumnsOnView(context: ComponentFramework.Context<IInputs>, grid?: string): DataSetInterfaces.Column[] {
        if (grid == 'new') {
            if (!context.parameters.dataSetGridNew.columns) {
                return [];
            }

            let columns = context.parameters.dataSetGridNew.columns
                .filter(function (columnItem: DataSetInterfaces.Column) {
                    // some column are supplementary and their order is not > 0
                    return columnItem.order >= 0
                }
                );
            // Sort those columns so that they will be rendered in order
            columns.sort(function (a: DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
                return a.order - b.order;
            });

            return columns;

        } else if (grid == 'closed') {
            if (!context.parameters.dataSetGridClosed.columns) {
                return [];
            }

            let columns = context.parameters.dataSetGridClosed.columns
                .filter(function (columnItem: DataSetInterfaces.Column) {
                    // some column are supplementary and their order is not > 0
                    return columnItem.order >= 0
                }
                );
            // Sort those columns so that they will be rendered in order
            columns.sort(function (a: DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
                return a.order - b.order;
            });

            return columns;

        } else if (grid == 'resolved') {
            if (!context.parameters.dataSetGridResolved.columns) {
                return [];
            }

            let columns = context.parameters.dataSetGridResolved.columns
                .filter(function (columnItem: DataSetInterfaces.Column) {
                    // some column are supplementary and their order is not > 0
                    return columnItem.order >= 0
                }
                );
            // Sort those columns so that they will be rendered in order
            columns.sort(function (a: DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
                return a.order - b.order;
            });

            return columns;
        } else {
            return [];
        }
    }

    /**
     * funtion that creates the body of the grid and embeds the content onto the tiles.
     * @param columnsOnView columns on the view whose value needs to be shown on the UI
     * @param gridParam data of the Grid
     */
    private createGridBody(context: ComponentFramework.Context<IInputs>, columnsOnView: DataSetInterfaces.Column[], gridParam: DataSet, color?: string): HTMLDivElement {

        let gridBody: HTMLDivElement = document.createElement("div");

        if (gridParam.sortedRecordIds.length > 0) {
            this.newButton.textContent = "New cases (" + context.parameters.dataSetGridNew.sortedRecordIds.length + ")";
            this.resolvedButton.textContent = "Resolved cases (" + context.parameters.dataSetGridResolved.sortedRecordIds.length + ")";
            this.closedButton.textContent = "Closed cases (" + context.parameters.dataSetGridClosed.sortedRecordIds.length + ")";


            for (let currentRecordId of gridParam.sortedRecordIds) {

                let gridRecord: HTMLDivElement = document.createElement("div");
                gridRecord.classList.add("DataSetControl_grid-item");
                //gridRecord.addEventListener("click", this.onRowClick.bind(this));

                // Set the recordId on the row dom
                gridRecord.setAttribute(RowRecordId, gridParam.records[currentRecordId].getRecordId());
                if (color != null)
                    gridRecord.style.backgroundColor = color;

                let icon = document.createElement("img");
                icon.setAttribute("src", "resources/icon.png");
                icon.setAttribute("alt", "Icon");
                icon.classList.add("icon-class");
                gridRecord.appendChild(icon);

                columnsOnView.forEach(function (columnItem, index) {
                    let labelPara = document.createElement("p");
                    labelPara.classList.add("DataSetControl_grid-text-label");

                    let valuePara = document.createElement("p");
                    valuePara.classList.add("DataSetControl_grid-text-value");

                    labelPara.textContent = columnItem.displayName + " : ";
                    gridRecord.appendChild(labelPara);
                    if (gridParam.records[currentRecordId].getFormattedValue(columnItem.name) != null && gridParam.records[currentRecordId].getFormattedValue(columnItem.name) != "") {
                        valuePara.textContent = gridParam.records[currentRecordId].getFormattedValue(columnItem.name);
                        gridRecord.appendChild(valuePara);
                    }
                    else {
                        valuePara.textContent = "-";
                        gridRecord.appendChild(valuePara);
                    }

                });

                gridBody.appendChild(gridRecord);
            }
        }
        else {
            let noRecordLabel: HTMLDivElement = document.createElement("div");
            noRecordLabel.classList.add("DataSetControl_grid-norecords");
            noRecordLabel.style.width = this.contextObj.mode.allocatedWidth - 25 + "px";
            noRecordLabel.innerHTML = this.contextObj.resources.getString("PCF_DataSetControl_No_Record_Found");
            gridBody.appendChild(noRecordLabel);
        }

        return gridBody;
    }


    /**
     * Row Click Event handler for the associated row when being clicked
     * @param event
     */
    //private onRowClick(event: Event): void {
    //	let rowRecordId = (event.currentTarget as HTMLTableRowElement).getAttribute(RowRecordId);

    //	if(rowRecordId)
    //	{
    //		let entityReference = this.contextObj.parameters.dataSetGrid.records[rowRecordId].getNamedReference();
    //		let entityFormOptions = {
    //			entityName: entityReference.name,
    //			entityId: entityReference.id.guid,
    //		}
    //		this.contextObj.navigation.openForm(entityFormOptions);
    //	}
    //}

    /**
     * Toggle 'LoadMore' button when needed
     */
    //private toggleLoadMoreButtonWhenNeeded(gridParam: DataSet): void{

    //	if(gridParam.paging.hasNextPage && this.loadPageButton.classList.contains(DataSetControl_LoadMoreButton_Hidden_Style))
    //	{
    //		this.loadPageButton.classList.remove(DataSetControl_LoadMoreButton_Hidden_Style);
    //	}
    //	else if(!gridParam.paging.hasNextPage && !this.loadPageButton.classList.contains(DataSetControl_LoadMoreButton_Hidden_Style))
    //	{
    //		this.loadPageButton.classList.add(DataSetControl_LoadMoreButton_Hidden_Style);
    //	}

    //}

    /**
     * 'LoadMore' Button Event handler when load more button clicks
     * @param event
     */
    //private onLoadMoreButtonClick(event: Event): void {
    //	this.contextObj.parameters.dataSetGrid.paging.loadNextPage();
    //	this.toggleLoadMoreButtonWhenNeeded(this.contextObj.parameters.dataSetGrid);
    //}

    /**
     * Reload cases according to types selected
     * @param event
     */
    private reloadViewEvent(event: Event): void {
        switch (event.target) {
            case this.newButton:
                this.updateView(this.contextObj, 'blue', 'new');
                break;
            case this.closedButton:
                this.updateView(this.contextObj, 'red', 'closed');
                break;
            case this.resolvedButton:
                this.updateView(this.contextObj, 'green', 'resolved');
                break;
            default:
                this.updateView(this.contextObj);
        }
    }
}