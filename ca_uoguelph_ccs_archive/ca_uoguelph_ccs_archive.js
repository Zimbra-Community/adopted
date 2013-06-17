/**
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
 * @overview
 * The archive zimlet provides the convenient functionality
 * of moving email messages and conversations to predefined
 * folders as a mean of archiving; the user then could export
 * those folders to reduce quota usage.
 * 
 * @author Kennt Chan
 */
var ca_uoguelph_ccs_archiveHandlerObject = function() {
};

ca_uoguelph_ccs_archiveHandlerObject.prototype = new ZmZimletBase();
ca_uoguelph_ccs_archiveHandlerObject.prototype.constructor = ca_uoguelph_ccs_archiveHandlerObject;

function CcsArchive() {
}

CcsArchive = ca_uoguelph_ccs_archiveHandlerObject;
// properties
CcsArchive.CCS_ARCHIVE_FOLDER_ID = "archive_mainFolderId";
CcsArchive.CCS_ARCHIVE_BY_PREFERENCE = "archive_by_preference";
CcsArchive.CCS_ARCHIVE_AUTO_ENABLED = "archive_auto_enabled";
CcsArchive.CCS_ARCHIVE_AUTO_LAST_RUN = "archive_auto_last_run";
CcsArchive.CCS_ARCHIVE_AUTO_SETTINGS = "archive_auto_settings";
// Toolbar and button constants
CcsArchive.CCS_ARCHIVE_OP = "CCS_ARCHIVE_TOOLBAR_BUTTON";
CcsArchive.CCS_ARCHIVE_BY_YEAR = "ccsArchiveByYear";
CcsArchive.CCS_ARCHIVE_BY_MONTH = "ccsArchiveByMonth";
CcsArchive.CCS_ARCHIVE_BY_SENDER = "ccsArchiveBySender";
CcsArchive.CCS_ARCHIVE_BY = "ccsArchiveBy";
CcsArchive.CCS_ARCHIVE_OLD = "ccsArchiveOld";
CcsArchive.CCS_ARCHIVE_AUTO = "ccsArchiveAuto";
CcsArchive.CCS_ARCHIVE_CONTINUE = "ccsContinue";
CcsArchive.CCS_ARCHIVE_WAIT = "ccsShowWait";
CcsArchive.SEP = "sep";

CcsArchive.BY_MONTH = "m";
CcsArchive.BY_YEAR = "y";
CcsArchive.BY_SENDER = "s";
/** Limit for the batch request */
CcsArchive.LIMIT = 500;

/**
 * Initialization
 */
CcsArchive.prototype.init = function () {
    CcsArchive.CCS_ARCHIVE_OLD_BY_DAYS = {id:"d", name:this.getMessage("archive_older_than_days")};
    CcsArchive.CCS_ARCHIVE_OLD_BY_MONTHS = {id:"m", name:this.getMessage("archive_older_than_month")};
    CcsArchive.CCS_ARCHIVE_OLD_BY_YEARS = {id:"y", name:this.getMessage("archive_older_than_year")};
    // only the "Archive" folder id is kept
    this.archiveFolderId = null;
    // used as a sequence number when a folder with the same name already exists
    this.counter = 2;
    // the saved preference on how to archive
    this.archiveBy = this.getUserProperty(CcsArchive.CCS_ARCHIVE_BY_PREFERENCE);
    this.runAutoArchive();
};

/**
 * Called when the toolbar is initializing, adds the Archive action menu to it 
 * when the view is that of a list view
 */
CcsArchive.prototype.initializeToolbar = function(app, toolbar, controller, viewId) {
    
    // TODO: at the moment it only shows the button in the list view, it could be added when reading a message in full window (handled differently)

    viewId = appCtxt.getViewTypeFromId(viewId);

    if (viewId == ZmId.VIEW_CONVLIST || viewId == ZmId.VIEW_TRAD) {

        var buttonParams = {
                text: this.getMessage("tb_archive"),
                tooltip: this.getMessage("tb_tooltip"),
                image: "folder",
                showImageInToolbar: true,
                showTextInToolbar: true
        };

        // creates the button with an id and params containing the button details
        var button = toolbar.createZimletOp(CcsArchive.CCS_ARCHIVE_OP, buttonParams);
        button.addSelectionListener(new AjxListener(this, this.archiveSelectedEmails, [{controller:controller}]));
        button.addListener(DwtEvent.ONMOUSEOVER, new AjxListener(this, this.changeTooltip, [button]));
        button.textPrecedence = 20;
        // reset precedence list
        toolbar._createPrecedenceList();
        
        // override the function to reset the operations in the toolbar as there is no method to
        // set when to enable or disable buttons based on the selection in the button api
        var originalFunction = controller._resetOperations;
        controller._resetOperations = function(parent, num) {
            originalFunction.apply(controller, arguments);
            parent.enable(CcsArchive.CCS_ARCHIVE_OP, true);
        };
        
        // create the archive button and menu
        var menu = new ZmActionMenu({
            parent:     button,
            id:         button.getHTMLElId() + "|MENU",
            menuItems:  ZmOperation.NONE
        });
        menu.addPopupListener(new AjxListener(this, this.expandArchive, menu));
        
        var itemList = [{op: CcsArchive.CCS_ARCHIVE_BY_YEAR,   name: this.getMessage("op_archive_by_year"),   radioGroup: this.CCS_ARCHIVE_BY, style: DwtMenuItem.RADIO_STYLE, 
                         listener: this.selectArchiveBy,       listenerParams: [controller, CcsArchive.BY_YEAR] },
                        {op: CcsArchive.CCS_ARCHIVE_BY_MONTH,  name: this.getMessage("op_archive_by_month"),  radioGroup: this.CCS_ARCHIVE_BY, style: DwtMenuItem.RADIO_STYLE, 
                         listener: this.selectArchiveBy,       listenerParams: [controller, CcsArchive.BY_MONTH]},
                        {op: CcsArchive.CCS_ARCHIVE_BY_SENDER, name: this.getMessage("op_archive_by_sender"), radioGroup: this.CCS_ARCHIVE_BY, style: DwtMenuItem.RADIO_STYLE, 
                         listener: this.selectArchiveBy,       listenerParams: [controller, CcsArchive.BY_SENDER]},
                        {op: CcsArchive.SEP},
                        {op: CcsArchive.CCS_ARCHIVE_OLD,       name: this.getMessage("op_archive_old"), listener: this.openArchiveDialog, listenerParams: [CcsArchive.CCS_ARCHIVE_OLD]},
                        {op: CcsArchive.CCS_ARCHIVE_AUTO,      name: this.getMessage("op_archive_auto"), listener: this.openArchiveDialog, listenerParams: [CcsArchive.CCS_ARCHIVE_AUTO]}
        ];
        
        this.createMenuItems(itemList, menu);
        button.setMenu(menu);
    }

};

