/*
Name: TM-Get-DataStore-For-Tier.js
Author: Rizwan Sarwar (risarwar@cisco.com)
Date: 28th January 2016
Version: 0.1

Description:
	This task returns a datastore for a specified storage tier based on
	storage policy for a Customer

	//INPUTS:
		[GenericTextInput] MANDATORY --> vmName
		[GenericTextInput] MANDATORY --> vmId
		[GenericTextInput] MANDATORY --> groupId
		[GenericTextInput] MANDATORY --> vdcId
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

function selectVMWareDataStore(customerStoragePolicy, diskSizeGB){
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

function selectHyperVDataStore(customerStoragePolicy, diskSizeGB){
	var pt = new PolicyTrace();
	var cloudScopeManager = new HypervCloudScopeManager(pt);
	var allocationScope = cloudScopeManager.populateInitialScopeData(customerStoragePolicy.getCloudName(), null, null);
	allocationScope.setHighlyAvailable(true);
	cloudScopeManager.applyStoragePolicy(allocationScope, null, customerStoragePolicy, diskSizeGB );

	var candidateDataStores = allocationScope.getDataStores();
	var messages = pt.getTraceMessages();
	for(var i=0; i < messages.size(); i++ ){
		logger.addInfo(messages.get(i));
	}
	logger.addInfo("Candidate Datastores: " + candidateDataStores.size());
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


function getCustomerStoragePolicy(storageTier, clusterName, groupId, groupName, cloudType){
	var vdcList = VDCUtil.getVDCByGrpId(groupId);
	for(var i=0; i < vdcList.size(); i++ ){
		var vdc = vdcList.get(i);
		var vdcName = vdc.getVdcName();
		var vdcCustomer = vdcName.split("_")[0];
		var vdcCloud = vdcName.split("_")[1];
		var vdcPod = vdcName.split("_")[2];
		var vdcCluster = vdcName.split("_")[3];
		var vdcStorageTier = vdcName.split("_")[4];

		var vdcPodCluster = vdcPod + "_" + vdcCluster;
		logger.addInfo("Processing VDC: " + vdcName);

		if( (vdcCustomer == groupName) &&
				(vdcCloud.toUpperCase() == cloudType.toUpperCase()) &&
				(vdcPodCluster.toUpperCase() == clusterName.toUpperCase()) &&
				(vdcStorageTier.toUpperCase() == storageTier.toUpperCase()) ){
					logger.addInfo("VDC Discovered for VM: " + vdcName );
					var storagePolicy = vdc.getStoragePolicy();
					logger.addInfo("Selected Storage Policy" + storagePolicy);
					//logger.addInfo("Storage Policy" + storagePolicy.getPolicyName());
					if( cloudType == "VM" ){
						return InfraPersistenceUtil.getPrivateCloudStoragePolicy(storagePolicy);
					} else if( cloudType == "HY" ){
						return InfraPersistenceUtil.getHyperVStoragePolicyByName(storagePolicy);
					} else {
						ctxt.setFailed("Can't find storage policy for selected cloudType...!");
						ctxt.exit();
						return null;
					}
		}
	}
	ctxt.setFailed("No Suitable VDC matching storage policy requirements...!");
	ctxt.exit();
	return null;
}


//MAIN
var storageTier = String(input.storageTier);
var diskSizeGB = input.diskSizeGB;
var clusterName = String(input.clusterName);
var groupId = input.groupId;
var groupName = String(input.groupName);
var vdcName = String(input.vdcName);

//Vebose LOG
logger.addInfo("############ INPUT VARIABLES #######################");
logger.addInfo("storageTier: " + storageTier );
logger.addInfo("clusterName: " + clusterName );
logger.addInfo("diskSizeGB: " + diskSizeGB );
logger.addInfo("groupId: " + groupId );
logger.addInfo("groupName: " + groupName );
logger.addInfo("vdcName: " + vdcName );


logger.addInfo("############ STARTING TASK #######################");
var cloudType = vdcName.split("_")[1];
var customerStoragePolicy = null;
customerStoragePolicy = getCustomerStoragePolicy(storageTier, clusterName, groupId, groupName, cloudType);


logger.addInfo("Selected Policy: " + customerStoragePolicy.getPolicyName());

var dataStore;
if( cloudType == "VM" ){
	dataStore = selectVMWareDataStore(customerStoragePolicy, diskSizeGB);
} else if (cloudType == "HY" ){
	dataStore = selectHyperVDataStore(customerStoragePolicy, diskSizeGB);
} else {
	ctxt.setFailed("Can't find data store for the cloudType...!");
	ctxt.exit();
}

if( cloudType == "HY" ){
	output.dataStoreName = dataStore.getMountPath();
} else {
	output.dataStoreName = dataStore.getName();
}

