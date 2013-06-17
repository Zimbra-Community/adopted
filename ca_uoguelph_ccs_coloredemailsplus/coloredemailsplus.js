/*
 * Copyright 2011 University of Guelph - Computing and Communication Services
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Based on the work of Raja Rao, at Zimbra. Original License below.
 * @author Kennt Chan 
 * 
 * *******************************
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2008, 2009, 2010 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * @Author Raja Rao DV
 * ***** END LICENSE BLOCK ***** 
 */

function ca_uoguelph_ccs_coloredemailsplusHandlerObject() {
}
ca_uoguelph_ccs_coloredemailsplusHandlerObject.prototype = new ZmZimletBase();
ca_uoguelph_ccs_coloredemailsplusHandlerObject.prototype.constructor = ca_uoguelph_ccs_coloredemailsplusHandlerObject;

/**
 * Simplify handler object
 *
 */
var ColoredEmails = ca_uoguelph_ccs_coloredemailsplusHandlerObject;

/**
 * Initializes zimlet
 */
ColoredEmails.prototype.init = function() {
	this.areVariablesInitialized = false;
	this.initializeVariables();
	this.resetView();
};

ColoredEmails.prototype.CURRENT_LIMIT = 1024;

ColoredEmails.prototype.initializeVariables = function() {
	this.ENTRY_SEPARATOR = ",";
	this.COLORDATA_SEPARATOR = ":";
	this.TYPE_ATTR = "entryType";
	this.ROW_PREFIX = "row_";
	this.CHECKBOX_PREFIX = "chkbx_";
	this.COLOR_PREVIEW = "_cpr";
	this.PROPERTY_COLOR_PREFERENCES = "up_ce_emailColorPreferences";
	this.PROPERTY_USE_AUTO_ASSOCIATE = "up_ce_useAutoAssociate";
	this.PROPERTY_DEFAULT_COLOR = "up_ce_defaultColour";
	this.DEFAULT_EMAIL = this.getMessage("default_email");
	this.DEFAULT_COLOR_ID = "31415926535897";
	
	this.autoAddedEmailsList = new ColorPrefs();
	this.numSelectedRows = 0;
	
	this.resetVars();
	this.areVariablesInitialized = true;
};

// small set of colors to be used when automatic coloring is selected
ColoredEmails.prototype.AUTO_COLORS = [ "#FF0000","#CC6600","#006600","#6600CC","#660000","#009900","#666666","#330000","#663333","#000099","#330033","#CC33CC","#6666CC","#CC9933","#CC0000","#006600"];
ColoredEmails.prototype.getRandomColor = function() {
    return this.AUTO_COLORS[Math.floor(Math.random() * this.AUTO_COLORS.length)];
};

/**
 * Reset the variables of the dialog
 */
ColoredEmails.prototype.resetVars = function() {
	
	this.uprop_cEmail_manualAddedEmails = this.getUserProperty(this.PROPERTY_COLOR_PREFERENCES);
	this.uprop_cEmail_autoAssociateChkbx = this.getUserProperty(this.PROPERTY_USE_AUTO_ASSOCIATE) === "true";
	this.uprop_cEmail_defaultColour = this.getUserProperty(this.PROPERTY_DEFAULT_COLOR) === "true";
	this.coloredEmailsList = new ColorPrefs();
	this.loadEmails(this.uprop_cEmail_manualAddedEmails);
	this.currentlyEditedRow = null;
};

/**
 * Loads the emails from the string representation of the settings.
 */
ColoredEmails.prototype.loadEmails = function(list) {
	
	if (list) {
		var settingsArray = list.split(",");
		var numSettings = settingsArray.length;
		
		for (var i = 0; i < numSettings; i++) {
			var emailAndColors = settingsArray[i].split(":");
			var email = emailAndColors[0];
			
			if (email === this.DEFAULT_EMAIL) {
				continue;
			}
	
			if (emailAndColors.length >= 4) {
				var colorInfo = new ColorInfo(email, emailAndColors[1], emailAndColors[2], emailAndColors[3]);
				this.coloredEmailsList.add(colorInfo);
				if (colorInfo.getAuto() === ColorPrefs.prototype.AUTO) {
					this.autoAddedEmailsList.add(colorInfo);
				}
				if (emailAndColors.length === 5 && emailAndColors[4] === "1") {
				    colorInfo.setDefault(true);
				    this.coloredEmailsList.defaultColour = colorInfo;
				}				
			}
	}
	}
};

/**
 * Adds the email to the list of auto added ones and assigns it a color 
 * from the predefined palette.
 */
ColoredEmails.prototype.autoAddEmail = function(eml) {
	
	var colorsInfo = this.coloredEmailsList.getByEmail(eml);
	var autoColorsInfo = this.autoAddedEmailsList.getByEmail(eml);
	if (!colorsInfo && !autoColorsInfo) {
		autoColorsInfo = new ColorInfo(eml, ColorPrefs.prototype.AUTO, this.getRandomColor());
		this.autoAddedEmailsList.add(autoColorsInfo);
		// when the options is selected, saved the information of the auto added colors, might reuse timing function
		if (this.uprop_cEmail_autoAssociateChkbx) {
			var savedEmailsArray = this.getUserProperty(this.PROPERTY_COLOR_PREFERENCES);
			if (!savedEmailsArray || savedEmailsArray.length === 0) {
				savedEmailsArray = autoColorsInfo.toString();
			} else {
				savedEmailsArray += this.ENTRY_SEPARATOR + autoColorsInfo.toString();
			}
			this.setUserProperty(this.PROPERTY_COLOR_PREFERENCES, savedEmailsArray, true);
		}
	}
};