/**
 * Creates each of the menu items.
 * @param itemList an array with the parameters for each menu item
 * @param menu the parent menu
 */
CcsArchive.prototype.createMenuItems = function(itemList, menu) {
    for ( var i = 0; i < itemList.length; i++) {
        var params = itemList[i];
        if (CcsArchive.SEP === params.op) {
            menu.createSeparator();
        } else {
            var item = menu.createOp(params.op, {
                text:         params.name, 
                radioGroupId: params.radioGroup, 
                style:        params.style
            });
            item.addSelectionListener(new AjxListener(this, params.listener, params.listenerParams));
        }
    }  
};

/**
 * Creates and opens the batch archive dialog and the auto archiving options
 * @param type if it is auto-archiving or batch archive.
 */
CcsArchive.prototype.openArchiveDialog = function(type, params) {
    if (!this.archiveDialog) {
        this.archiveOptionsView = new DwtComposite(this.getShell());
        this.archiveOptionsView.getHtmlElement().style.overflow = "auto";
        this.archiveOptionsView.getHtmlElement().innerHTML = this.createArchiveView();
        this.archiveOptionsView.setSize("340", "180");        
        var dialog_args = {
                title   : this.getMessage("tb_archive"),
                view    : this.archiveOptionsView,
                standardButtons : [DwtDialog.OK_BUTTON, DwtDialog.DISMISS_BUTTON],
                parent  : this.getShell()
            };
        this.archiveDialog = new ZmDialog(dialog_args);                
        this.archiveDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnListener, [type]));
        
        var chkbox = document.getElementById("chkAutoArchive");        
        Dwt.setHandler(chkbox, DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.enableAutoArchivingChkbox, this, chkbox));
        chkbox = document.getElementById("chkExport");
        Dwt.setHandler(chkbox, DwtEvent.ONCLICK, AjxCallback.simpleClosure(this.enableExportChkbox, this, chkbox));
    }
    
    this.switchDialogContent(type, params);
    
    if (!this.archiveDialog.isPoppedUp()) {
        this.archiveDialog.popup();
    }
};

/**
 * Enable or disable the options in the archive dialog
 * @param enable true/false
 */
CcsArchive.prototype.enableOptions = function(enable) {
    document.getElementById("selectArchiveBy").disabled = !enable;
    document.getElementById("txtNumber").disabled = !enable;
    document.getElementById("selectDateType").disabled = !enable;
    document.getElementById("chkUnread").disabled = !enable;
    var exportChkbox = document.getElementById("chkExport");    
    exportChkbox.disabled = !enable;
    document.getElementById("chkDelete").disabled = !enable || !exportChkbox.checked;
};

/**
 * Listener called when the auto archiving is selected as enabled.
 * @param chkbox
 */
CcsArchive.prototype.enableAutoArchivingChkbox = function(chkbox) {
    this.autoArchiveEnabled = chkbox.checked;
    this.enableOptions(this.autoArchiveEnabled);
};

/**
 * Listener for the export option 
 * @param chkbox
 */
CcsArchive.prototype.enableExportChkbox = function(chkbox) {
    document.getElementById("chkDelete").disabled = !chkbox.checked;
};

/**
 * Creates the html for the archive dialog.
 * @returns the html string representation
 */
