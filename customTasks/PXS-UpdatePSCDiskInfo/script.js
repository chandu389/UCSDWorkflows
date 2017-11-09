/*
Name: PXS-UpdatePSCDiskInfo.js
Author: G V R Chandra Reddy (vgolugur@cisco.com)
Date: 24th Oct 2017
Version: 0.1
UCSD Version: 6.5.0.1
PSC Version 12.1

Description:
	This Custom adds VM Information into PSC
	//INPUTS:
		PSCCredentials: [Credential Policy] Mandatory
		PSCIP: [Generic Text input] Mandatory
		SITableName: [Generic Text input] Mandatory
		VMName: [Generic Text Input] Mandatory
		SCSIID: [Generic Text Input] Mandatory
		DiskLabel: [Generic Text Input] Mandatory
		DiskSize: [Generic Text Input] Mandatory


	//OUTPUTS
		NONE
*/

//IMPORTS
importPackage(java.util);
importPackage(java.lang);
importPackage(java.io);
importPackage(java.net);
importPackage(java.security);
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);
importPackage(com.cloupia.lib.util);
importClass(com.cloupia.lib.util.JSON);
importPackage(javax.net.ssl);
importPackage(com.cloupia.model.cIM);
importPackage(com.cloupia.service.cIM.inframgr);
importPackage(org.apache.commons.httpclient);
importPackage(org.apache.commons.httpclient.methods);
importPackage(org.apache.commons.httpclient.protocol);
importPackage(com.cloupia.lib.util.easytrust);
importPackage(com.cloupia.lib.cIaaS.vcd.api);
importPackage(org.apache.commons.httpclient);
importPackage(org.apache.commons.httpclient.methods);
importPackage(org.apache.commons.httpclient.protocol);
loadLibrary("Generic/getAccount");



//FUNCTIONS

  /**
     * Add or update a new Service Item on a table.
     *
     * @return None
     */
function addVMDisk(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,VMName,SCSIID,DiskLabel,DiskSize)
{
	//Get the VM Information
	var Status = "Active";
	var fullName = VMName + ":" + SCSIID;
	var FriendlyName = DiskLabel;
	if (PSCProtocol == "http"){
		var httpsClient = new HttpClient();
		httpsClient.getHostConfiguration().setHost(PSCIP, 80, "http");
	}else{
		var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	}

	httpsClient.getParams().setCookiePolicy("default");
	//Create the JSON estructure
	var jsonData = new HashMap();
	var serviceitem = new HashMap();
	var serviceItemData = new HashMap();
	var serviceItemAttribute = util.createNameValueList();
	var subscriptionData = new HashMap();
	serviceItemAttribute.addNameValue("Name",fullName);
	serviceItemAttribute.addNameValue("DiskLabel",DiskLabel);
	serviceItemAttribute.addNameValue("SCSIID",SCSIID);
	serviceItemAttribute.addNameValue("Status",Status);
	serviceItemAttribute.addNameValue("VMName",VMName);
	serviceItemAttribute.addNameValue("FriendlyName",FriendlyName);
	serviceItemAttribute.addNameValue("DiskSize",DiskSize);
	serviceItemData.put("serviceItemAttribute",serviceItemAttribute.getList())
	serviceitem.put("name",SITableName);
	serviceitem.put("serviceItemData",serviceItemData);
	jsonData.put("serviceitem",serviceitem);
	var tableURL = "/RequestCenter/nsapi/serviceitem/process";
	var httpMethod = new PostMethod(tableURL);
	var dataPayload = String(JSON.javaToJsonString(jsonData, jsonData.getClass()));
	logger.addWarning("PAYLOAD: " + dataPayload)
	requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
	httpMethod.setRequestEntity(requestEntity);
	httpMethod.addRequestHeader("username", PSCUser);
	httpMethod.addRequestHeader("password", PSCPassword);
	try{
		httpsClient.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		if (statuscode != 200)
		{
			logger.addWarning("Unable to add the new SI on the table " + SITableName + ". HTTP response code: " + statuscode);
			logger.addWarning("Response = "+httpMethod.getResponseBodyAsString());
			httpMethod.releaseConnection();
			// Set this task as failed.
			ctxt.setFailed("Unable to update PSC")
			ctxt.exit();

		} else {
			var responseBody = String(httpMethod.getResponseBodyAsString());
			httpMethod.releaseConnection();
			logger.addInfo(responseBody)
		}
	}catch(e){
		logger.addWarning("Unable to add the new SI: " + e.message);
	}
}

  /**
     * Rollback the SI creation with a SI Deletion.
     *
     * @return None
     */

function registerUndoTask(PSCCredentials,PSCIP,SITableName,Name)
{
	var handler = "custom_PSC_Delete_SI_Record";
	var task = ctxt.createInnerTaskContext("custom_PSC_Delete_SI_Record");
    task.setInput("PSCCredentials",PSCCredentials);
	task.setInput("PSCIP",PSCIP);
	task.setInput("SITableName",SITableName);
	task.setInput("SIName",Name);
	ctxt.getChangeTracker().undoableResourceModified("Delete VM Service Items.",
                String(ctxt.getSrId()),
                "Delete VM Service Items",
				"Table: " + SITableName,
                handler,
                task.getConfigObject());
}

//
//	MAIN PROGRAM
//
var PSCCredentials  = String(input.PSCCredentials)
var PSCIP  = String(input.PSCIP)
var SITableName  = String(input.SITableName);
//var ouname = String(input.ouname);
//var CustomerName = String(input.CustomerName);
var VMName = String(input.VMName);
var SCSIID = String(input.SCSIID);
var DiskLabel = String(input.DiskLabel);
var DiskSize = parseInt(String(input.DiskSize));

//Get the info from the account.
var PSCAccount = getAccount(PSCCredentials);
var PSCUser = PSCAccount.getUserName();
var PSCPassword = PSCAccount.getPassword();
var PSCPort = parseInt(String(PSCAccount.getPort()));
var PSCProtocol = String(PSCAccount.getProtocal());

//Show Connection Info.
logger.addInfo("Using the following parameters from the selected account: " + PSCCredentials);
logger.addInfo(" ---- Username: " + PSCUser );
logger.addInfo(" ---- Protocol: " + PSCProtocol);
logger.addInfo(" ---- Port: " + String(PSCPort));

var PSCVMName = addVMDisk(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,VMName,SCSIID,DiskLabel,DiskSize);
//Load the Rollback Task.
//registerUndoTask(PSCCredentials,PSCIP,SITableName,VMName + ":" + SCSIID);