/**
 * Handles when a user adds or updates a tag.
 */
ColoredEmails.prototype.onTagAction = function(items, tag, doTag) {
	
	//basically refreshes the view to reflect new colors	
	try {
		var type = items[0].type;
		if (type !== null && (type === ZmItem.CONV || type === ZmItem.MSG)) {
			this.resetView();
		}
	} catch(e) {
	}
};

/**
 * Resets the inbox so the entries can be recolored
 */
ColoredEmails.prototype.resetView = function() {
	try {
		var q = appCtxt.getSearchController().currentSearch.query;
		appCtxt.getSearchController().search({query:q});
	} catch(e) {
	}
};

/**
* This function sets the style of the email in the mail box
*/
ColoredEmails.prototype.getMailCellStyle = function(item, field) {

	var eml = "";
	var tagName = "";
	try {
		if (item.type === ZmId.ITEM_CONV) {
			var arry = item.participants.getArray();
			if(arry.length >0) {
				eml = arry[arry.length - 1].address;
			}
		} else if (item.type === ZmId.ITEM_MSG) {
			var obj = item.getAddress(AjxEmailAddress.FROM);
			if(obj)
				eml = obj.address;
		} else {
			return null;
		}

		var tgs = item.tags;
		if (tgs.length > 0) {
			tagName = tgs[0].toLowerCase();
		}

	} catch(e) {
	}

	if (eml === "" && tagName === "") {
		return "";
	}

	//highest priority is for tags, then emails, followed by auto-added emails
	if (tagName !== "") {//if we might need to color based on tagName
		var colorsByTag = this.coloredEmailsList.getByEmail(tagName);
		if (colorsByTag) {
			return colorsByTag.getStyle();
		}
	}
	eml =  AjxStringUtil.trim(eml).toLowerCase();//trim and ignore case
	var colors = this.coloredEmailsList.getByEmail(eml);
	if (colors) {
		return colors.getStyle();
	} 

	this.autoAddEmail(eml);
	if (this.uprop_cEmail_autoAssociateChkbx) {
		colors = this.autoAddedEmailsList.getByEmail(eml);
		if (colors) {
			return (colors) ? colors.getStyle() : "";
		}
	}

	if (this.uprop_cEmail_defaultColour && this.coloredEmailsList.defaultColour) {
	    return this.coloredEmailsList.defaultColour.getStyle();
	}
	//return " style=\"color:#383838;\"";
	return "";
};

/**
 *	Handles a double click on the zimlet
 */
ColoredEmails.prototype.doubleClicked = function() {
	this.singleClicked();
};

/**
 *	Handles a single click on the zimlet
 */
ColoredEmails.prototype.singleClicked = function() {
	this.showPreferenceDlg();
};

/**
 * Handles the action of dropping an element in the zimlet label on the menu
 */
ColoredEmails.prototype.doDrop = function(msg) {
	
	if(msg instanceof Array) {
		msg = msg[0];
	}
	
	this.showPreferenceDlg();
	var tagName = "";
	var eml = "";

    if (msg instanceof ZmTag) {

		tagName = msg.name;

	} else {

        var from = msg.from;

        if (from) {
            eml = from[0].address;
        } else {
            eml = msg.participants[msg.participants.length - 1].address;
        }

    }

	if (eml === "" && tagName === "") {
		return;
	}

	document.getElementById("cEmail_emailField").value = tagName !== "" ? tagName : eml;
	document.getElementById("cEmail_exampleEmailNameTD").innerHTML = eml;

};

/**
 * Adds the zimlet components to the dialog and opens it.
 */