CcsArchive.prototype.createArchiveView = function(type) {
    var html = new Array();
    var i = 0;
    html[i++] = "<div id='archiveDiv'><table class='archiveTable' cellspacing='0'><tbody>";
    html[i++] = "<tr><td id='enableAutoArchivingCell'>";
    html[i++] = "<input type='checkbox' id='chkAutoArchive'/></td><td class='archiveHeader' colspan='2'><label for='chkAutoArchive' id='lblAutoArchive'>";
    html[i++] = "</label></td></tr>";
    html[i++] = "<tr><td></td><td><span>";
    html[i++] = this.getMessage("view_archive_by");
    html[i++] = "</span></td><td>";
    i = this.createSelect(html, i, [{id: CcsArchive.BY_YEAR,   name: this.getMessage("by_year")},
                                    {id: CcsArchive.BY_MONTH,  name: this.getMessage("by_month")},
                                    {id: CcsArchive.BY_SENDER, name: this.getMessage("by_sender")}], {id: "selectArchiveBy", selected:this.archiveBy});
    html[i++] = "</td></tr>";
    html[i++] = "<tr><td></td><td><span>";
    html[i++] = this.getMessage("view_archive_older");
    html[i++] = "</span></td><td><input type='text' class='numberTxt' id='txtNumber'/>&nbsp;";
    i = this.createSelect(html, i, [CcsArchive.CCS_ARCHIVE_OLD_BY_DAYS, CcsArchive.CCS_ARCHIVE_OLD_BY_MONTHS, CcsArchive.CCS_ARCHIVE_OLD_BY_YEARS], {id: "selectDateType"});
    html[i++] = "</td></tr>";
    html[i++] = "<tr><td></td><td colspan='2'>";
    html[i++] = "<input type='checkbox' id='chkUnread'/><label for='chkUnread'>";
    html[i++] = this.getMessage("view_archive_unread");
    html[i++] = "</label>";
    html[i++] = "</td></tr>";
    html[i++] = "<tr><td></td><td colspan='2'>";
    html[i++] = "<input type='checkbox' id='chkExport'/><label for='chkExport'>";
    html[i++] = this.getMessage("view_archive_export");
    html[i++] = "</label>";
    html[i++] = "</td></tr>";
    html[i++] = "<tr><td></td><td colspan='2'>";
    html[i++] = "<input type='checkbox' id='chkDelete'/><label for='chkDelete'>";
    html[i++] = this.getMessage("view_archive_delete");
    html[i++] = "</label>";
    html[i++] = "</td></tr>";
    html[i++] = "</tbody></table></div>";
    
    html[i++] = "<div id='archiveDeleteDiv' class='archiveDeleteContinueHidden'>";
    html[i++] = this.getMessage("view_archive_delete_continue");
    html[i++] = "<br /></div>";
    
    html[i++] = "<div id='archiveWait' class='archiveWaitStyle'><span id='waitingMessage'>";
    html[i++] = this.getMessage("view_archiving");
    html[i++] = "</span><img id='busyimg' src=\"" + this.getResource("archive_busy.gif") + "\"/>";
    html[i++] = "</div>";
    
    return html.join("");
};

/**
 * Creates the html <select>
 * @param html array the contains the current html code
 * @param i the current index
 * @param options array with the list of option for the select
 * @param params 
 * @param params.id the id of the select
 * @param params.select the currently selected item
 * @returns the html string representation of the select
 */
CcsArchive.prototype.createSelect = function(html, i, options, params) {
    html[i++] = ["<select id='", params.id,"'>"].join("");
    for ( var j = 0; j < options.length; j++) {        
        var option = options[j];
        html[i++] = ["<option value='", option.id, "' ", params.selected && params.selected === option.id? "selected='selected'" : "", ">", option.name, "</option>"].join("");
    }
    html[i++] = "</select>";
    return i;
};

/**
 * Gets the selected options for auto archiving and batch archiving.
 * @returns object that contains the values of the selected options
 */
CcsArchive.prototype.getInputParams = function() {
    try {
        var params = {};
        params.archiveBy = this.getSelectedValue("selectArchiveBy");
        params.number = parseInt(document.getElementById("txtNumber").value);
        if (isNaN(params.number)) {
            throw "Input error";
        }
        params.dateType = this.getSelectedValue("selectDateType");
        params.includeUnread = document.getElementById("chkUnread").checked;
        params.exportArchived =  document.getElementById("chkExport").checked;
        params.deleteAfter = document.getElementById("chkDelete").checked;        
        return params;
    } catch (e) {
        appCtxt.getAppController().setStatusMsg(this.getMessage("error_invalid_number"), ZmStatusView.LEVEL_WARNING);
    }    
};

/**
 * Sets the values to the user options
 * @param params
 */
CcsArchive.prototype.setInputParams = function(params) {
    if (params) {
        document.getElementById("selectArchiveBy").value = params.archiveBy;
        document.getElementById("txtNumber").value = params.number;
        document.getElementById("selectDateType").value = params.dateType;
        document.getElementById("chkUnread").checked = params.includeUnread;
        document.getElementById("chkExport").checked = params.exportArchived;
        document.getElementById("chkDelete").checked = params.deleteAfter;
    }
};

/**
 * Creates an empty params object and sets it as the value for the options
 */
CcsArchive.prototype.clearInput = function() {
    var params = {archiveBy: this.archiveBy, number:"", dateType:"m", includeUnread:false, exportArchived:false, deleteAfter:false};
    this.setInputParams(params);
};

/**
 * Get the selected option from an html select
 * @param id html element id
 * @returns
 */
CcsArchive.prototype.getSelectedValue = function(id) {
    var select = document.getElementById(id);
    return select.options[select.selectedIndex].value;
};

/**
 * Listener for the OK button in the archive dialog.
 * @param type
 */
