/*
Name: PXS-Interface27
Author: Neha Gupta (nehag2@cisco.com)
Date: 28th September 2017
Version: 1.0
UCSD Version: 6.5


Description:
	This Custom task implements Interface 27.To cancel IMD request
	
	//INPUTS:
		imdApprovalUuid: [GenericTextInput] MANDATORY UUID of received in the IMD Approval response
	
	//OUTPUTS
	    NA
               
*/
//
//	MAIN PROGRAM
//

//Load  DNS Library
  loadLibrary("Interface/InterfaceAPI");

var imdApprovalUuid  = String(input.imdApprovalUuid);
	
//Show Connection Info.
logger.addInfo("Using the following parameters: ");
logger.addInfo(" ---- imdApprovalUuid: " + imdApprovalUuid );


var response = cancelImdApproval(imdApprovalUuid);