ColoredEmails.prototype.showPreferenceDlg = function() {
	
	//if zimlet dialog already exists...
	if (this.preferenceDialog) {
		this.enableControls(true);
		this.setZimletCurrentPreferences(true);
		this.preferenceDialog.popup();
		return;
	}
	this.preferenceView = new DwtComposite(this.getShell());
	this.preferenceView.setSize("450", "470");
	this.preferenceView.getHtmlElement().style.overflow = "auto";
	this.preferenceView.getHtmlElement().innerHTML = this.createPrefView();

	var pickrComposite = new DwtComposite(this.getShell());
	this.fontColorButton = new ZmHtmlEditorColorPicker(pickrComposite, null, "ZButton");
	this.fontColorButton.dontStealFocus();
	this.fontColorButton.setImage("FontColor");
	this.fontColorButton.showColorDisplay(true);
	this.fontColorButton.setToolTipContent(ZmMsg.fontColor);
	this.fontColorButton.addSelectionListener(new AjxListener(this, this.emailAndColorBtnListener));
	document.getElementById("cEmail_colorsMenuTD").appendChild(pickrComposite.getHtmlElement());

	var pickrBgComposite = new DwtComposite(this.getShell());
	this.fontBackgroundButton = new ZmHtmlEditorColorPicker(pickrBgComposite, null, "ZButton");
	this.fontBackgroundButton.dontStealFocus();
	this.fontBackgroundButton.setImage("FontBackground");
	this.fontBackgroundButton.showColorDisplay(true);
	this.fontBackgroundButton.setToolTipContent(ZmMsg.fontBackground);
	this.fontBackgroundButton.addSelectionListener(new AjxListener(this, this.emailAndColorBtnListener));
	document.getElementById("cEmail_colorsBgMenuTD").appendChild(pickrBgComposite.getHtmlElement());

	this.addButton = new DwtButton(this.getShell());
	this.addButton.setText(this.getMessage("add"));
	this.addButton.setToolTipContent(this.getMessage("add_tooltip"));
	this.addButton.addSelectionListener(new AjxListener(this, this.addButtonListener, true));
	document.getElementById("cEmail_AddBtnTD").appendChild(this.addButton.getHtmlElement());	
	
	this.editButton = new DwtButton(this.getShell());
	this.editButton.setText(this.getMessage("edit"));
	this.editButton.setToolTipContent(this.getMessage("edit_tooltip"));
	this.editButton.addSelectionListener(new AjxListener(this, this.editButtonListener, true));
	document.getElementById("cEmail_EditBtnTD").appendChild(this.editButton.getHtmlElement());
	
	this.delButton = new DwtButton(this.getShell());
	this.delButton.setText(this.getMessage("remove"));
	this.delButton.setToolTipContent(this.getMessage("remove_tooltip"));
	this.delButton.addSelectionListener(new AjxListener(this, this.delButtonListener, true));
	document.getElementById("cEmail_DelBtnTD").appendChild(this.delButton.getHtmlElement());	

	var saveButtonId = Dwt.getNextId();
	var saveButton = new DwtDialog_ButtonDescriptor(saveButtonId, (this.getMessage("save")), DwtDialog.ALIGN_RIGHT);
	this.preferenceDialog = this._createDialog({title:this.getMessage("dialog_title"), view:this.preferenceView, standardButtons:[DwtDialog.CANCEL_BUTTON], extraButtons:[saveButton]});
	this.preferenceDialog.setButtonListener(saveButtonId, new AjxListener(this, this.okPreferenceBtnListener));

	Dwt.setHandler(document.getElementById("cEmail_emailField"), DwtEvent.ONKEYUP, AjxCallback.simpleClosure(this.emailAndColorBtnListener, this));
	Dwt.setHandler(document.getElementById("cEmail_autoAssociateChkbx"), DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.useAutoAddedEmailsListener, this));
	Dwt.setHandler(document.getElementById("cEmail_defaultColourChkbx"), DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.useDefaultColoursListener, this));
	var headerCheckbox = document.getElementById("emailHeaderChkBox");
	Dwt.setHandler(headerCheckbox, DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.headerChkboxClickListener, this, headerCheckbox));
	
	//  create a reusable row used when editing
	this.editingRow = document.createElement("tr");
	var emailCell = document.createElement("td");
	emailCell.colSpan = "3";
	var contentTable = document.createElement("table");
	contentTable.className = "editingTable";
	contentTable.cellSpacing = "0";
	contentTable.cellPadding = "0";
	var contentTableBody = document.createElement("tbody");
	
	var contentTableRow = document.createElement("tr");
	
	var contentTableTxtCell = document.createElement("td");
	contentTableTxtCell.className = "editingTxt";	
	this.txtEditEmail = document.createElement("input");
	this.txtEditEmail.className = "txtEmail";	
	this.txtEditEmail.type = "text";
	contentTableTxtCell.appendChild(this.txtEditEmail);	
	contentTableRow.appendChild(contentTableTxtCell);
	
	var contentTableFColorCell = document.createElement("td");
	contentTableFColorCell.className = "editing";
	contentTableFColorCell.style.width = "62px";
	var editPickrComposite = new DwtComposite(this.getShell());
	this.fontColorEditButton = new ZmHtmlEditorColorPicker(editPickrComposite, null, "ZButton");
	this.fontColorEditButton.dontStealFocus();
	this.fontColorEditButton.setImage("FontColor");
	this.fontColorEditButton.showColorDisplay(true);
	this.fontColorEditButton.setToolTipContent(ZmMsg.fontColor);
	contentTableFColorCell.appendChild(editPickrComposite.getHtmlElement());
	contentTableRow.appendChild(contentTableFColorCell);
	
	var contentTableBColorCell = document.createElement("td");
	contentTableBColorCell.className = "editing";	
	contentTableBColorCell.style.width = "62px";
	var editPickrBgComposite = new DwtComposite(this.getShell());
	this.fontBackgroundEditButton = new ZmHtmlEditorColorPicker(editPickrBgComposite, null, "ZButton");
	this.fontBackgroundEditButton.dontStealFocus();
	this.fontBackgroundEditButton.setImage("FontBackground");
	this.fontBackgroundEditButton.showColorDisplay(true);
	this.fontBackgroundEditButton.setToolTipContent(ZmMsg.fontBackground);
	contentTableBColorCell.appendChild(editPickrBgComposite.getHtmlElement());	
	contentTableRow.appendChild(contentTableBColorCell);
	
	var contentTableBtnApplyCell = document.createElement("td");
	contentTableBtnApplyCell.className = "editingBtn";		
	var applyButton = new DwtButton(this.getShell());
	applyButton.setText(this.getMessage("apply"));
	applyButton.addClassName("editButton");
	applyButton.addSelectionListener(new AjxListener(this, this.applyEditButtonListener, true));
	contentTableBtnApplyCell.appendChild(applyButton.getHtmlElement());
	contentTableRow.appendChild(contentTableBtnApplyCell);
	
	contentTableBody.appendChild(contentTableRow);
	contentTable.appendChild(contentTableBody);
	emailCell.appendChild(contentTable);
	this.editingRow.appendChild(emailCell);
		
	this.setZimletCurrentPreferences();
	this.preferenceDialog.popup();
};

/**
 *	Creates the basic layout of the dialog.
 */
