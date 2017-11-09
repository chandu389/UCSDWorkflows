/*
Name: InterfaceAPIImplementation.js
Author: Neha Gupta (nehag2@cisco.com)
Date: 23rd September 2017
Updated by: Neha Gupta (nehag2@cisco.com)
Updated Date: 27th September 2017
Version: 1.0
UCSD Version: 6.5


Description:
	This libaray has API implementation for the interfaces.
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
importClass(com.cloupia.lib.util.JSON);

//Load  DNS Library
  loadLibrary("Infoblox/DNS");
  loadLibrary("Interface/Common");

//FUNCTIONS

	function getNameRequest(type,subtype,securityZone,subSecurityZone,dataCenter,environment){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/requestName";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		//httpMethod.setRequestHeader('Authorization', 'Basic '+ String(Base64Coder.encodeString(InfobloxUser+':'+InfobloxPassword)));
		//httpMethod.setDoAuthentication(true);
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("type",type);
        json.put("subtype",subtype);
        json.put("securityZone",securityZone);
        json.put("subSecurityZone",subSecurityZone);
        json.put("dataCenter",dataCenter);
        json.put("environment",environment);
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		// Response: {'name':'lin00011','backupName':'lin00011_bu'}
		output.name= response.substring(response.indexOf("name")+7, response.indexOf(",")-1);
		
		if(response.substring(response.indexOf("backupName")+12, response.indexOf("}")) == "null"){
		
		    output.backup_name = null;
		}
		else
		output.backup_name=response.substring(response.indexOf("backupName")+13, response.indexOf("}")-1);
		
	}
	
	
	
	function executeScript(serverName,scriptId,parameters){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/executeScript";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("serverName",serverName);
        json.put("scriptId",scriptId);
        json.put("parameters",parameters);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to fetch execution uuid for the script. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		
		output.scriptExecutionUuid= response.substring(response.indexOf("scriptExecutionUuid")+22, response.indexOf("}")-1);
		input ="scriptExecutionUuid="+output.scriptExecutionUuid;
		Register_UndoTask("custom_PXS-Interface29",input,"Rollback_Script_Execution","Rollback_Script_Execution:"+output.scriptExecutionUuid);

	}
	
	
	function getScriptExecutionStatus(scriptExecutionUuid){
        //Get the status of an executed script
		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/getScriptExecutionStatus/"+scriptExecutionUuid;
		var httpMethod = new GetMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		
		//Creating the JSON payload
	/*	var json = new JSONObject();
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);*/
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to fetch execution uuid for the script. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		
		output.status= response.substring(response.indexOf("status")+9, response.indexOf("}")-1);
	}
	
	
	function requestImdApproval(vmMetadata,requestedVCpu,requestedMemory,requestedStorage,requesterInformation,serverName,uniqueId){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/requestImdApproval";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');

		//Creating the JSON payload
		var jsonData = new JSONObject();
		var metadata = new JSONObject();
        jsonData.put("vmMetadata",metadata);
        jsonData.put("requestedVCpu",requestedVCpu);
        jsonData.put("requestedMemory",requestedMemory);
        jsonData.put("requestedStorage",requestedStorage);
        jsonData.put("requesterInformation",requesterInformation);
        jsonData.put("serverName",serverName);
        jsonData.put("uniqueId",uniqueId);
        var dataPayload = jsonData.toString();
        // logger.addInfo("jSON Data "+jsonData.getClass());
        //var dataPayload = String(JSON.javaToJsonString(jsonData, jsonData.getClass()));
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		
		output.imdApprovalUuid= response.substring(response.indexOf("imdApprovalUuid")+18, response.indexOf("}")-1);
	
	}
	
	function cancelImdApproval(imdApprovalUuid){
        //To cancel IMD request
		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/cancelImdApproval";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("imdApprovalUuid",imdApprovalUuid);
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to fetch execution uuid for the script. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
	}
	
	
	function startBackup(type,subtype,parameters){
        //Start the backup of given server
		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/startBackup/";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("type",type);
        json.put("subtype",subtype);
        var parametersJSON = new JSONObject();
        //parametersJSON.put("VmParameters",parameters);
        json.put("parameters", parametersJSON);
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to fetch execution uuid for the script. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = Start Back up executed successfully");
		logger.addInfo("Response Code= "+statuscode);
		
	}
	
	
	
	function rollbackScriptExecution(scriptExecutionUuid){
        //Start the backup of given server
		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/rollbackScriptExecution/";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("scriptExecutionUuid",scriptExecutionUuid);
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to fetch execution uuid for the script. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = Rollback script executed successfully");
		logger.addInfo("Response Code= "+statuscode);
		
	}
	

    function fetchSecurityGroups(dataCenter,availabilityArea,securityZone,subSecurityZone,os,environment){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/fetchSecurityGroups";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("dataCenter",dataCenter);
        json.put("availabilityArea",availabilityArea);
        json.put("securityZone",securityZone);
        json.put("subSecurityZone",subSecurityZone);
        json.put("os",os);
        json.put("environment",environment);
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		// Response: {"securityGroups": [{"securityGroupName": "string"}]}
		if(response.contains("Name")){
        	output.securityGroupName= response.substring(response.indexOf("Name")+7, response.indexOf("}")-1);
        }
        else{
            output.securityGroupName=null;
        }
	
		
	}

	
    function fetchVSysVRouterMapping(dataCenter,availabilityArea){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/fetchVSysVRouterMapping";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("dataCenter",dataCenter);
        json.put("availabilityArea",availabilityArea);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		// Response: {"securityGroups": [{"securityGroupName": "string"}]}
		output.vSys= response.substring(response.indexOf("vsys")+7, response.indexOf(",")-1);
		output.vRouter=response.substring(response.indexOf("vrouter")+10, response.indexOf("}")-1);
		logger.addInfo("vSys= "+output.vSys);
		logger.addInfo("vRouter= "+output.vRouter);
		
	}
	
	
	
    function fetchSuperNetMapping(dataCenter,availabilityArea){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/fetchSuperNetMapping";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("dataCenter",dataCenter);
        json.put("availabilityArea",availabilityArea);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		// Response: {"securityGroups": [{"securityGroupName": "string"}]}
		output.infrastructureSuperNetV4= response.substring(response.indexOf("infrastructureSuperNetV4")+27, response.indexOf(",")-1);
		output.endpointSuperNetV4=response.substring(response.indexOf("endpointSuperNetV4")+21, response.indexOf("infrastructureSuperNetV6")-3);
		output.infrastructureSuperNetV6= response.substring(response.indexOf("infrastructureSuperNetV6")+27, response.indexOf("endpointSuperNetV6")-3);
		output.endpointSuperNetV6=response.substring(response.indexOf("endpointSuperNetV6")+21, response.indexOf("}")-1);
		
		logger.addInfo("infrastructureSuperNetV4= "+output.infrastructureSuperNetV4);
		logger.addInfo("endpointSuperNetV4= "+output.endpointSuperNetV4);
		logger.addInfo("infrastructureSuperNetV6= "+output.infrastructureSuperNetV6);
		logger.addInfo("endpointSuperNetV6= "+output.endpointSuperNetV6);
		
    }
	
	
	
	
		
    function requestCName(appCode,environment){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/requestCName";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("appCode",appCode);
        json.put("environment",environment);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		
		output.cName= response.substring(response.indexOf("cName")+8, response.indexOf("}")-1);
		logger.addInfo("cName= "+output.cName);
	}
	
		
	function checkProjectCode(projectCode){
        //Get the status of an executed script
		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/checkProjectCode/"+projectCode;
		var httpMethod = new GetMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to fetch execution uuid for the script. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		
		output.valid= response.substring(response.indexOf("valid")+8, response.indexOf("}")-1);
	}
	
	function requestAs(availabilityArea,dcLocation,securityZone){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/requestAs";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
      
        json.put("availabilityArea",availabilityArea);
        json.put("dcLocation",dcLocation);
        json.put("securityZone",securityZone);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		output.asNumber= response.substring(response.indexOf("asNumber")+10, response.indexOf("}"));
		logger.addInfo("AS Number= "+output.asNumber);
		//input ="scriptExecutionUuid="+output.scriptExecutionUuid;
		var input = "asNumber="+output.asNumber;
    	Register_UndoTask("custom_PXS-Interface17",input,"ReleaseAsNumber","ReleaseAsNumber:"+output.asNumber);
		
	}
	
	function releaseAs(asNumber){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/releaseAs";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
     
        json.put("asNumber",asNumber);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
	}
	
	function updateAs(asNumber,securityZone){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/updateAs";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
      
        json.put("asNumber",asNumber);
        json.put("securityZone",securityZone);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
	}
	
	function requestVlans(availabilityArea,dcLocation,vlanPool,amountOfVlans){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/requestVlans";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
      
        json.put("availabilityArea",availabilityArea);
        json.put("dcLocation",dcLocation);
        json.put("vlanPool",vlanPool);
        json.put("amountOfVlans",amountOfVlans);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
		//Set response in output variables
		for(var i=0; i<amountOfVlans; i++){
		     output.uuid = response.substring(response.indexOf("uuid", response.indexOf("uuid") + i)+7, response.indexOf("vlanId", response.indexOf("vlanId") + i)-3);
		     //Need to change code to support multiple vlanId
		     output.vlanId = response.substring(response.indexOf("vlanId", response.indexOf("vlanId") + 0)+8, response.indexOf("}"));
		}
		//output.vSys= response.substring(response.indexOf("vsys")+7, response.indexOf(",")-1);
		//output.vRouter=response.substring(response.indexOf("vrouter")+10, response.indexOf("}")-1);
		logger.addInfo("uuid= "+output.uuid);
		logger.addInfo("vlanId= "+output.vlanId);
		var input = "uuid="+output.uuid;
    	Register_UndoTask("custom_PXS-Interface14",input,"Release_VLAN","Release_VLAN:"+output.uuid);
		
	}
	
	
	function updateVlan(uuid,vlanId,availabilityArea,dcLocation,vlanPool,securityZone){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/updateVlan";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
        json.put("uuid",uuid);
        json.put("vlanId",vlanId);
        json.put("availabilityArea",availabilityArea);
        json.put("dcLocation",dcLocation);
        json.put("vlanPool",vlanPool);
        json.put("securityZone",securityZone);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
	}
	
	function releaseVlan(uuid){

		var URL = "http://jba-d1-int.web.bc:10051/cpsc/nb/api/releaseVlan";
		var httpMethod = new PostMethod(URL); 
		var client = new HttpClient();
		httpMethod.addRequestHeader("Content-type", "application/json");
		httpMethod.setRequestHeader('Accept','application/json');
	
		//Creating the JSON payload
		var json = new JSONObject();
     
        json.put("uuid",uuid);
        
        var dataPayload = json.toString();
        logger.addInfo("Payload is "+dataPayload);
	
		requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
		httpMethod.setRequestEntity(requestEntity);
		client.executeMethod(httpMethod);
		var statuscode = httpMethod.getStatusCode();
		var response = httpMethod.getResponseBodyAsString();
		if (statuscode != 200)
		{   
			logger.addError("Unable to get a new name for the server. HTTP response code: " + statuscode);
			logger.addError("Response = "+response);
		 	httpMethod.releaseConnection();
		    // Set this task as failed.
			ctxt.setFailed("Request failed.");
			ctxt.exit();
	    } 
		logger.addInfo("Response = "+response);
		logger.addInfo("Response Code= "+statuscode);
		
	}
	