CcsArchive.prototype.okBtnListener = function(type, params) {
    switch (type) {
    case CcsArchive.CCS_ARCHIVE_OLD:
        params = this.getInputParams();
        this.switchDialogContent(CcsArchive.CCS_ARCHIVE_WAIT);
        this.setupMsgSearch(params);
        break;
    case CcsArchive.CCS_ARCHIVE_AUTO:
        this.saveSettings();
        this.refreshAndClose();
        break;
    case CcsArchive.CCS_ARCHIVE_CONTINUE:
        this.continueSendToTrash(params);
        break;
    default:
        break;
    }
};

/**
 * Parses the date and generates the query to be sent in the
 * search request.
 * @param params contains the user selected values.
 */
CcsArchive.prototype.setupMsgSearch = function(params) {
    var date = new Date();
    switch (params.dateType) {
    case CcsArchive.CCS_ARCHIVE_OLD_BY_DAYS.id:
        date.setDate(date.getDay() - params.number);
        break;
    case CcsArchive.CCS_ARCHIVE_OLD_BY_MONTHS.id:
        date.setMonth(date.getMonth() - params.number);     
        break;
    case CcsArchive.CCS_ARCHIVE_OLD_BY_YEARS.id:
        date.setFullYear(date.getFullYear() - params.number);
        break;
    default:
        return;
    }
    params.query = ["IN:Inbox AND ", "BEFORE:\"", AjxDateFormat.format(I18nMsg.formatDateShort, date), "\""].join("");
    // total number of messages archived
    params.num = 0;
    this.getMessages(params);
};

/**
 * Gets the old messages in the inbox from the server
 */
CcsArchive.prototype.getMessages = function(params) {
    // create the json object for the search request
    var jsonObj = {SearchRequest:{_jsns:"urn:zimbraMail"}};
    var request = jsonObj.SearchRequest;
    request.sortBy = ZmSearch.DATE_ASC;
    ZmTimezone.set(request, AjxTimezone.DEFAULT);
    request.locale = { _content: AjxEnv.DEFAULT_LOCALE };
    request.offset = 0;
    request.types = ZmSearch.TYPE.MSG;
    request.query = params.query;
    request.offset = 0;
    request.limit = CcsArchive.LIMIT;
    
    var searchParams = {
            jsonObj:jsonObj,
            asyncMode:true,
            callback:new AjxCallback(this, this.handleGetMessagesResponse, [params]),
            errorCallback:new AjxCallback(this, this.handleGetMessagesError)
    };
    appCtxt.getAppController().sendRequest(searchParams);
};

/**
 * Handles the search response
 * @param params user input values        
 * @param result the request response result
 */
CcsArchive.prototype.handleGetMessagesResponse = function(params, result) {
    if (result) {
        var response = result.getResponse().SearchResponse;        
        var responseMsgList = response[ZmList.NODE[ZmItem.MSG]];
        if (responseMsgList) {
            params.hasMore = response.more;
            this.archiveSelectedEmails({selectedEmails: responseMsgList, convLoaded: true, fromSearch:true, other:params});
        } else {
            this.refreshAndClose();
        }
    }
};

/**
 * Display an error message in case the request fails
 * @param err
 */
CcsArchive.prototype.handleGetMessagesError = function(err) {
    appCtxt.getAppController().setStatusMsg(this.getMessage("error_get_messages"), ZmStatusView.LEVEL_CRITICAL);
};

/**
 * Called when expanding the menu in the archive option.
 * @param menu
 */
CcsArchive.prototype.expandArchive = function(menu) {
    // load check according to preferences
    var itemId = null;
    switch (this.archiveBy) {
        case CcsArchive.BY_SENDER:
            itemId = CcsArchive.CCS_ARCHIVE_BY_SENDER;
            break;
        case CcsArchive.BY_MONTH:
            itemId = CcsArchive.CCS_ARCHIVE_BY_MONTH;
            break;
        case CcsArchive.BY_YEAR:
        default:
            itemId = CcsArchive.CCS_ARCHIVE_BY_YEAR;
            break;
    }
    menu.getMenuItem(itemId).setChecked(true, true);
};

/**
 * Called o a mouse over event, changes the tooltip according
 * to the currently selected 'archive by' option
 * @param button
 */
CcsArchive.prototype.changeTooltip = function(button) {
    var tooltip = this.getMessage("tb_tooltip") + " ";
    switch (this.archiveBy) {
        case CcsArchive.BY_SENDER:
            tooltip += this.getMessage("by_sender");
            break;
        case CcsArchive.BY_MONTH:
            tooltip += this.getMessage("by_month");
            break;
        case CcsArchive.BY_YEAR:
        default:
            tooltip += this.getMessage("by_year");
            break;
    }
    button.setToolTipContent(tooltip);
};

/**
 * Called when any item in the archive menu is selected, sets the preference
 * and archives the selected emails.
 * @param controller 
 * @param archiveBy the preference by month, year or sender
 */
CcsArchive.prototype.selectArchiveBy = function(controller, archiveBy) {
    if (controller.getCurrentView().getSelectionCount() > 0) {
        this.archiveBy = archiveBy;
        this.setUserProperty(CcsArchive.CCS_ARCHIVE_BY_PREFERENCE, this.archiveBy, true);
        this.archiveSelectedEmails({controller:controller});
    } else {
        appCtxt.getAppController().setStatusMsg(this.getMessage("error_select_messages"), ZmStatusView.LEVEL_INFO);
    }
};

