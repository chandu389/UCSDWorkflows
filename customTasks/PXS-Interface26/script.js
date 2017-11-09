/*
Name: PXS-Interface26
Author: Neha Gupta (nehag2@cisco.com)
Date: 28th September 2017
Version: 1.0
UCSD Version: 6.5


Description:
	This Custom task implements Interface 6. Execute one script on a VM
	
	//INPUTS:

		vmMetadata: [GenericTextInput] OPTIONAL
		requestedVCpu: [GenericTextInput] MANDATORY
		requestedMemory: [GenericTextInput] MANDATORY
		requestedStorage: [GenericTextInput] MANDATORY
	    requesterInformation: [GenericTextInput] OPTIONAL
        uniqueId: [GenericTextInput] MANDATORY
        serverName: [GenericTextInput] MANDATORY

	//OUTPUTS
		imdApprovalUuid: [Generic Text Input] MANDATORY
              
*/
//
//	MAIN PROGRAM
//

//Load  DNS Library
  loadLibrary("Interface/InterfaceAPI");

var vmMetadata = String(input.vmMetadata);
var requestedVCpu  = String(input.requestedVCpu);
var requestedMemory  = String(input.requestedMemory);
var requestedStorage  = String(input.requestedStorage);
var requesterInformation  = String(input.requesterInformation);
var serverName  = String(input.serverName);
var uniqueId  = String(input.uniqueId);
	
//Show Connection Info.
logger.addInfo("Using the following parameters: ");
logger.addInfo(" ---- serverName: " + serverName );
logger.addInfo(" ---- uniqueId: " + uniqueId);
logger.addInfo(" ---- requestedVCpu: " + requestedVCpu);
logger.addInfo(" ---- requestedMemory: " + requestedMemory);
logger.addInfo(" ---- requestedStorage: " + requestedStorage);
logger.addInfo(" ---- requesterInformation: " + requesterInformation);


var response = requestImdApproval(vmMetadata,requestedVCpu,requestedMemory,requestedStorage,requesterInformation,serverName,uniqueId);

