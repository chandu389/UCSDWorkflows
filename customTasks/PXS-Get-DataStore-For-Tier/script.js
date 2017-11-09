/*
Name: TM-Get-DataStore.js
Author: G V R Chandra Reddy (vgolugur@cisco.com)
Date: 11th October 2017
Version: 0.1

Description:
	This task returns a datastore for a specified storage tier based on
	storage policy for a Customer

	//INPUTS:
		[GenericTextInput] MANDATORY --> disksizeGB
		[GenericTextInput] MANDATORY --> vdcName


	//OUTPUTS:
		dataStoreName [datastore]

*/

//IMPORTS
importPackage(java.lang);
importPackage(java.util);
importPackage(java.io);
importPackage(com.cloupia.service.cIM.inframgr);
importPackage(com.cloupia.service.cIM.inframgr.dynallocation);


//FUNCTIONS

function selectVMWareDataStore(customerStoragePolicy, diskSizeGB,primaryVMDataStore){
	var pt = new PolicyTrace();
	var cloudScopeManager = new PrivateCloudScopeManager(pt);
	var allocationScope = cloudScopeManager.populateInitialScopeData(customerStoragePolicy.getCloudName());
	cloudScopeManager.applyStoragePolicy(allocationScope, customerStoragePolicy, diskSizeGB, customerStoragePolicy.getCloudName() );

	var candidateDataStores = allocationScope.getDataStores();
	var messages = pt.getTraceMessages();
	for(var i=0; i < messages.size(); i++ ){
		logger.addInfo(messages.get(i));
	}
	logger.addInfo("Candidate Datastores: " + candidateDataStores.size());

	for(var idx = 0;idx<candidateDataStores.size();idx++){
		if(candidateDataStores.get(idx).getName() == primaryVMDataStore){
			logger.addInfo("Selected Primary VM Datastore: "+ candidateDataStores.get(idx).getName());
			return candidateDataStores.get(idx);
		}
	}

	if(candidateDataStores.size() > 0 ){
		var rnd = new Random();
		var dataStoreIndex = rnd.nextInt(candidateDataStores.size());
		var dataStore = candidateDataStores.get(dataStoreIndex);
		logger.addInfo("Selected Datastore: " + dataStore.getName());
		return dataStore;
	} else {
		ctxt.setFailed("No Suitable Datastore matching storage policy requirements found...!");
		ctxt.exit();
		return null;
	}
}

function getCustomerStoragePolicy(vdcName){
	var vdc = VDCUtil.getVDCByName(vdcName);
	var storagePolicy = vdc.getStoragePolicy();
	logger.addInfo("Selected Storage Policy" + storagePolicy);
	//logger.addInfo("Storage Policy" + storagePolicy.getPolicyName());
	return InfraPersistenceUtil.getPrivateCloudStoragePolicy(storagePolicy);

}


//MAIN
//var storageTier = String(input.storageTier);
var diskSizeGB = input.diskSizeGB;
//var clusterName = String(input.clusterName);
//var groupId = input.groupId;
//var groupName = String(input.groupName);
var vdcName = String(input.vdcName);
var cloudName = String(input.cloudName);
var VMName = String(input.VMName);

//Vebose LOG
logger.addInfo("############ INPUT VARIABLES #######################");
//logger.addInfo("storageTier: " + storageTier );
//logger.addInfo("clusterName: " + clusterName );
logger.addInfo("diskSizeGB: " + diskSizeGB );
//logger.addInfo("groupId: " + groupId );
//logger.addInfo("groupName: " + groupName );
logger.addInfo("vdcName: " + vdcName );
logger.addInfo("VMWare Account Name:"+cloudName);


logger.addInfo("############ STARTING TASK #######################");

var customerStoragePolicy = null;
customerStoragePolicy = getCustomerStoragePolicy(vdcName);

var VMDataStores = InfraPersistenceUtil.getVMDiskConfigByCloudAndVMName(cloudName,VMName);
var primaryVMDataStore = VMDataStores[0].datastore;

logger.addInfo("primaryVMDataStore:"+primaryVMDataStore);

logger.addInfo("Selected Policy: " + customerStoragePolicy.getPolicyName());

var dataStore = selectVMWareDataStore(customerStoragePolicy, diskSizeGB,primaryVMDataStore);
if( dataStore == null ){
	ctxt.setFailed("Can't find data store for the cloudType...!");
	ctxt.exit();
}

output.dataStoreName = dataStore.getName();