/**
 * This function organizes the messages according to the criteria chosen and 
 * also gets the folders that will be used to store them.
 * @param params.selectedEmails the list of selected email messages or conversations
 * @param params.num the number of selected messages.
 * @returns {CcsArchiveMessages} the object that contains the information on 
 * the destination folders and messages ids related.
 */
CcsArchive.prototype.organizeMessages = function(params) {
    var archiveMsgs = new CcsArchiveMessages();
    var archiveBy = (params.fromSearch) ? params.other.archiveBy : this.archiveBy;
    // organize the messages by date or sender
    for (var i = 0; i < params.num; i++) {
        var item = params.selectedEmails[i];
        var label;
        switch (item.type) {
            case ZmId.ITEM_CONV:
                // when it is a conversation, get the inner messages and 
                // organize them separately
                var msgs = item.msgs.getArray();
                for (var j = 0; j < msgs.length; j++) {
                    archiveMsgs.add(msgs[j], archiveBy);
                }
                break;
            case ZmId.ITEM_MSG:
                archiveMsgs.add(item, archiveBy);
                break;
            default:
                // when the archive action comes from the batch archiving function
                if (params.fromSearch) {
                    if ("u" === item.f) {
                        if (params.other.includeUnread) {
                            archiveMsgs.add(item, archiveBy);
                        }
                    } else {
                        archiveMsgs.add(item, archiveBy);
                    }                    
                } else {
                    return;
                }
        }
    }
    
    var archive = {id: this.getArchiveFolderId(), name: this.getMessage("folder_archive")};
    //var archive = {id: this.getArchiveFolderId(), name: "Archive"}; // -> for debugging
    this.getFolder(archive);
    if (!archive.id) {
        return;
    }        
    this.setArchiveFolderId(archive.id);
    
    // get the folders for the messages    
    var parentFolders = [];
    var labels = Object.keys(archiveMsgs.getHash());
    for (var i = 0; i < labels.length; i++) {
        var label = CcsArchive.BY_SENDER === archiveBy ? labels[i] : labels[i].split("-")[0];
        
        var folderInfo = null;
        // check if the year folder has already been looked up for, used when archiving by month is selected 
        if (CcsArchive.BY_MONTH === archiveBy && parentFolders[label]) {
            folderInfo = parentFolders[label]; 
        } else {
            // get the child folder under "Archive"
            folderInfo = {name: label, parent: this.getArchiveFolderId(), path: archive.name + "/" + label};            
            this.getFolder(folderInfo);
            if (CcsArchive.BY_MONTH === archiveBy) {
                parentFolders[label] = folderInfo;
            }
        }
        // get the month folder
        if (CcsArchive.BY_MONTH === archiveBy) {
            var monthNumName = labels[i].split("-"); 
            var displayName = monthNumName[1] + " - " + monthNumName[2];
            folderInfo = {name: displayName, parent: folderInfo.id, path: archive.name + "/" + label + "/" + displayName};            
            this.getFolder(folderInfo);
        }
        archiveMsgs.addFolderId(labels[i], folderInfo.id);
    }
    return archiveMsgs;
};

/**
 * This function will load the messages for each conversation in the array
 * if they are not already in the cache.
 * @param {Array} selectedEmails the array of selected emails
 * @returns {Boolean} whether an ajax request was called
 */
CcsArchive.prototype.loadConvsAndContinue = function(selectedEmails) {
    var batchCmd = new ZmBatchCommand(true);
    
    var num = selectedEmails.length;    
    for ( var i = 0; i < num; i++) {
        var item = selectedEmails[i];
        if (ZmId.ITEM_CONV === item.type && !item.msgs) {
            item.loadMsgs({fetchAll : true}, null, batchCmd);
            // increase id of the next request in the batch object... this should have been done automatically
            // but the loadMsgs uses ZmBatchCommand.addRequestParam instead of ZmBatchCommand.addNewRequestParam
            batchCmd.curId++;
        }
    }
    if (batchCmd.size() > 0) {
        batchCmd.run(new AjxCallback(this, this.archiveSelectedEmails, [{selectedEmails: selectedEmails, convLoaded: true}]));
        return false;
    }
    return true;
};

/**
 * Archives the selected email messages or conversations
 * @param params
 *        params.controller the ZmController object
 *        params.selectedEmails {Array} of selected emails
 *        params.convLoaded {boolean} if the conversations in the selected list have already been cached
 */
CcsArchive.prototype.archiveSelectedEmails = function(params) {
    var selectedEmails = params.controller ? params.controller.getCurrentView().getSelection() : params.selectedEmails;
    var num = selectedEmails.length;
    if (num < 1) {
        if (params.controller) {
            // show error message only when the archive call comes from user selection.
            appCtxt.getAppController().setStatusMsg(this.getMessage("error_select_messages"), ZmStatusView.LEVEL_INFO);
        }
        return;
    }
    
    // load any messages that are part of any selected conversation item
    if (!params.convLoaded && !this.loadConvsAndContinue(selectedEmails)) {
        return;
    }
        
    var archiveMsgs = this.organizeMessages({selectedEmails: selectedEmails, num: num, fromSearch: params.fromSearch, other: params.other}).getHash();

    // create the batch request for moving all the selected messages
    var soapDoc = AjxSoapDoc.create("BatchRequest", "urn:zimbra");
    soapDoc.setMethodAttribute("onerror", "continue");
    
    var folderList;
    if (params.other) {
        if (params.other.folderList) {
            folderList = params.other.folderList;
        } else {
            folderList = params.other.folderList = {};
        }
    }
    
    // Create the request body
    for (var key in archiveMsgs) {
        var group = archiveMsgs[key];
        if (group && archiveMsgs.hasOwnProperty(key)) {
            var request = soapDoc.set("MsgActionRequest", null, null, "urn:zimbraMail");
            var action = soapDoc.set("action");
            action.setAttribute("op","move");
            action.setAttribute("id",group.ids.join(","));
            action.setAttribute("l",group.folder);
            request.appendChild(action);
        }
        // add the folder list for use in export and delete
        if (params.other) {
            folderList[group.folder] = null;
        }
    }
    
    // send batch request
    appCtxt.getAppController().sendRequest(
            {
                soapDoc : soapDoc,
                asyncMode : true,
                callback : new AjxCallback(this, this.archiveCallbackHandler, [{num:num, type:selectedEmails[0].type, other:params.other}])
            });
};