ColoredEmails.prototype.createPrefView = function() {
	
	var html = new Array();
	var i = 0;
	html[i++] = "<br>";
	html[i++] = "<div class='inputDiv'>";
	html[i++] = "<b>";
	html[i++] = this.getMessage("associate_label");
	html[i++] = "</b>";
	html[i++] = "</div>";
	html[i++] = "<table width=95% align='center'>";
	html[i++] = "<tr><TD width='16%' nowrap='nowrap'>Email or Tag:</td>";
	html[i++] = "<TD width=40%><input id='cEmail_emailField' type=\"text\" style=\"width:100%;\" type='text' value='" + this.DEFAULT_EMAIL + "'></input></td>";
	html[i++] = "<TD id='cEmail_colorsMenuTD'></td>";
	html[i++] = "<TD id='cEmail_colorsBgMenuTD'></td>";
	html[i++] = "<TD id='cEmail_AddBtnTD'></td></tr>";
	html[i++] = "</table>";
	html[i++] = "</div>";

	html[i++] = "<div>";
	html[i++] = "<table id='cEmail_exampleEmailTableID' class='cEmail_exampleEmailTable' align='center'>";
	html[i++] = "<tr><TD id='cEmail_exampleEmailNameTD'>" + this.DEFAULT_EMAIL + "</td>";
	html[i++] = "<td>";
	html[i++] = this.getMessage("email_example");
	html[i++] = "</td></tr>";
	html[i++] = "</table>";
	html[i++] = "</div>";
	//html[i++] = "<br>";
	html[i++] = "<div>";
	html[i++] = "<a href=\"#\" id='cEmail_showHideLnk'></a>";
	html[i++] = "</div>";

	html[i++] = "<table width=95% align='center'>";
	html[i++] = "<tr><td colspan='3'>&nbsp;</td></tr>";
		
	html[i++] = "<tr><td colspan='3'>";
	html[i++] = "<table class= 'emailListTable' cellspacing='0' cellpadding='0'>";
	html[i++] = "<tbody><tr><td class='emailListHeader headerChkbox'><input type='checkbox' id='emailHeaderChkBox'/></td><td class='emailListHeader' id='emailHeaderCell'>&nbsp;&nbsp;" + this.getMessage("addresses_tags") + "</td><td class='emailListHeader'>&nbsp;</td></tr></thead>";
	html[i++] = "</table>";
	
	html[i++] = "<div id='cManualAddedEmailsList' class='cEmailList'>";
	html[i++] = "<table class= 'emailListTable' cellspacing='0' cellpadding='0'>";
	html[i++] = "<tbody id='cManualAddedEmailsTable'></tbody></table>";
	html[i++] = "</div>";
	html[i++] = "</td></tr>";
	html[i++] = "<tr><td style='width:80%'>&nbsp;</td><td id='cEmail_EditBtnTD'></td><td id='cEmail_DelBtnTD'></td></tr>";	
	html[i++] = "</table>";
		
	html[i++] = "<table width=95% >";
	html[i++] = "<tr><td><input id='cEmail_defaultColourChkbx'  type='checkbox'/><b><label for='cEmail_defaultColourChkbx'>" +  this.getMessage("default_colour");
    html[i++] = "</label></b><br>" + this.getMessage("default_colour_desc") + "</td></tr>";
	html[i++] = "<tr><td><input id='cEmail_autoAssociateChkbx'  type='checkbox'/><b><label for='cEmail_autoAssociateChkbx'>" + this.getMessage("auto_color");
	html[i++] = "</label></b><br>" + this.getMessage("auto_color_desc") + "</td></tr>";
	html[i++] = "</td></tr>";
	html[i++] = "</table>";
	html[i++] = "<div>";
	html[i++] = "<br>";
	html[i++] = "<table  width=95%>";
	html[i++] = "</table>";
	html[i++] = "</div>";
	return html.join("");
};

/**
 * Sets the preferences in the dialog
 */
ColoredEmails.prototype.setZimletCurrentPreferences = function(reload) {

	if (!this.areVariablesInitialized) {
		this.initializeVariables();
	} else {
		this.resetVars();
	}

	//set the values to ui..
	if (this.uprop_cEmail_autoAssociateChkbx) {
		document.getElementById("cEmail_autoAssociateChkbx").checked = true;
	}
	if (this.uprop_cEmail_defaultColour) {
	    document.getElementById("cEmail_defaultColourChkbx").checked = true;
	}
	this.reloadEmailsTable();
	this.fontColorButton.setColor(this.getRandomColor());
	this.fontBackgroundButton.setColor("#FFFFFF");
	this.emailAndColorBtnListener();
};

/**
 * Creates all the <tr> elements for the table
 */
