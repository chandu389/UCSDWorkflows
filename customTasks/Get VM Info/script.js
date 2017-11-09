/*
Name: PXS-Get-VMInfo.js
Author: G V R Chandra Reddy (vgolugur@cisco.com)
Date: 8th September 2017
Version: 0.1

Description:
    Finds a VM Id from VM Name

    //INPUTS:
        VMName:       [GenericTextInput] MANDATORY --> VMWare VMName

    //OUTPUTS:
        vmwareVMId


*/

//IMPORTS
importPackage(java.lang);
importPackage(java.util);
importPackage(com.cloupia.service.cIM.inframgr);

//FUNCTIONS

/*
    Retrives VDC Id for a Customer ID
*/

function getVMId(vmName,vmwareAccount){
    var vmwareVm = InfraPersistenceUtil.getVMByVMName( vmwareAccount, vmName );
    if( vmwareVm !== null ){
        logger.addInfo("Found VMWare VM with Id: " + vmwareVm.getInstanceId() + " -> " + vmwareVm.getVmId() );
        return vmwareVm.getVmId();
    }
    ctxt.setFailed("Can't find request VM in VMware Cloud....!!!");
    ctxt.exit();
}

/* Retrieves VM Parent Host */

function getVMInfo(vmId){
        var genericVM = InfraPersistenceUtil.getVMUniqueIdByVMId(vmId);
        //return [ genericVM.getAccountName(), genericVM.getParentHost() ];
        return genericVM;
}

/* Retrieves Vm Data*/

function getVMData(vmId){
    return VMViewUtils.getVMDataViewForOneVM(vmId);
}

var vmid = getVMId(input.VMName,input.vmwareAccount);
var vmData = getVMData(vmid);
var vmSummary = InfraPersistenceUtil.getVMwareVMSummary(parseInt(vmid));
output.vmID = vmid;
output.vmPowerStatus = vmData.getPowerStatus();
//output.memory = parseInt(vmSummary.getMemoryMB()/1024);
output.memory = vmSummary.getMemoryMB();
output.CPU = vmSummary.getNumCPUs();
output.OS = vmSummary.getGuestOS();
output.vmwareAccountid = vmData.getAccountName();