/**
 * Called when the Ajax call for moving the emails has ended
 * @param params
 *        params.type = the type of the first selected item
 *        params.num = the number of selected items
 * @param response the json response from the server
 */
CcsArchive.prototype.archiveCallbackHandler = function(params, response) {
    try {
        if (params.other) {
            params.other.num += params.num;
            if (params.other.hasMore) {
                this.getMessages(params.other);
            } else if (params.other.exportArchived){
                this.displayCountMsg(params.type, params.other.num);
                this.exportFolders(params.other);
            } else {
                this.displayCountMsg(params.type, params.other.num);
                this.refreshAndClose();
            }
        } else {
            this.displayCountMsg(params.type, params.num);
            this.refresh();
        }
    } catch(e) {
    }
};

/**
 * Display message with the number of messages processed.
 * @param type whether the items are {ZmMailMsg} or {ZmConv}
 * @param num
 */
CcsArchive.prototype.displayCountMsg = function(type, num) {
    appCtxt.getAppController().setStatusMsg(AjxMessageFormat.format(this.getMessage(type === ZmId.ITEM_CONV ? "notif_conv_archived" : "notif_msg_archived"), num), ZmStatusView.LEVEL_INFO);
};

/**
 * Export the "Archive" folder, use the main folder instead of archiving each folder.
 * @param params
 */
CcsArchive.prototype.exportFolders = function(params) {    
    var controller = appCtxt.getImportExportController();
    // get export params    
    var exportParams = {filename: [this.getMessage("folder_archive"), "-", AjxDateFormat.format("yyyy-MM-dd-HHmmss", new Date())].join(""),
                  folderId: this.getArchiveFolderId(),
                  subtype:  "zimbra-tgz",
                  type:     ZmImportExportController.TYPE_TGZ};
    
    // export
    controller.exportData(exportParams);
    
    if (params.deleteAfter) {
        this.openArchiveDialog(CcsArchive.CCS_ARCHIVE_CONTINUE, params);
    } else {
        this.refreshAndClose();
    }
};

/**
 * Send the archive folder to the trash so the user can clean up space if preferred.
 * @param needs the ids of the folders to send to the trash
 */
CcsArchive.prototype.continueSendToTrash = function(params) {
    var soapDoc = AjxSoapDoc.create("BatchRequest", "urn:zimbra");
    soapDoc.setMethodAttribute("onerror", "continue");
    
    var request = soapDoc.set("FolderActionRequest", null, null, "urn:zimbraMail");
    var action = soapDoc.set("action");
    action.setAttribute("op","trash");
    action.setAttribute("id", (params && params.folderList)? Object.keys(params.folderList).join(",") : this.getArchiveFolderId());
    request.appendChild(action);
    
    appCtxt.getAppController().sendRequest(
            {
                soapDoc : soapDoc,
                asyncMode : true,
                callback : new AjxCallback(this, this.moveToTrashHandler)
            });
};

/**
 * Handles the response of the send to trash action
 */
CcsArchive.prototype.moveToTrashHandler = function() {
    appCtxt.getAppController().setStatusMsg(this.getMessage("view_archive_folder_to_trash"), ZmStatusView.LEVEL_INFO);
    this.refreshAndClose();
};

/**
 * Refreshes the inbox and closes the archive dialog
 * @param isAuto
 */
CcsArchive.prototype.refreshAndClose = function() {
    this.refresh();
    if (this.archiveDialog) {
        this.archiveDialog.popdown();
    }
};

/**
 * Changes the content of the dialog window depending on the option type
 * selected.
 * @param type if the window is for archive now, setting auto archive or
 * @param additional params
 * continuing the archive process.
 */