ColoredEmails.prototype.createRow = function(colorInfo) {
	
	var row = document.createElement("tr");
	row.title = this.getMessage("row_tooltip");
	
	var chkbxCell = document.createElement("td");
	chkbxCell.className = "listChkbox";
	chkbxCell.disabled = colorInfo.isDefault();
	
	var emailAdd = AjxStringUtil.trim(colorInfo.getEmail());
	
	if (!colorInfo.isDefault()) {
	    var chkbox = document.createElement("input");
	    chkbox.type = "checkbox";
	    chkbox.id = this.CHECKBOX_PREFIX + emailAdd;
	    chkbxCell.appendChild(chkbox);
	    
	    Dwt.setHandler(chkbox, DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.chkboxClickListener, this, row));
	}
	
	var emailCell = document.createElement("td");
	var colorPreviewCell = document.createElement("td");
	colorPreviewCell.className = "colorPreviewCell";
	emailCell.innerHTML = "<label for='" + this.CHECKBOX_PREFIX + emailAdd + "'>" + (colorInfo.isDefault() ? this.getMessage("default_colour_email") : AjxStringUtil.convertToHtml(emailAdd)) + "</label>";
	
	if (colorInfo.getAuto() === ColorPrefs.prototype.MANUAL) {
		emailCell.className = colorInfo.isDefault() ? "listEmailDefault" : "listEmail";
		emailCell.setAttribute(this.TYPE_ATTR, ColorPrefs.prototype.MANUAL);
	} else {
		emailCell.className = "listEmailAuto";
		emailCell.setAttribute(this.TYPE_ATTR, ColorPrefs.prototype.AUTO);
	}
	
	var previewContainer = document.createElement("div");
	previewContainer.className = "prContainer";
	previewContainer.innerHTML = "a";
	previewContainer.style.color = colorInfo.getFColor();
	previewContainer.id = emailAdd + this.COLOR_PREVIEW;
	var bgcolor = colorInfo.getBColor();
	if (bgcolor && bgcolor!== "white" && bgcolor !== "#FFFFFF" && bgcolor!="") {
		previewContainer.style.backgroundColor = bgcolor;
	}
	
	colorPreviewCell.appendChild(previewContainer);
	
	Dwt.setHandler(row, DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.rowSglClickListener, this, row));
	Dwt.setHandler(row, DwtEvent.ONDBLCLICK, AjxCallback.simpleClosure(this.rowDblClickListener, this, row));
	
	row.id = this.ROW_PREFIX + emailAdd;
	row.appendChild(chkbxCell);
	row.appendChild(emailCell);
	row.appendChild(colorPreviewCell);
	return row;
};

/**
 * Replaces a <tr> element with another one.
 
 */
ColoredEmails.prototype.replaceRow = function(newRow, oldRow) {
	var nextRow = oldRow.nextSibling;
	var parentTable = oldRow.parentNode;
	parentTable.removeChild(oldRow);
	if (nextRow) {
		parentTable.insertBefore(newRow, nextRow);
	} else {
		parentTable.appendChild(newRow);
	}
};

/**
 * Clears the html table
 */
ColoredEmails.prototype.clearTableNodes = function(listTable) {
	if (listTable.hasChildNodes()){
		while ( listTable.childNodes.length >= 1 ) {
			listTable.removeChild(listTable.firstChild);
		}
	}
};

/**
 * Adds the rows to the html table
 */
ColoredEmails.prototype.populateTableNodes = function(table, list) {
	var nodes = list.getOrderedArray();
	var numNodes = nodes.length;
	for (var i = 0; i < numNodes; i++) {
		var node = nodes[i];
		if (list.getByEmail(node.getEmail())) {
			table.appendChild(this.createRow(node));
		}
	}
};

/**
* Set the list of manually added emails.
*/
ColoredEmails.prototype.reloadEmailsTable = function() {
	var listTable = document.getElementById("cManualAddedEmailsTable");
	this.clearTableNodes(listTable);
	this.populateTableNodes(listTable, this.coloredEmailsList);
	this.numSelectedRows = 0;
	this.editButton.setEnabled(false);
	this.delButton.setEnabled(false);
	document.getElementById("emailHeaderChkBox").checked = false;
	if (listTable.firstChild) {
		document.getElementById("emailHeaderCell").style.width = listTable.firstChild.childNodes[1].clientWidth;
	}
};

/**
 * Returns a string representation of the whole list
 */
ColoredEmails.prototype.toString =
function() {
	var colorInfoList = this.coloredEmailsList.getOrderedArray();
	var length = colorInfoList.length;
	var array = [];
	for (var i = 0; i < length; i++) {
		var colorInfo = colorInfoList[i];
		if (this.coloredEmailsList.getByEmail(colorInfo.getEmail())) {
			// as the rows are being saved, then mark the automatic ones as manual
			colorInfo.setAuto(ColorPrefs.prototype.MANUAL);
			array.push(colorInfo.toString());
		}
	}
	return array.join(this.ENTRY_SEPARATOR);
};

/**
 * Enables or disables the main controls while editing.
 */
ColoredEmails.prototype.enableControls = function(state) {

	this.delButton.setEnabled(state);
	this.addButton.setEnabled(state);
	this.editButton.setEnabled(state);
	document.getElementById("cEmail_emailField").disabled = !state;
	this.fontColorButton.setEnabled(state);
	this.fontBackgroundButton.setEnabled(state);
	if (state) {
		document.getElementById("cManualAddedEmailsList").className = "cEmailList";
	} else {
		document.getElementById("cManualAddedEmailsList").className = "cEmailListOnEdit";
	}
};

/**
 * Enables or disables the edit and delete button depending on the
 * number of selected rows in the table.
 */
ColoredEmails.prototype.toggleEditDelete = function() {
	this.editButton.setEnabled(this.numSelectedRows === 1);
	this.delButton.setEnabled(this.numSelectedRows >= 1);
};

/******************************************************
*                 EVENT LISTENERS
*******************************************************/

/**
 * Add button action
 */
