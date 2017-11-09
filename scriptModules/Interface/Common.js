/*
Name: Common.js
Author: Neha Gupta
Creation Date: 26th Oct 2017
Updated date: 
Updated by : nehag2
Updated Comment : Added Register_Undo Task Method
Version: 1.0
UCSD Version: 6.5

Description:
-->This libaray has routines which are common for all other libraries. Following are available FUNCTIONS in current version

FUNCTIONs
  1)Register_UndoTask - Generic routine for registering undo tasks
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
importPackage(com.cloupia.lib.cIaaS.vcd.api);;
importPackage(org.apache.commons.httpclient.auth);
importPackage(org.json);
importPackage(org.json.simple.parser.JSONParser);
//Global Variables here
var CommonExecutionPath="Interface/Common";

//FUNCTIONS

function Register_UndoTask(TaskName,Inputs,AssetID,AssetDescription){
  logger.addInfo("Executing "+CommonExecutionPath+"/Register_UndoTask");
	var handler = TaskName;
	var task = ctxt.createInnerTaskContext(TaskName);
  var inputs=Inputs.split("#@#");
  inputs.forEach(function(input){
  var key_value=input.split("=");
  logger.addInfo("Key is :"+key_value[0]+",Value is:"+key_value[1]);
  task.setInput(key_value[0],key_value[1]);
  });
	ctxt.getChangeTracker().undoableResourceModified(AssetID,
                String(ctxt.getSrId()),
                AssetID,
				        AssetDescription,
                handler,
                task.getConfigObject());
}