CcsArchive.prototype.switchDialogContent = function(type, params) {
    var okButton = this.archiveDialog.getButton(DwtDialog.OK_BUTTON);
    okButton.setVisible(true);
    var archiveDesc = document.getElementById("lblAutoArchive");
    var chkbox = document.getElementById("chkAutoArchive");
    
    switch (type) {
    case CcsArchive.CCS_ARCHIVE_CONTINUE:
        document.getElementById("archiveDiv").style.display = "none";
        document.getElementById("archiveDeleteDiv").className = "archiveDeleteContinue";
        document.getElementById("archiveWait").className = "archiveWaitStyleHidden";
        okButton.setText(this.getMessage("btn_continue"));
        this.archiveDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnListener, [CcsArchive.CCS_ARCHIVE_CONTINUE, params]));
        this.archiveOptionsView.setSize("340", "60");
        break;
    case CcsArchive.CCS_ARCHIVE_OLD:
        this.resetDialog();
        // change the description
        archiveDesc.innerHTML = this.getMessage("view_archive_desc");
        chkbox.style.display = "none";
        this.clearInput();
        this.enableOptions(true);
        this.archiveDialog.setTitle(this.getMessage("tb_archive"));
        // change the button label and listener parameters        
        okButton.setText(this.getMessage("folder_archive"));
        this.archiveDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnListener, [CcsArchive.CCS_ARCHIVE_OLD]));
        break;
    case CcsArchive.CCS_ARCHIVE_AUTO:
        this.resetDialog();
        // change description and show checkbox
        archiveDesc.innerHTML = this.getMessage("view_auto_archive_enable");
        chkbox.style.display = "";
        chkbox.checked = this.autoArchiveEnabled;
        this.setInputParams(this.loadSettings());
        this.enableOptions(this.autoArchiveEnabled);
        this.archiveDialog.setTitle(this.getMessage("dialog_auto_archive"));
        // change the button label and listener parameters
        okButton.setText(this.getMessage("btn_save"));
        this.archiveDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnListener, [CcsArchive.CCS_ARCHIVE_AUTO]));
        break;
    case CcsArchive.CCS_ARCHIVE_WAIT:
        document.getElementById("archiveDiv").style.display = "none";
        document.getElementById("archiveWait").className = "archiveWaitStyle";
        okButton.setVisible(false);
        this.archiveOptionsView.setSize("340", "60");
        break;
    default:
        break;
    }
};

/**
 * Reset the size of the dialog window and content
 */
CcsArchive.prototype.resetDialog = function() {
    document.getElementById("archiveDeleteDiv").className = "archiveDeleteContinueHidden";
    document.getElementById("archiveWait").className = "archiveWaitStyleHidden";
    document.getElementById("archiveDiv").style.display = "";
    this.archiveOptionsView.setSize("340", "180");
};

/**
 * Refresh the inbox dialog
 */
CcsArchive.prototype.refresh = function(){
    try {
        // refresh the current search query
        var q = appCtxt.getSearchController().currentSearch.query;
        appCtxt.getSearchController().search({query:q});
    } catch (e) {}
};

/**
 * Runs the auto archive feature if it is enabled in the options. 
 */
CcsArchive.prototype.runAutoArchive = function() {
    this.autoArchiveEnabled = this.getUserProperty(CcsArchive.CCS_ARCHIVE_AUTO_ENABLED) === "true";
    var run = this.getUserProperty(CcsArchive.CCS_ARCHIVE_AUTO_LAST_RUN) !== AjxDateFormat.format("dd/MM/yyyy", new Date());
    
    if (this.autoArchiveEnabled && run) {
        var params = this.loadSettings();
        // run
        this.openArchiveDialog(CcsArchive.CCS_ARCHIVE_WAIT, params);
        this.setupMsgSearch(params);
        // save date
        this.setUserProperty(CcsArchive.CCS_ARCHIVE_AUTO_LAST_RUN, AjxDateFormat.format("dd/MM/yyyy", new Date()), true);
    }
};

/**
 * Settings example: archiveby-number-datetype-unread-export-delete
 *                   y-10-m-n-y-n
 * 
 */
CcsArchive.prototype.loadSettings = function() {
    var settings = this.getUserProperty(CcsArchive.CCS_ARCHIVE_AUTO_SETTINGS);
    if (settings) {
        settings = settings.split("-");
        var params = {};
        params.archiveBy = settings[0] || this.archiveBy;
        params.number = parseInt(settings[1]) || "";
        params.dateType = settings[2] || "m";
        params.includeUnread = settings[3] === "true" || false;
        params.exportArchived =  settings[4] === "true" || false;
        params.deleteAfter = settings[5] === "true" || false;
        params.isAuto = true;
        return params;
    }
};

/**
 * Save the settings for the auto archiving feature.
 */
CcsArchive.prototype.saveSettings = function() {
    var params = this.getInputParams();
    var settings = [params.archiveBy, params.number, params.dateType, params.includeUnread, params.exportArchived, params.deleteAfter].join("-");
    // save settings
    this.setUserProperty(CcsArchive.CCS_ARCHIVE_AUTO_ENABLED, this.autoArchiveEnabled);
    this.setUserProperty(CcsArchive.CCS_ARCHIVE_AUTO_SETTINGS, settings, true);
};

/**
 * This function gets the folder information from the server
 * @param folder      the folder object that contains basic information for searching
 *        folder.id   if specified, the function will search for the folder by id
 *        folder.path if specified, the function will search for the folder by its path
 *        folder.name used to create a new folder if it is not found or no id or path was provided. 
 */
CcsArchive.prototype.getFolder= function(folder) {
    if (folder.id || folder.path) {
        var soapDoc = AjxSoapDoc.create("GetFolderRequest", "urn:zimbraMail");
        var folderNode = soapDoc.set("folder");
        
        if (folder.id) {
            // use id if available
            folderNode.setAttribute("l", folder.id);
        } else {
            // path has the form "parent/child"
            folderNode.setAttribute("path", folder.path);
        }       
        
        var response = appCtxt.getAppController().sendRequest(
                {
                    soapDoc:       soapDoc, 
                    asyncMode:     false, 
                    errorCallback: new AjxCallback(this, this.getFolderErrorHandler, [folder])
                });
        if (response) {
            var folderResponse = response.GetFolderResponse.folder[0];
            folder.id = folderResponse.id;
            folder.name = folderResponse.name;
        }
    } else {
        // there is no id or path provided so create a new one
        this.createFolder(folder);
    }
};