ColoredEmails.prototype.addButtonListener = function(showInfoMsg) {

	var txtField = document.getElementById("cEmail_emailField");
	var email = AjxStringUtil.trim(txtField.value).toLowerCase();

	if (email && email.length > 0) {
		var fColor = this.fontColorButton.getColor();
		var bColor = this.fontBackgroundButton.getColor();
		
		// look for duplicates		
		var duplicate = this.coloredEmailsList.getByEmail(email);
		if (duplicate) {
			appCtxt.getAppController().setStatusMsg(this.getMessage("add_error"), ZmStatusView.LEVEL_WARNING);
			return;
		} else {
			var colorInfo = new ColorInfo(email, ColorPrefs.prototype.MANUAL, fColor, bColor);
			this.coloredEmailsList.add(colorInfo);
			this.coloredEmailsList.sort();
		}
		
		this.reloadEmailsTable();
		txtField.value = "";
		txtField.focus();
		
		if (showInfoMsg) {
			var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
			appCtxt.getAppController().setStatusMsg(this.getMessage("new_color"), ZmStatusView.LEVEL_INFO, null, transitions);
		}
	}
	
};

/**
 * Save Changes button action
 */
ColoredEmails.prototype.okPreferenceBtnListener = function() {

	this.addButtonListener(false);//people might forget to press Add button, so try to add them

	var editedEmailList = this.toString();
	
	// zimlet properties are limited to 1024 characters each, adding a feedback message.
	if (editedEmailList.length >= this.CURRENT_LIMIT) {
	    appCtxt.getAppController().setStatusMsg(this.getMessage("limit_hit"), ZmStatusView.LEVEL_WARNING);
	    return;
	}
	
    this.setUserProperty(this.PROPERTY_COLOR_PREFERENCES, editedEmailList);
	
	this.uprop_cEmail_autoAssociateChkbx = document.getElementById("cEmail_autoAssociateChkbx").checked;
	if (this.uprop_cEmail_autoAssociateChkbx) {
		this.setUserProperty(this.PROPERTY_USE_AUTO_ASSOCIATE, "true");
	} else {
		this.setUserProperty(this.PROPERTY_USE_AUTO_ASSOCIATE, "false");
	}
	
	this.uprop_cEmail_defaultColour = document.getElementById("cEmail_defaultColourChkbx").checked;
    this.setUserProperty(this.PROPERTY_DEFAULT_COLOR, this.uprop_cEmail_defaultColour ? "true" : "false", true);
    
    // refresh so the changes are reflected
	this.resetView();

	appCtxt.getAppController().setStatusMsg(this.getMessage("changes_saved"), ZmStatusView.LEVEL_INFO);

	this.preferenceDialog.popdown();
};


/**
 * Edit button action
 */
ColoredEmails.prototype.editButtonListener = function() {
	if (this.numSelectedRows > 1) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("edit_error_only_one"), ZmStatusView.LEVEL_WARNING);
	} else if (this.numSelectedRows < 1) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("edit_error_only_select"), ZmStatusView.LEVEL_WARNING);
	} else {
		var rows = document.getElementById("cManualAddedEmailsTable").childNodes;
		var size = rows.length;
		var selectedRow;
		for (var i = 0; i < size ; i++) {
			var row = rows[i];
			if (row.isSelected && row.isSelected === "true") {
				selectedRow = row;
				break;
			}
		}
		
		if (selectedRow) {
			this.rowDblClickListener(selectedRow);
		}
	}
};

/**
 * Remove button action
 */ 
ColoredEmails.prototype.delButtonListener = function() {

	var prefixLength = this.ROW_PREFIX.length;
	//var rowsToRemove = [];
	var emails = [];
	var table = document.getElementById("cManualAddedEmailsTable");
	var rows = table.childNodes;
	var size = rows.length;
	
	for (var i = 0; i < size ; i++) {
		var row = rows[i];
		if (row.isSelected && row.isSelected === "true") {
			var email = row.id.substring(prefixLength);
			this.coloredEmailsList.remove(email);
			emails.push(email);
			//rowsToRemove.push(row);
		}
	}
	
//	size = rowsToRemove.length;
//	for (var j = 0; j < size; j++) {
//		table.removeChild(rowsToRemove[j]);
//	}
	
	if (size > 0) {
		// if anything was removed, then clean up
		this.coloredEmailsList.cleanUp();
		this.reloadEmailsTable();
		appCtxt.getAppController().setStatusMsg(this.getMessage("emails_removed") + " " + emails.join(","), ZmStatusView.LEVEL_INFO);
	} else if (size === 0) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("select_to_remove"), ZmStatusView.LEVEL_WARNING);
	}
};

/**
 * Event that updates the example coloring
 */
ColoredEmails.prototype.emailAndColorBtnListener = function(ev) {

	document.getElementById("cEmail_exampleEmailTableID").style.color = this.fontColorButton.getColor();
	document.getElementById("cEmail_exampleEmailTableID").style.backgroundColor = this.fontBackgroundButton.getColor();
	var email = document.getElementById("cEmail_emailField").value;
	if (email == "undefined") {
		email = this.DEFAULT_EMAIL;
		document.getElementById("cEmail_emailField").value = email;
	}

	document.getElementById("cEmail_exampleEmailNameTD").innerHTML = email;
};

/**
 * Handles the check or uncheck action in the use auto added option
 */
ColoredEmails.prototype.useAutoAddedEmailsListener = function(ev) {

	if (this.autoAddedEmailsList.getOrderedArray().length > 0) {
		var checkbox = document.getElementById("cEmail_autoAssociateChkbx");
		checkbox.disabled = true;
		if (checkbox.checked) {
			this.coloredEmailsList.append(this.autoAddedEmailsList);
			this.coloredEmailsList.sort();
		} else {
			this.coloredEmailsList.removeAutoAdded();
			// force cleanup
			this.coloredEmailsList.cleanUp();
		}
		this.reloadEmailsTable();
		checkbox.disabled = false;
	}
};

