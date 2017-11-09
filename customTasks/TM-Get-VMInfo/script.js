/**
 * @file
 * Finds VM Info for a VM based on VM Name.
 *
 *	 INPUTS:
 *		{GenericTextInput} VMName The VM Name to look for.
 *
 *	 OUTPUTS:
 *		{GenericTextInput} vmId
 *		{GenericTextInput} vmAccountName
 *		{GenericTextInput} vmParentHost
 *		{GenericTextInput} vmGroupId
 *		{GenericTextInput} vmGroupName
 *		{GenericTextInput} vmVdcId
 *		{GenericTextInput} vmVdcName
 *		{GenericTextInput} vmIpAddress
 *		{GenericTextInput} vmPowerStatus
 *		{GenericTextInput} vmEffectivePowerStatus
 *		{GenericTextInput} SummaryMACAddress
 *		{GenericTextInput} SummaryVMVlan
 *		{GenericTextInput} OS
 *
 *
 * @author Rizwan Sarwar <risarwar@cisco.com>
 * @version  0.1
 * @Date 28th January 2016
 * @namespace TM-Get-VMInfo
 */

//IMPORTS

importPackage(java.lang);
importPackage(java.util);
importPackage(com.cloupia.service.cIM.inframgr);
importPackage(com.cloupia.feature.accounts);
importPackage(com.cloupia.fw.objstore);
importPackage(com.cloupia.model.cIM);
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);
importPackage(com.cloupia.feature.hypervController.userApi);
importPackage(com.cloupia.feature.hypervController);
importPackage(com.cloupia.lib.cIaaS.hyperv.model);
importPackage(com.cloupia.lib.cIaaS.hyperv.psapi);
importPackage(com.cloupia.lib.cIaaS.hyperv.util);
importClass(com.cloupia.lib.util.JSON);


//FUNCTIONS

/**
 *	Log in into the SCVMM Server
 *
 *	@param {Credentials} creds The credentials for log in into the SCVMM server.
 *
 *  @returns {API} The API Connection to the SCVMM server.
 *
 *	@memberof TM-Get-VMInfo
*/
function accessHyperVAccount(creds){
	var agent = InfraPersistenceUtil.getWinRemoteAgent(creds.gethPSAgentIP());
	var remoteAgent = new RemoteAgent(agent.getAddress(),agent.getPortNumber(), agent.getAccessKey());
	var targetServer = new TargetServer(creds.getHServer(),creds.gethDomain() + "\\" + creds.getHUserId(),creds.getHPasswd());
	var api = new SCVMMAPI(remoteAgent, targetServer,SCVMMAPI.TIME_5_MINS);
	return api;
}

/**
 *	Execute Hyper-V Command
 *
 *	@param {GenericTextInput} command The command to execute on the SCVMM Server.
 *  @param {api} apiInstance The connected API instance from SCVMM Server.
 *
 *  @returns {Response} The response from the command execution.
 *
 *	@memberof TM-Get-VMInfo
*/
function executeHyperVCommand(command,apiInstance){
	try{
		var response=apiInstance.getResponse(command);

	}catch(e){
		ctxt.setFailed("Error executing the command: " + String(e.message));
		apiInstance.closeRemoteSession();
		ctxt.exit()
	}
	return response;
}

/**
 *	Show the response attributes and values on the Log
 *
 *	@param {Response} response Response where to extract the parameters.
 *
 *
 *	@memberof TM-Get-VMInfo
*/
function logResponse(response){

	if(response.objects != undefined){
		var objects = response.getObjects()
		if(objects.length > 0){
			for(var i=0; i < objects.length; i++ ){
				var properties = objects[i].getProperties()
				for(j=0; j < properties.length; j++ ){
					logger.addInfo(properties[j].getName() + ": " + properties[j].getValue())
				}
			}
		}
		else{
			logger.addInfo("No objects received from the command execution");
		}
	}
	else{
			logger.addInfo("No response received from the command execution");
	}
}

/**
 *	Convert the Response on a HASHMAP object for further use.
 *
 *	@param {Response} response Response where to extract the parameters.
 *
 *  @returns {HashMap} A HashMap object with all the Name/Value pairs from the Response Object.
 *
 *	@memberof TM-Get-VMInfo
*/
function getResponseHashMap(response){
	var responseValues = new HashMap()
	if(response.objects != undefined){
		var objects = response.getObjects();
		if(objects.length > 0){
			var properties = objects[0].getProperties()
			for(i=0;i<properties.length;i++){
				var key = properties[i].getName();
				var val = properties[i].getValue();
				var type = properties[i].getType();
				if( /^System.Collections.Generic.List.*/.test(type) ){
					var subProperties = properties[i].getProperties();
					if(subProperties.size() > 0 ){
						var subVal = subProperties.get(0).value;
						responseValues.put( key,subVal );
					} else{
						responseValues.put( key, null );
					}
				} else {
					responseValues.put( key, val);
				}
			}
		}
	}
	return responseValues;
}

/**
 *	Retrieves the VM data from a given VMId
 *
 *	@param {Integer} vmId The VMId
 *
 *  @returns {VMView} The VM Info.
 *
 *	@memberof TM-Get-VMInfo
*/
function getVMData(vmId){
	return VMViewUtils.getVMDataViewForOneVM(vmId);
}