/**
 * If there was an error finding the folder, create a new one
 * @param folder the folder object that contains basic information for searching
 * @param response
 * @returns {Boolean} notifies the calling handler that the exception was processed
 */
CcsArchive.prototype.getFolderErrorHandler = function(folder, response) {
    this.createFolder(folder);
    return true;
};

/**
 * This function creates a new folder using the zimbra ajax framework
 * @param folder object that contains the parameters for the folder
 *        folder.name the name to be used when creating the folder.
 */
CcsArchive.prototype.createFolder = function(folder) {
    var soapDoc = AjxSoapDoc.create("CreateFolderRequest", "urn:zimbraMail");
    var folderNode = soapDoc.set("folder");
    folderNode.setAttribute("name", folder.name);
    folderNode.setAttribute("l", folder.parent || appCtxt.getFolderTree().root.id);
    
    var response = appCtxt.getAppController().sendRequest(
            {
                soapDoc:       soapDoc, 
                asyncMode:     false, 
                errorCallback: new AjxCallback(this, this.createFolderErrorHandler, [folder])
            });
    if (response && response.CreateFolderResponse) {
        folder.id = response.CreateFolderResponse.folder[0].id;
    }
};
/**
 * Called when the create folder request fails, if the error code is a duplicate name 
 * it will then attach a sequence number to make it unique
 * @param folder
 * @param response
 * @returns {Boolean}
 */
CcsArchive.prototype.createFolderErrorHandler = function(folder, response) {
    if (ZmCsfeException.MAIL_ALREADY_EXISTS === response.code) {
        if (!folder.baseName) {
            folder.baseName = folder.name;
        }
        folder.name = folder.baseName + this.counter++;
        this.createFolder(folder);
        return true;
    }
};

/**
 * Sets and saves the "Archive" folder id if it is 
 * different from the currently saved one
 * @param id the id to save
 */
CcsArchive.prototype.setArchiveFolderId = function(id) {
    if (this.getArchiveFolderId() !== id) {
        this.setUserProperty(CcsArchive.CCS_ARCHIVE_FOLDER_ID, id, true);
    }
};

/**
 * Gets the "Archive" folder id
 * @returns the id
 */
CcsArchive.prototype.getArchiveFolderId = function() {
    return (this.archiveFolderId) ? this.archiveFolderId : this.getUserProperty(CcsArchive.CCS_ARCHIVE_FOLDER_ID);
};

/**
 * This class contains the structure used to organize 
 * the messages' id and their associated destination folders
 * @returns {CcsArchiveMessages}
 */
function CcsArchiveMessages() {
    this.archiveMsgs = [];
}

/**
 * Using the label as a key, it will add the id to the array associated
 * @param label the label to be used as key
 * @param id the value to be associated
 */
CcsArchiveMessages.prototype.addId = function(label, id) {
    if (!this.archiveMsgs[label]) {
        this.archiveMsgs[label] = {ids : []};
    }
    this.archiveMsgs[label].ids.push(id);
};

/**
 * Adds the folder id to the associated label 
 * @param label used as a key
 * @param id the folder id
 */
CcsArchiveMessages.prototype.addFolderId = function(label, id) {
    this.archiveMsgs[label].folder = id;
};

/**
 * Adds the message id using the 'from' address from the message
 * @param msg the ZmMailMsg object
 */
CcsArchiveMessages.prototype.addFromAddress = function(msg) {
    // note: without the .address the label shown would be of the format: "Name Last" <email@domain>
    // msg.e[0].a gets the address from a search result.
    var address = msg.getAddress ? msg.getAddress(AjxEmailAddress.FROM).address : msg.e[0].a;
    this.addId(address, msg.id);
};

/**
 * Adds the message id using its date
 * @param msg the ZmMailMsg object
 * @param archiveBy
 */
CcsArchiveMessages.prototype.addFromDate = function(msg, archiveBy) {
    if (!this.dateFormatter) {
        // this format will output year and month number followed by a truncated version of the month name, e.g. 2011-Jan or just the year
        this.dateFormatter = CcsArchive.BY_MONTH === archiveBy ? new AjxDateFormat("yyyy-MM-MMM") : new AjxDateFormat("yyyy");
    }
    this.addId(this.dateFormatter.format(new Date(msg.date || msg.d)), msg.id);    
};

/**
 * Gets the hash array
 * @returns {Array}
 */
CcsArchiveMessages.prototype.getHash = function() {
    return this.archiveMsgs;
};
/**
 * Add the message to the hash
 * @param msg the ZmMailMsg object
 * @param archiveBy the preference to archive by year, month or sender.
 */
CcsArchiveMessages.prototype.add = function(msg, archiveBy) {
    if (CcsArchive.BY_SENDER === archiveBy) {
        this.addFromAddress(msg);
    } else {
        this.addFromDate(msg, archiveBy);
    }
};

//UTILITIES
/**
 * Get the keys from the object passed
 */
Object.keys = Object.keys || function(o) {  
    var result = [];  
    for(var name in o) {  
        if (o.hasOwnProperty(name))  
          result.push(name);  
    }  
    return result;  
};