/**
 * Handles clicking on the check option for using a default colour
 */
ColoredEmails.prototype.useDefaultColoursListener = function() {
    var checkbox = document.getElementById("cEmail_defaultColourChkbx");
    if (checkbox.checked) {
        if(this.coloredEmailsList.defaultColour) {
            this.coloredEmailsList.add(this.coloredEmailsList.defaultColour);
        } else {
            var colorInfo = new ColorInfo (this.DEFAULT_COLOR_ID, "0" ,"#000000", "", true);
            this.coloredEmailsList.add(colorInfo);
            this.coloredEmailsList.defaultColour = colorInfo;
        }
        
    } else {
        this.coloredEmailsList.remove(this.DEFAULT_COLOR_ID);
        this.coloredEmailsList.cleanUp();
    }
    this.coloredEmailsList.sort();
    this.reloadEmailsTable();
};


/**
 * Handles the action of the header checkbox
 */
ColoredEmails.prototype.headerChkboxClickListener = function(chkbox, evt) {
	
	var table = document.getElementById("cManualAddedEmailsTable");
	var rows = table.childNodes;
	var numRows = rows.length;
	var checked = chkbox.checked; 
	
	for (var i = 0; i < numRows; i++) {
		var row = rows[i];
		var rowCheckbox = row.firstChild.firstChild;
		if (rowCheckbox) {
    		if (checked) {
    			row.isSelected = "true";
    			row.style.backgroundColor = "#CCCCCC";
    			rowCheckbox.checked = true;
    		} else {
    			row.isSelected = "false";
    			row.style.backgroundColor = "";
    			rowCheckbox.checked = false;
    		}
		}
	}
	this.numSelectedRows = (checked) ? numRows : 0;
	this.toggleEditDelete();
};

/**
 * Handles the action of the checkboxes en each row
 */
ColoredEmails.prototype.chkboxClickListener = function(row, evt) {
	if (!row.isSelected || row.isSelected === "false") {
		row.isSelected = "true";
		row.style.backgroundColor = "#CCCCCC";
		this.numSelectedRows++;
	} else {
		row.isSelected = "false";
		row.style.backgroundColor = "";
		this.numSelectedRows--;
	}
	
	document.getElementById("emailHeaderChkBox").checked = document.getElementById("cManualAddedEmailsTable").childNodes.length === this.numSelectedRows; 
	
	// disable the edit button in case more than one is selected
	this.toggleEditDelete();
};

/**
 * Handles the click event on the email list
 */
ColoredEmails.prototype.rowSglClickListener = function(row, evt) {

	// check whether there is a row being edited
	if (this.currentlyEditedRow) {
		// then discard modifications and restore row
		this.replaceRow(this.currentlyEditedRow, this.editingRow);
		this.currentlyEditedRow = null;
		this.enableControls(true);
	}
};

/**
 * Handles the double click on the email list
 */
ColoredEmails.prototype.rowDblClickListener = function(row, evt) {
	
	// disable remove and add
	this.enableControls(false);
	this.currentlyEditedRow = row;
	
	// get the email from the row id
	var em = row.id.substring(this.ROW_PREFIX.length);
	
	if (this.DEFAULT_COLOR_ID === em) {
	    this.txtEditEmail.value = this.getMessage("default_colour_label");
	    this.txtEditEmail.disabled = true;
	} else {
	    this.txtEditEmail.value = em;
	    this.txtEditEmail.disabled = false;
	}
	var preview = document.getElementById( em + this.COLOR_PREVIEW);
	this.fontColorEditButton.setColor(preview.style.color);
	this.fontBackgroundEditButton.setColor(preview.style.backgroundColor);
	
	this.replaceRow(this.editingRow, row);
	this.txtEditEmail.focus();
};

/**
 *	Apply modification action
 */
ColoredEmails.prototype.applyEditButtonListener = function() {

	var oldEmail = this.currentlyEditedRow.id.substring(this.ROW_PREFIX.length);
	var newEmail = AjxStringUtil.trim((this.DEFAULT_COLOR_ID === oldEmail) ? this.DEFAULT_COLOR_ID : this.txtEditEmail.value).toLowerCase();
	
	// check for duplicate
	if (oldEmail !== newEmail && this.coloredEmailsList.getByEmail(newEmail)) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("apply_error"), ZmStatusView.LEVEL_WARNING);
		return;
	}
	
	// set the color settings
	var colorInfo = this.coloredEmailsList.getByEmail(oldEmail);
	if (colorInfo) {
		colorInfo.setAuto(ColorPrefs.prototype.MANUAL);
		colorInfo.setColors(this.fontColorEditButton.getColor(), this.fontBackgroundEditButton.getColor());

		// in the case that the email or tag is different, then the previous entry should be deleted
		if (oldEmail !== newEmail) {
			colorInfo.setEmail(newEmail);
			this.coloredEmailsList.remove(oldEmail);
			this.coloredEmailsList.add(colorInfo);
			this.coloredEmailsList.sort();
			this.coloredEmailsList.cleanUp();
		}
	}
	this.currentlyEditedRow = null;
	this.enableControls(true);
	this.reloadEmailsTable();
};

/**
 * Reloads the page
 */
ColoredEmails.prototype.reloadBrowser = function() {

	window.onbeforeunload = null;
	var url = AjxUtil.formatUrl({});
	ZmZimbraMail.sendRedirect(url);
};