/**
 *	Retrieves the VM Summary
 *
 *	@param {Integer} vmId
 *	@param {string} VMName
 *	@param {string} CloudType
 *	@param {string} cloudAccount
 *
 *  @returns {HashMap} The VM Data.
 *
 *	@memberof TM-Get-VMInfo
*/
function getVMSummary(vmId, VMName, cloudType, cloudAccount){
		var returnData = new HashMap();
		if( cloudType == "VM"){
			var vmSummary = InfraPersistenceUtil.getVMWareVMSummary(vmId);
			returnData.put("SummaryIPAddress", vmSummary.getVmIPAddr());
			returnData.put("SummaryMACAddress", vmSummary.getVmMacAddr());
			returnData.put("OS", vmSummary.getGuestOS());
			return returnData;
		} else if( cloudType == "HY"){
			var response = null; // Placeholder for response
			var command = null; // placehodler for commands

			var creds = InfraPersistenceUtil.getAccount(cloudAccount);
			var api = accessHyperVAccount(creds);
			api.openRemoteSession();

			//Try to set the SCVMM server
			//response = executeHyperVCommand("get-vmmserver -computername " + creds.getHServer(),api);
			logResponse( executeHyperVCommand("get-vmmserver -computername " + creds.getHServer(), api) );
			//Search for the VM object

			command = "Get-SCVirtualMachine -Name \"" + VMName + "\" | Get-SCVirtualNetworkAdapter";
			response = executeHyperVCommand(command,api);
			logResponse(response);

			var resHash = getResponseHashMap(response);
			returnData.put("SummaryIPAddress", resHash.get("IPv4Addresses") );
			returnData.put("SummaryMACAddress", resHash.get("MACAddress") );
			command = "Get-SCVirtualMachine -Name \"" + VMName + "\"";
			response = executeHyperVCommand(command,api);
			api.closeRemoteSession();
			resHash = getResponseHashMap(response);
			returnData.put("OS", resHash.get("OperatingSystem"));

			return returnData;
		} else {
			return null;
		}
}


/**
 *	Retrieves the VM ID
 *
 *	@param {string} VMName
 *	@param {string} cloudType
 *
 *  @returns {integer} The VM ID.
 *
 *	@memberof TM-Get-VMInfo
*/
function getVMId(vmName, cloudType){
	var vmAccounts = null;
	if( cloudType == "VM" ){
		vmAccounts = InfraPersistenceUtil.getAllVMWareAccounts();
	} else if( cloudType == "HY" ){
		vmAccounts = InfraPersistenceUtil.getAllHypervAccounts();
	} else{
		ctxt.setFailed("Can't find requested VM Cloud....!!!");
		ctxt.exit();
	}

	for(i = 0; i < vmAccounts.length; i++ ){
		var vmAccount = vmAccounts[i];
		logger.addInfo("Seaching VM in Account: " + vmAccount.getAccountName() );

		var vm = InfraPersistenceUtil.getVMByVMName( vmAccount.getAccountName(), vmName );
		if( vm != null ){
			logger.addInfo("Found VM with Id: " + vm.getInstanceId() + " -> " + vm.getVmId() );
			return vm.getVmId();
		}
	}
	ctxt.setFailed("Can't find request VM in Cloud....!!!");
	ctxt.exit();
}

//MAIN
var vmName = String(input.vmName);
var cloudType = String(input.cloudType);


//Vebose LOG
logger.addInfo("############ INPUT VARIABLES #######################");
logger.addInfo("vmName: " + vmName );
logger.addInfo("cloudType: " + cloudType );


logger.addInfo("############ STARTING TASK #######################");
var vmId = getVMId(vmName, cloudType);
logger.addInfo("Found VM with ID: " + vmId );
var vmInfo = getVMData(vmId);
var vmSummary  = getVMSummary(vmId, vmName, cloudType, vmInfo.getAccountName() );
var vmVlan = vmInfo.getVdcName().split("_").pop();
var MACAddress = String(vmSummary.get("SummaryMACAddress"));
if (vmSummary.get("SummaryIPAddress") == null){
	ctxt.setFailed("VM does not have a valid IP!!!")
	ctxt.exit();
}
var IPs = vmSummary.get("SummaryIPAddress").split(",");
var IP = "";
for (i=0;i<IPs.length;i++){
	if(String(IPs[i]).indexOf(":") == -1)
	{
		IP = IPs[i];
		break;
	}
}
/* Added this line to ensure that if Summary IP is not set the try to set
  the ip address from standard call.
*/
if( IP == "" || IP == null ){
  IP = vmInfo.getIpAddress();
}

if (IP == "" || IP == null ){
	ctxt.setFailed("VM does not have a valid IP!!!")
	ctxt.exit();
}

MACAddress = MACAddress.replace(/:/g, "-");
MACAddress = MACAddress.toUpperCase();
output.vmId = vmId;
output.vmwareAccount = vmInfo.getAccountName();
output.hypervAccount = vmInfo.getAccountName();
output.vmParentHost = vmInfo.getParentHost();
output.vmGroupId = vmInfo.getGroupId();
output.vmGroupName = vmInfo.getGroupName();
output.vmVdcId = vmInfo.getVdcId();
output.vmVdcName = vmInfo.getVdcName();
output.vmIpAddress = vmInfo.getIpAddress();
output.vmPowerStatus = vmInfo.getPowerStatus();
output.vmEffectivePowerStatus = vmInfo.getEffectivePowerStatus();
output.SummaryIPAddress = IP;
output.SummaryMACAddress = MACAddress
output.SummaryVMVlan = "VLAN" + vmVlan;
output.OS = vmSummary.get("OS").toUpperCase();

