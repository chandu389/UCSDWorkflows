/*
Name: PSC_Delete_SI_Record.js
Author: Alejandro Madurga (almadurg@cisco.com)
Date: 17h December 2015
Version: 1.0
UCSD Version: 5.3
PSC Version 11.1 (Virtual Appliance)

Description:
	This Custom deletes an existing record on PSC.
	
	//INPUTS:
		PSCCredentials: [Credential Policy] Mandatory
		PSCIP: [Generic Text input] Mandatory
		SITableName: [Generic Text input] Mandatory
		SIName: [Generic Text input] Mandatory
			
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


//FUNCTIONS

   /**
     * Get the Credentials from the Credentials policy.
     *
     * @return account with the username, password, port and protocol.
     */
function getAccount(accountName){
	logger.addInfo("Looking for the following account:" + accountName); 
	var account = PersistenceUtil.getCredentialPolicyByName(accountName);
	if (account != null){
		logger.addInfo("Account:" + accountName + " found."); 
		return account;
	}
	else{
		logger.addError("Account:" + accountName + " NOT found."); 
		ctxt.setFailed("No Account found with name: " + accountName);
	}
}



function PSCLogin(PSCIP,PSCUser,PSCPassword,PSCPort){
	//Now create the HTTP Client and configure the HTTP Method
	//Create the HTTPS client 
	var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	httpsClient.getParams().setCookiePolicy("default");
	var loginURL = "/RequestCenter/nsapi/authentication/token?persistent=true"
	var loginPayload = "";
	var httpMethod = new GetMethod(loginURL);
	//requestEntity = new StringRequestEntity(loginPayload,"application/json","UTF-8");
	//httpMethod.setRequestEntity(requestEntity);
	httpMethod.addRequestHeader("username", PSCUser);
	httpMethod.addRequestHeader("password", PSCPassword);
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{   
		logger.addError("Failed to execute HTTP call. HTTP response code: "+statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		 ctxt.setFailed("Request failed.");
		 
	} else {
		logger.addInfo("PSC Login successfull with user: " + PSCUser);
		var responseBody = String(httpMethod.getResponseBodyAsString());
		var token = responseBody.split("utid=")[1]
		token = token.substring(0,token.length-2)
		token = token.replace(/"/g,"");
		return token
		
	}
}


/* TOKEN FUNCTION NOT WORKING
function getSITable(PSCIP,PSCPort,token,SITableName){
	var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	httpsClient.getParams().setCookiePolicy("default");
	if(SITableName.indexOf("Si")!=0){
		SITableName = "Si" + SITableName;
	}
	var tableURL = "/RequestCenter/nsapi/serviceitem/Si" +  SITableName;
	var httpMethod = new GetMethod(tableURL);
	httpMethod.addRequestHeader("utid", token);
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{   
		logger.addError("Unable to get the table data with name " + SITableName + ". HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		logger.addInfo("Table " + SITableName + " retrieved successfully.");
		var responseBody = String(httpMethod.getResponseBodyAsString());
		logger.addInfo(responseBody)
		return responseBody;
		
	}
}
*/
function deleteSI(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,SIName){
	if (PSCProtocol == "http"){
		var httpsClient = new HttpClient();
		httpsClient.getHostConfiguration().setHost(PSCIP, 80, "http");
	}else{
		var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	}
	//Create the JSON estructure
	var jsonData = new HashMap();
	var serviceitem = new HashMap();
	var serviceItemData = new HashMap();
	var serviceItemAttribute = util.createNameValueList(); 
	serviceItemAttribute.addNameValue("Name",SIName); 
	serviceItemData.put("serviceItemAttribute",serviceItemAttribute.getList())
	serviceitem.put("name",SITableName);
	serviceitem.put("serviceItemData",serviceItemData);
	jsonData.put("serviceitem",serviceitem);
	var tableURL = "/RequestCenter/nsapi/serviceitem/process";
	var dataPayload = String(JSON.javaToJsonString(jsonData, jsonData.getClass()));
	logger.addInfo("PAYLOAD: " + dataPayload);
	var httpMethod = new PostMethod(tableURL);
	requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
	httpMethod.setRequestEntity(requestEntity);
	httpMethod.addRequestHeader("username", PSCUser);
	httpMethod.addRequestHeader("password", PSCPassword);
	httpMethod.addRequestHeader("X-HTTP-Method-Override", "DELETE");
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{   
		logger.addError("Unable to add the new SI on the table " + SITableName + ". HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		var responseBody = String(httpMethod.getResponseBodyAsString());
		logger.addInfo(responseBody)
	}
}
	
//
//	MAIN PROGRAM
//
var PSCCredentials  = String(input.PSCCredentials)
var PSCIP  = String(input.PSCIP)
var SITableName  = String(input.SITableName)
var SIName = String(input.SIName)

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

//var token = PSCLogin(PSCIP,PSCUser,PSCPassword,PSCPort);
deleteSI(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,SIName);