/**
* This an auxiliary class used to keep track of the configuration of colors for the emails entered
*/
function ColorInfo(email, auto, fColor, bColor, isDefault) {
	this._email = email;
	this._fColor = fColor;
	this._bColor = bColor;
	this._auto = auto;
	this._default = isDefault;
	this.buildStyle();
}

ColorInfo.prototype.COLORDATA_SEPARATOR = ":";

/**
 * Returns the email
 */
ColorInfo.prototype.getEmail = function() {
	return this._email;
};

/**
 * Set the email for this preference
 */
ColorInfo.prototype.setEmail = function(email) {
	this._email = email;
};

/**
 * Returns the foreground color preference
 */
ColorInfo.prototype.getFColor = function() {
	return this._fColor;
};

/**
 * Returns the background color preference
 */
ColorInfo.prototype.getBColor = function() {
	return this._bColor;
};

/**
 * Sets the foreground and background colors
 */
ColorInfo.prototype.setColors = function(fColor, bColor) {
	this._fColor = fColor;
	this._bColor = bColor;
	this.buildStyle();
};

/**
 * This value indicates whether the entry is manual or not.
 */
ColorInfo.prototype.getAuto= function() {
	return this._auto;
};

/**
 * Set whether the entry is manual or auto-added.
 */
ColorInfo.prototype.setAuto = function(auto) {
	this._auto = auto;
};

/**
 * This value indicates whether the entry is manual or not.
 */
ColorInfo.prototype.isDefault= function() {
    return this._default;
};

/**
 * Set whether the entry is manual or auto-added.
 */
ColorInfo.prototype.setDefault = function(_default) {
    this._default = _default;
};

/**
 * Return a string representation to be used when saving the preferences.
 */
ColorInfo.prototype.toString = function() {
	return this._email + this.COLORDATA_SEPARATOR  + this._auto + this.COLORDATA_SEPARATOR + this._fColor + this.COLORDATA_SEPARATOR + ((this._bColor) ? this._bColor : "") + ((this._default)?  this.COLORDATA_SEPARATOR + "1" : "");
};

/**
 * Creates the ccs style for this item
 */
ColorInfo.prototype.buildStyle = function() {
	this._style = " style=\"color: " + this._fColor + ((this._bColor && this._bColor !== "white" && this._bColor !== "#FFFFFF") ? ";background-color: " + this._bColor + ";" : "") + "\" ";
};

/**
 *	Returns the ccs style of the preference
 */
ColorInfo.prototype.getStyle = function() {
	return this._style;
};

/**
 * Contains the information of all the email colors preferences,
 * 'orderedArray' serves as the structure to keep the emails 
 * by alphabetical order and 'hashArray' is for ease of access
 * by email.
 * 
 */
function ColorPrefs() {
	this.orderedArray = [];
	this.hashArray = [];
	this.defaultColour = null;
}

// types of entries
ColorPrefs.prototype.MANUAL = "0";
ColorPrefs.prototype.AUTO = "1";

/**
 * Adds the preference to both lists
 */
ColorPrefs.prototype.add = function (colorInfo) {
	this.orderedArray.push(colorInfo);
	this.hashArray[colorInfo.getEmail()] = colorInfo;
};

/**
 *	 To remove only de-reference make a cleanup later if necessary
 */
ColorPrefs.prototype.remove = function (email) {
	this.hashArray[email] = null;
};

/**
 *	Returns the preference by email
 */
ColorPrefs.prototype.getByEmail = function (email) {
    if (this.hashArray.hasOwnProperty(email)) {
        return this.hashArray[email];
    }
};

/**
 *	Sort the ordered array by email
 */
ColorPrefs.prototype.sort = function () {
	this.orderedArray.sort(this.compare);
};

/**
 * Sorting function used by the sort function
 */
ColorPrefs.prototype.compare = function(a,b) {
	return a.getEmail().localeCompare(b.getEmail());
};

/**
 *	Returns the ordered array
 */
ColorPrefs.prototype.getOrderedArray = function () {
	return this.orderedArray;
};

/**
 * Appends a list of preferences to the current one, 
 * check for duplicates by email.
 */
ColorPrefs.prototype.append = function (list) {
	var arrayToAppend = list.getOrderedArray();
	var size = arrayToAppend.length;
	for (var i = 0; i < size; i++) {
		var colorInfo = arrayToAppend[i];
		if (!this.getByEmail(colorInfo.getEmail())) {
			this.add(colorInfo);
		}
	}
};

/**
 *	Removes all the preferences that are marked
 * as auto added.
 */
ColorPrefs.prototype.removeAutoAdded = function () {
	var size = this.orderedArray.length;
	for (var i = 0; i < size; i++) {
		var colorInfo = this.orderedArray[i];
		if (colorInfo.getAuto() === this.AUTO) {
			this.remove(colorInfo.getEmail());
		}
	}
};

/**
 * As the remove above only deletes the references, it may
 * be necessary to clean up the entries of the arrays.
 */
ColorPrefs.prototype.cleanUp = function () {
	var newHashArray = [];
	var neworderedArray = [];
	for (var i in this.hashArray) {
		if (this.hashArray.hasOwnProperty(i)) {
			var colorInfo = this.hashArray[i];
			if (colorInfo) {
				newHashArray[colorInfo.getEmail()] = colorInfo;
				neworderedArray.push(colorInfo);
			}
		}
	}
	this.hashArray = newHashArray;
	this.orderedArray = neworderedArray;
	this.sort();
};

