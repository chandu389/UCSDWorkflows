/*
Name: PSC_GetVMDetailsusingVMName.js
Author: G V R Chandra Reddy (vgolugur@cisco.com)
Date: 4th October 2017
Version: 1.0
UCSD Version: 6.0
PSC Version 12.0 (Virtual Appliance)

Description:
	This Custom adds a new record to an existing table in PSC

	//INPUTS:
		PSCCredentials: [Credential Policy] Mandatory
		PSCIP: [Generic Text input] Mandatory
		SITableName: [Generic Text input] Mandatory
		rollback: [Boolean] If checked, the SI will be deleted on rollback.

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
loadLibrary("Generic/getAccount");
loadLibrary("PSC/SITasks");

//main function

var PSCAccount		= 	getAccount(input.PSCCredentials);
var PSCUser			= 	PSCAccount.getUserName();
var PSCPassword 	= 	PSCAccount.getPassword();
var PSCPort       	= 	parseInt(String(PSCAccount.getPort()));
var PSCProtocol   	= 	String(PSCAccount.getProtocal());
var PSCIP           = 	input.PSCIP;
var SITableName   	= 	input.SITableName;
var VMName          =   input.VMName;
var filter          =   input.filter;
if (PSCProtocol == "http"){
    var httpClient = new HttpClient();
    httpClient.getHostConfiguration().setHost(PSCIP, 80, "http");
}else{
    var httpClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
}
httpClient.getParams().setCookiePolicy("default");
var ApprovalId;
var data 		    = 	getSITablePostwithClient(httpClient,PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,filter);
var jsonData		= 	String(data);  //Get the JSON String.
var results 		= 	new JSONObject(jsonData);
var serviceitem 		= 	results.getJSONObject("serviceitem");
var serviceItemData 	=	serviceitem.getJSONArray("serviceItemData");
var vCPU,RAM,VMName,Name,cloudName;
if (serviceItemData.length() > 0){
   var row      =   serviceItemData.getJSONObject(0);
   var items    =   row.getJSONArray("items");
   var fields   =   items.getJSONObject(0);
   Name         =   fields.get("Name");
   ApprovalId   =   fields.get("ApprovalId");
}

output.VMModificationRequestsName = Name;
output.ApprovalId   = ApprovalId;
