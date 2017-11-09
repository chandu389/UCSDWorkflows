/*
Name: TM-GetVmwareSCSId.js
Author: Alejandro Madurga (almadurg@cisco.com)
Date: 05th Feb 2016
Version: 0.1
UCSD Version: 5.3.2.1
PSC Version 11.1 

Description:
	Gets the SCSI Id for a given Vmware VM and Disk Label
	//INPUTS:
		VCenterAccount: [VcenterSelecter] MANDATORY
		VMName: [Generic Text Input] MANDATORY --> The VM Name to search for
		DiskLabel: [Generic Text Input] --> The disk label to search for.
					
	//OUTPUTS
		OUTPUT_SCSI_ID;
		OUTPUT_FULL_DISK_NAME;
*/


//IMPORTS
importPackage(java.net); 
importPackage(com.vmware.vim25); 
importPackage(com.vmware.vim25.mo); 
importPackage(java.util); 
importPackage(com.cloupia.service.cIM.inframgr); 


//MAIN
var VCenterAccount = String(input.VCenterAccount);
var VMName = String(input.VMName);
var DiskLabel = String(input.DiskLabel);
var account = InfraPersistenceUtil.getAccount(VCenterAccount); 
serviceInstance = new ServiceInstance(new URL("https://" + account.getVServer() + "/sdk"), account.getVUserId(), account.getVPasswd(),true); 
var rootFolder = serviceInstance.getRootFolder(); 
var vm = new InventoryNavigator(rootFolder).searchManagedEntity("VirtualMachine", VMName);
var vmConfig = vm.getConfig(); 
var vds = vmConfig.getHardware().getDevice();
var ControllerKey = "";
var busNumber = "";
var UnitNumber = "";
for(var k=0;k<vds.length;k++)
{	
	
	if(vds[k].getDeviceInfo().getLabel().equalsIgnoreCase(DiskLabel))
		
	{
		ControllerKey = String(vds[k].getControllerKey());
		UnitNumber=vds[k].getUnitNumber();
		break;
	}
	
}
for(var k=0;k<vds.length;k++)
{

	if(String(vds[k].getKey()) == ControllerKey)
	{
		busNumber = vds[k].getBusNumber();
		break;
	}
	
}
output.OUTPUT_SCSI_ID = "SCSI(" + String(busNumber) + ":" + String(UnitNumber) + ")";
output.OUTPUT_FULL_DISK_NAME = DiskLabel + "-" + "SCSI(" + String(busNumber) + ":" + String(UnitNumber) + ")";

