/*
Name: SNowUpdateSRAdditionalComments.js
Author: Alejandro Madurga (almadurg@cisco.com)
Date: 14th January 2016
Version: 0.1
UCSD Version: 5.3.2.1

Description:
	This custom task add additional comments on a existing Service Now Service Request (SR)
	
	//INPUTS:
		SNAccountName: [Credential Policy] Mandatory, the credential policy name to use to login into 
									Service Now server, should be the "Cisco Identity Services Engine" policy type 
		SNIP: [Generic Text input] Mandatory, the IP or Hostname of the Service Now Server
		SNSR: [Generic Text input] Mandatory, the Service Now SR Id to update. 
				Could be the SR Number, ie REQ0000011 or the sys_id, ie: 0ca94f715f6021001c9b2572f2b477af
		SNComments: [Generic Text Input] Optional, the message we want to add to the SR Additional Comments.
		
	
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
importPackage(org.apache.commons.httpclient.auth);
importPackage(org.json);

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
		ctxt.setFailed("No Account found with name: " + accountName);
	}
}

  /**
     * Get the sys_id from a given SR Number.
     *
     * @return the sys_id for the SR.
     */
function getSRSysId(SNIP,SNPort,SNUsername,SNPassword,SNSR){
	var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(SNIP,SNPort);
	httpsClient.getParams().setCookiePolicy("default");
	httpsClient.getParams().setAuthenticationPreemptive(true);
	var tableURL = "/api/now/table/sc_request?sysparm_query=number%3D" + SNSR + "&sysparm_fields=sys_id&sysparm_limit=1"
	var httpMethod = new GetMethod(tableURL);
	httpMethod.addRequestHeader("Content-type", "application/json");
	httpMethod.setRequestHeader('Accept','application/json');
	httpMethod.setRequestHeader('Authorization', 'Basic '+ String(Base64Coder.encodeString(SNUsername+':'+SNPassword)));
	httpMethod.setDoAuthentication(true);
	//logger.addWarning("This is the header: " + Base64Coder.encodeString(SNUsername+':'+SNPassword));
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{   
		logger.addError("Unable to get the sys_id from the Service Request " + SNSR + ". HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		var responseBody = String(httpMethod.getResponseBodyAsString());
		//logger.addInfo("REST API Executed successfully, RAW result: " + responseBody);
		var jsonData = new JSONObject(responseBody);
		var result = jsonData.getJSONArray("result");
		var sys_id = result.get(0).get("sys_id") 
		return sys_id;
		
	}
}


  /**
     * Add a Work note to the work note lists
     *
     * @return None
     */
function addSRAdditionalComments(SNIP,SNPort,SNUsername,SNPassword,SNSR,SNComments,IPAddress){
	var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(SNIP,SNPort);
	httpsClient.getParams().setCookiePolicy("default");
	httpsClient.getParams().setAuthenticationPreemptive(true);
	var tableURL = "/api/now/table/sc_request/"+ SNSR
	var httpMethod = new PutMethod(tableURL);
	httpMethod.addRequestHeader("Content-type", "application/json");
	httpMethod.setRequestHeader('Accept','application/json');
	httpMethod.setRequestHeader('Authorization', 'Basic '+ String(Base64Coder.encodeString(SNUsername+':'+SNPassword)));
	httpMethod.setDoAuthentication(true);
	var map = new HashMap();
	map.put("comments", SNComments);
	map.put("u_ip_address", IPAddress);
	var body = JSON.javaToJsonString(map, map.getClass());
	httpMethod.setRequestEntity(new StringRequestEntity(body));
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{   
		logger.addError("Unable to get update the SR Notes for the Service Request " + SNSR + ". HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		//logger.addInfo("REST API Executed successfully, RAW result: " + responseBody);
		logger.addInfo("Work note added successfully: " + SNComments);
		
	}
}

// ------------ M A I N -------------

//INPUTS Cleanup

var SNAccountName = String(input.SNAccountName);
var SNIP = String(input.SNIP);
var SNSR = String(input.SNSR);
var SNComments = String(input.SNComments);
var IPAddress = String (input.IPAddress);

//Get the info from the account.
var SNAccount = getAccount(SNAccountName);
var SNUsername = SNAccount.getUserName();
var SNPassword = SNAccount.getPassword();
var SNPort = parseInt(String(SNAccount.getPort()));
var SNProtocol = String(SNAccount.getProtocal());

//Verbose output, could be hidden.
logger.addInfo("Using the following parameters from the selected account: " + SNAccountName);
logger.addInfo(" ---- Username: " + SNUsername );
logger.addInfo(" ---- Protocol: " + SNProtocol);
logger.addInfo(" ---- Port: " + String(SNPort));
logger.addInfo(" ----Pass :" + String(SNPassword));

//Check if we are getting the SR Number, ie REQ0000011 or the sys_id, ie: 0ca94f715f6021001c9b2572f2b477af
// In case is the number, we need the Sys_ID to interact with the REST API.
logger.addInfo("Updating Service Now Service Request " + SNSR);
if(SNSR.length < 32){
	SNSRID = getSRSysId(SNIP,SNPort,SNUsername,SNPassword,SNSR);
	logger.addInfo("Service Now Sys_ID for Service Request " + SNSR + " is: " + SNSRID);
}else{
	SNSRID = SNSR;
}

//Update the notes.
addSRAdditionalComments(SNIP,SNPort,SNUsername,SNPassword,SNSRID,SNComments,IPAddress);
